import React, { Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events.api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { formatDateTime } from '@ride-out/shared';
import { useAuthStore } from '../../store/auth.store';

const EventMap = lazy(() => import('../../components/events/EventMap').then(m => ({ default: m.EventMap })));

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId!),
    enabled: !!eventId,
  });

  const joinMutation = useMutation({
    mutationFn: () => eventsApi.join(eventId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => eventsApi.leave(eventId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  if (isLoading) return <PageSpinner />;
  const event = data?.data.data;
  if (!event) return <div className="text-brand-muted text-center py-16">Event not found</div>;

  const isHost = user?.id === event.hostId;
  const isJoined = event.isJoined;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-brand-muted hover:text-brand-text">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      {event.coverPhotoUrl && (
        <div className="h-52 rounded-xl overflow-hidden">
          <img src={event.coverPhotoUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="font-display text-2xl font-bold text-brand-text">{event.title}</h1>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant={event.bikeType === 'OFF_ROAD' ? 'green' : event.bikeType === 'ON_ROAD' ? 'blue' : 'muted'}>
              {event.bikeType.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {event.description && (
          <p className="text-brand-text-secondary text-sm leading-relaxed mb-4">{event.description}</p>
        )}

        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2.5 text-sm">
            <svg className="w-4 h-4 text-brand-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-brand-text">{formatDateTime(event.startsAt)}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <svg className="w-4 h-4 text-brand-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-brand-text">{event.meetingPoint}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <svg className="w-4 h-4 text-brand-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-brand-text">
              {event._count?.participants ?? 0} joined
              {event.maxParticipants ? ` / ${event.maxParticipants} max` : ''}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {!isHost && (
          <div className="flex gap-3">
            {!isJoined ? (
              <Button onClick={() => joinMutation.mutate()} loading={joinMutation.isPending} className="flex-1">
                Join Ride-Out
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => leaveMutation.mutate()} loading={leaveMutation.isPending} className="flex-1">
                Leave Ride-Out
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <Suspense fallback={<div className="h-64 card animate-pulse" />}>
        <EventMap lat={event.meetingLat} lng={event.meetingLng} label={event.meetingPoint} />
      </Suspense>

      {/* Host */}
      <div className="card p-4">
        <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">Hosted by</p>
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80"
          onClick={() => navigate(`/profile/${event.hostId}`)}
        >
          <Avatar src={event.host.profile?.avatarUrl} name={event.host.profile?.displayName} />
          <span className="font-medium text-brand-text">{event.host.profile?.displayName}</span>
        </div>
      </div>

      {/* Participants */}
      {event.participants && event.participants.length > 0 && (
        <div className="card p-4">
          <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">Riders going</p>
          <div className="flex flex-wrap gap-3">
            {event.participants.map((p) => (
              <button
                key={p.userId}
                onClick={() => navigate(`/profile/${p.userId}`)}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <Avatar src={p.user.profile?.avatarUrl} name={p.user.profile?.displayName} size="sm" />
                <span className="text-sm text-brand-text">{p.user.profile?.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
