import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events.api';
import { EventCard } from '../../components/events/EventCard';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { BikeType, DifficultyLevel } from '@ride-out/shared';

const BIKE_TYPES: Array<{ value: BikeType | ''; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'ON_ROAD', label: 'On-road' },
  { value: 'OFF_ROAD', label: 'Off-road' },
  { value: 'BOTH', label: 'Both' },
];

const DIFFICULTIES: Array<{ value: DifficultyLevel | ''; label: string }> = [
  { value: '', label: 'All levels' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

export function EventsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [bikeType, setBikeType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['events', { search, bikeType, difficulty }],
    queryFn: () =>
      eventsApi.list({
        search: search || undefined,
        bikeType: (bikeType as BikeType) || undefined,
        difficulty: (difficulty as DifficultyLevel) || undefined,
      }),
  });

  const joinMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.join(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.leave(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const events = data?.data.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brand-text">Ride-Outs</h1>
        <Button size="sm" onClick={() => navigate('/events/create')}>
          + New Ride
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <input
          type="text"
          placeholder="Search rides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
        <div className="flex gap-2 flex-wrap">
          {BIKE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setBikeType(t.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                bikeType === t.value
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-surface text-brand-muted hover:text-brand-text border border-brand-border'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="w-px bg-brand-border" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                difficulty === d.value
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-surface text-brand-muted hover:text-brand-text border border-brand-border'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-brand-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-brand-muted text-lg font-medium">No rides found</p>
          <p className="text-brand-muted/60 text-sm mt-1">Be the first to plan a ride-out!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onJoin={(id) => joinMutation.mutate(id)}
              onLeave={(id) => leaveMutation.mutate(id)}
              joinLoading={joinMutation.isPending || leaveMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
