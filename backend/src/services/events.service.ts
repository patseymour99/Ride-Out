import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { Prisma } from '@prisma/client';

const EVENT_INCLUDE = {
  host: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
    },
  },
  _count: { select: { participants: true } },
};

export async function listEvents(
  query: {
    lat?: string; lng?: string; radiusKm?: string;
    dateFrom?: string; dateTo?: string;
    bikeType?: string; difficulty?: string; search?: string;
    page?: string; limit?: string;
  },
  userId?: string
) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.EventWhereInput = {
    status: 'PUBLISHED',
  };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { meetingPoint: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.bikeType) where.bikeType = query.bikeType as any;
  if (query.difficulty) where.difficulty = query.difficulty as any;

  if (query.dateFrom || query.dateTo) {
    where.startsAt = {};
    if (query.dateFrom) where.startsAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.startsAt.lte = new Date(query.dateTo);
  }

  // Simple bounding box filter when lat/lng/radius provided
  if (query.lat && query.lng && query.radiusKm) {
    const lat = parseFloat(query.lat);
    const lng = parseFloat(query.lng);
    const r = parseFloat(query.radiusKm);
    const latDelta = r / 111;
    const lngDelta = r / (111 * Math.cos((lat * Math.PI) / 180));
    where.meetingLat = { gte: lat - latDelta, lte: lat + latDelta };
    where.meetingLng = { gte: lng - lngDelta, lte: lng + lngDelta };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startsAt: 'asc' },
      include: EVENT_INCLUDE,
    }),
    prisma.event.count({ where }),
  ]);

  // Hydrate isJoined if userId provided
  let joinedIds = new Set<string>();
  if (userId) {
    const participations = await prisma.eventParticipant.findMany({
      where: { userId, eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true },
    });
    joinedIds = new Set(participations.map((p) => p.eventId));
  }

  return {
    data: events.map((e) => ({ ...e, isJoined: joinedIds.has(e.id) })),
    pagination: buildPaginationMeta(total, page, limit),
  };
}

export async function getEvent(eventId: string, userId?: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ...EVENT_INCLUDE,
      participants: {
        where: { status: 'CONFIRMED' },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
            },
          },
        },
      },
    },
  });

  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');

  let isJoined = false;
  if (userId) {
    const participation = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    isJoined = !!participation;
  }

  return { ...event, isJoined };
}

export async function createEvent(hostId: string, data: {
  title: string; description?: string; startsAt: string; endsAt?: string;
  meetingPoint: string; meetingLat: number; meetingLng: number;
  bikeType?: string; difficulty?: string; maxParticipants?: number;
  waypoints?: unknown;
}) {
  return prisma.event.create({
    data: {
      hostId,
      title: data.title,
      description: data.description,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      meetingPoint: data.meetingPoint,
      meetingLat: data.meetingLat,
      meetingLng: data.meetingLng,
      bikeType: (data.bikeType as any) ?? 'BOTH',
      difficulty: (data.difficulty as any) ?? 'INTERMEDIATE',
      maxParticipants: data.maxParticipants,
      waypoints: data.waypoints ? (data.waypoints as Prisma.InputJsonValue) : undefined,
    },
    include: EVENT_INCLUDE,
  });
}

export async function updateEvent(eventId: string, hostId: string, data: Partial<{
  title: string; description: string; startsAt: string; endsAt: string;
  meetingPoint: string; meetingLat: number; meetingLng: number;
  bikeType: string; difficulty: string; maxParticipants: number;
}>) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  if (event.hostId !== hostId) throw new AppError(403, 'FORBIDDEN', 'Only the host can edit this event');

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    },
    include: EVENT_INCLUDE,
  });
}

export async function cancelEvent(eventId: string, hostId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  if (event.hostId !== hostId) throw new AppError(403, 'FORBIDDEN', 'Only the host can cancel this event');

  return prisma.event.update({
    where: { id: eventId },
    data: { status: 'CANCELLED' },
  });
}

export async function joinEvent(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { participants: true } } },
  });
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  if (event.status !== 'PUBLISHED') throw new AppError(400, 'EVENT_NOT_AVAILABLE', 'This event is not open for joining');
  if (event.hostId === userId) throw new AppError(400, 'ALREADY_HOST', 'You are the host of this event');

  if (event.maxParticipants && event._count.participants >= event.maxParticipants) {
    throw new AppError(409, 'EVENT_FULL', 'This event is full');
  }

  const existing = await prisma.eventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (existing) throw new AppError(409, 'ALREADY_JOINED', 'You have already joined this event');

  await prisma.eventParticipant.create({ data: { eventId, userId } });

  // Notify host
  await prisma.notification.create({
    data: {
      recipientId: event.hostId,
      type: 'EVENT_JOINED',
      title: 'New participant joined your ride',
      data: { eventId, userId },
    },
  });

  return { joined: true };
}

export async function leaveEvent(eventId: string, userId: string) {
  const deleted = await prisma.eventParticipant.deleteMany({
    where: { eventId, userId },
  });
  if (deleted.count === 0) {
    throw new AppError(404, 'NOT_JOINED', 'You have not joined this event');
  }
  return { left: true };
}

export async function updateEventCover(eventId: string, hostId: string, coverPhotoUrl: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  if (event.hostId !== hostId) throw new AppError(403, 'FORBIDDEN', 'Only the host can update this event');
  return prisma.event.update({ where: { id: eventId }, data: { coverPhotoUrl } });
}

export async function updateEventGpx(eventId: string, hostId: string, gpxUrl: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  if (event.hostId !== hostId) throw new AppError(403, 'FORBIDDEN', 'Only the host can update this event');
  return prisma.event.update({ where: { id: eventId }, data: { gpxUrl } });
}
