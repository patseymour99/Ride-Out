export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  EVENT_JOINED = 'EVENT_JOINED',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  POST_LIKED = 'POST_LIKED',
  POST_COMMENTED = 'POST_COMMENTED',
  EBAY_INVITE = 'EBAY_INVITE',
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}
