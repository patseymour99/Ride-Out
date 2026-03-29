import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { eventsApi } from '../../api/events.api';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    meetingPoint: '',
    meetingLat: 51.5074,
    meetingLng: -0.1278,
    bikeType: 'BOTH',
    difficulty: 'INTERMEDIATE',
    maxParticipants: '',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      eventsApi.create({
        ...form,
        meetingLat: form.meetingLat,
        meetingLng: form.meetingLng,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
      } as any),
    onSuccess: (res) => {
      navigate(`/events/${res.data.data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message ?? 'Failed to create event');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-brand-muted hover:text-brand-text">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="font-display text-2xl font-bold text-brand-text">Create Ride-Out</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Ride title *"
            placeholder="e.g. Peak District Sunday Blast"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Tell riders what to expect..."
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Input
            label="Start date & time *"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            required
          />

          <Input
            label="Meeting point *"
            placeholder="e.g. Snake Pass Inn, A57, Sheffield"
            value={form.meetingPoint}
            onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={form.meetingLat}
              onChange={(e) => setForm({ ...form, meetingLat: parseFloat(e.target.value) })}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={form.meetingLng}
              onChange={(e) => setForm({ ...form, meetingLng: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
                Bike type
              </label>
              <select
                value={form.bikeType}
                onChange={(e) => setForm({ ...form, bikeType: e.target.value })}
                className="input"
              >
                <option value="BOTH">Both</option>
                <option value="ON_ROAD">On-road</option>
                <option value="OFF_ROAD">Off-road</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="input"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>

          <Input
            label="Max participants"
            type="number"
            placeholder="Leave empty for unlimited"
            value={form.maxParticipants}
            onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
            min={2}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={createMutation.isPending}
          >
            Create Ride-Out
          </Button>
        </form>
      </div>
    </div>
  );
}
