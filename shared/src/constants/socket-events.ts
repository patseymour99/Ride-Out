// Single source of truth for all Socket.io event names.
// Used by backend, web, and mobile to prevent string drift.

export const SocketEvents = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Messaging
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_READ: 'message:read',
  MESSAGE_READ_RECEIPT: 'message:read_receipt',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread_count',
  NOTIFICATION_READ: 'notification:read',

  // Presence
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',

  // Events (Ride-outs)
  EVENT_PARTICIPANT_JOINED: 'event:participant_joined',
  EVENT_PARTICIPANT_LEFT: 'event:participant_left',
  EVENT_CANCELLED: 'event:cancelled',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
