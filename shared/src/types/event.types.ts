import { BikeType, DifficultyLevel, EventStatus, ParticipantStatus } from '../constants/event-types';
import { PublicUser } from './user.types';

export interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface Event {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  status: EventStatus;
  startsAt: string;
  endsAt: string | null;
  meetingPoint: string;
  meetingLat: number;
  meetingLng: number;
  gpxUrl: string | null;
  waypoints: Waypoint[] | null;
  bikeType: BikeType;
  difficulty: DifficultyLevel;
  maxParticipants: number | null;
  coverPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  host: PublicUser;
  participants?: EventParticipant[];
  _count?: {
    participants: number;
  };
  isJoined?: boolean;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: ParticipantStatus;
  joinedAt: string;
  user: PublicUser;
}

export interface EventFilters {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  dateFrom?: string;
  dateTo?: string;
  bikeType?: BikeType;
  difficulty?: DifficultyLevel;
  search?: string;
  page?: number;
  limit?: number;
}
