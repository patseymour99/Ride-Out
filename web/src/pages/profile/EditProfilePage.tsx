import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { RidingStyle } from '@ride-out/shared';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const p = user?.profile;

  const [form, setForm] = useState({
    displayName: p?.displayName ?? '',
    bio: p?.bio ?? '',
    location: p?.location ?? '',
    ridingStyle: p?.ridingStyle ?? RidingStyle.BOTH,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (avatarFile) {
        await usersApi.uploadAvatar(avatarFile);
      }
      return usersApi.updateMe(form as any);
    },
    onSuccess: async () => {
      const res = await usersApi.getMe();
      setUser(res.data.data);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      navigate(`/profile/${user?.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message ?? 'Update failed');
    },
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-brand-muted hover:text-brand-text">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="font-display text-2xl font-bold text-brand-text">Edit Profile</h1>
      </div>

      <div className="card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarFile ? URL.createObjectURL(avatarFile) : p?.avatarUrl}
            name={p?.displayName}
            size="lg"
          />
          <label className="btn-secondary cursor-pointer text-sm px-3 py-1.5 rounded-lg">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
            Change photo
          </label>
        </div>

        <Input
          label="Display name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          required
        />

        <Textarea
          label="Bio"
          placeholder="Tell the community about yourself..."
          rows={3}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />

        <Input
          label="Location"
          placeholder="e.g. Manchester, England"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-brand-text-secondary mb-1.5">
            Riding style
          </label>
          <select
            value={form.ridingStyle}
            onChange={(e) => setForm({ ...form, ridingStyle: e.target.value as RidingStyle })}
            className="input"
          >
            <option value={RidingStyle.BOTH}>On-road & Off-road</option>
            <option value={RidingStyle.ON_ROAD}>On-road only</option>
            <option value={RidingStyle.OFF_ROAD}>Off-road only</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
