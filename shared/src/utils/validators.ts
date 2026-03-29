import { z } from 'zod';
import { RidingStyle, BikeType } from '../constants/riding-styles';
import { DifficultyLevel } from '../constants/event-types';

// Auth
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Profile
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ridingStyle: z.nativeEnum(RidingStyle).optional(),
});

// Bike
export const createBikeSchema = z.object({
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.nativeEnum(BikeType),
  notes: z.string().max(500).optional(),
});

// Event
export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  meetingPoint: z.string().min(3).max(200),
  meetingLat: z.number().min(-90).max(90),
  meetingLng: z.number().min(-180).max(180),
  bikeType: z.nativeEnum(BikeType).default(BikeType.BOTH),
  difficulty: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.INTERMEDIATE),
  maxParticipants: z.number().int().min(2).max(500).optional(),
  waypoints: z
    .array(
      z.object({
        lat: z.number(),
        lng: z.number(),
        label: z.string().optional(),
      })
    )
    .optional(),
});

// Post
export const createPostSchema = z.object({
  content: z.string().max(2000).optional(),
  photoUrls: z.array(z.string().url()).max(10).optional(),
  eventId: z.string().optional(),
});

// Message
export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  mediaUrl: z.string().url().optional(),
});

export const createConversationSchema = z.object({
  participantId: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateBikeInput = z.infer<typeof createBikeSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
