import { apiClient } from './client';
import type { Event, EventFilters, CreateEventInput } from '@ride-out/shared';

export const eventsApi = {
  list: (filters?: EventFilters) =>
    apiClient.get<{ data: Event[]; pagination: unknown }>('/events', { params: filters }),

  get: (eventId: string) =>
    apiClient.get<{ data: Event }>(`/events/${eventId}`),

  create: (data: CreateEventInput) =>
    apiClient.post<{ data: Event }>('/events', data),

  update: (eventId: string, data: Partial<CreateEventInput>) =>
    apiClient.put<{ data: Event }>(`/events/${eventId}`, data),

  cancel: (eventId: string) =>
    apiClient.delete(`/events/${eventId}`),

  join: (eventId: string) =>
    apiClient.post(`/events/${eventId}/join`),

  leave: (eventId: string) =>
    apiClient.delete(`/events/${eventId}/join`),

  uploadGpx: (eventId: string, file: File) => {
    const formData = new FormData();
    formData.append('gpx', file);
    return apiClient.post(`/events/${eventId}/gpx`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
