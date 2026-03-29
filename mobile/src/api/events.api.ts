import { apiClient } from './client';
import type { Event, EventFilters, CreateEventInput } from '@ride-out/shared';

export const eventsApi = {
  list: (filters?: EventFilters) =>
    apiClient.get<{ data: Event[]; pagination: unknown }>('/events', { params: filters }),
  get: (eventId: string) =>
    apiClient.get<{ data: Event }>(`/events/${eventId}`),
  create: (data: CreateEventInput) =>
    apiClient.post<{ data: Event }>('/events', data),
  join: (eventId: string) => apiClient.post(`/events/${eventId}/join`),
  leave: (eventId: string) => apiClient.delete(`/events/${eventId}/join`),
};
