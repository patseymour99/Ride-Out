import { PublicUser } from './user.types';

export enum PostType {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  RIDE_SHARE = 'RIDE_SHARE',
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  content: string | null;
  photoUrls: string[];
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
  author: PublicUser;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: PublicUser;
}
