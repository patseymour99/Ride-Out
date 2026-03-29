import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '@ride-out/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { formatDateTime } from '@ride-out/shared';

const difficultyVariant = {
  BEGINNER: 'green',
  INTERMEDIATE: 'blue',
  ADVANCED: 'orange',
  EXPERT: 'red',
} as const;

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  joinLoading?: boolean;
}

export function EventCard({ event, onJoin, onLeave, joinLoading }: EventCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:border-brand-orange/40 transition-colors">
      {event.coverPhotoUrl && (
        <div className="h-36 overflow-hidden">
          <img
            src={event.coverPhotoUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="font-display text-lg font-bold text-brand-text leading-tight cursor-pointer hover:text-brand-orange transition-colors"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            {event.title}
          </h3>
          <div className="flex gap-1.5 flex-shrink-0">
            <Badge variant={difficultyVariant[event.difficulty] as any}>
              {event.difficulty}
            </Badge>
            <Badge variant={event.bikeType === 'OFF_ROAD' ? 'green' : event.bikeType === 'ON_ROAD' ? 'blue' : 'muted'}>
              {event.bikeType.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-brand-muted mb-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDateTime(event.startsAt)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-brand-muted mb-4">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.meetingPoint}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar
              src={event.host.profile?.avatarUrl}
              name={event.host.profile?.displayName}
              size="xs"
            />
            <span className="text-xs text-brand-muted">
              {event.host.profile?.displayName}
            </span>
            {event._count && (
              <span className="text-xs text-brand-muted">
                · {event._count.participants} joined
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
              </span>
            )}
          </div>

          {onJoin && !event.isJoined && (
            <Button size="sm" onClick={() => onJoin(event.id)} loading={joinLoading}>
              Join
            </Button>
          )}
          {onLeave && event.isJoined && (
            <Button size="sm" variant="secondary" onClick={() => onLeave(event.id)} loading={joinLoading}>
              Leave
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
