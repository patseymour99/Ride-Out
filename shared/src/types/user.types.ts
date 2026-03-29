import { RidingStyle, BikeType } from '../constants/riding-styles';

export interface PublicUser {
  id: string;
  profile: {
    displayName: string;
    avatarUrl: string | null;
    location: string | null;
    ridingStyle: RidingStyle;
  } | null;
}

export interface UserProfile {
  id: string;
  email: string;
  profile: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    ridingStyle: RidingStyle;
  } | null;
  bikes: Bike[];
  _count: {
    followers: number;
    following: number;
    hostedEvents: number;
  };
  isFollowing?: boolean;
}

export interface Bike {
  id: string;
  make: string;
  model: string;
  year: number;
  type: BikeType;
  photoUrl: string | null;
  notes: string | null;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}
