import { apiClient } from './client';
import type { EbayTransaction, EbayListing } from '@ride-out/shared';

export const ebayApi = {
  getTransactions: () =>
    apiClient.get<{ data: EbayTransaction[] }>('/ebay/transactions'),

  syncTransactions: () =>
    apiClient.post<{ data: { synced: number } }>('/ebay/transactions/sync'),

  sendInvite: (txId: string) =>
    apiClient.post(`/ebay/transactions/${txId}/invite`),

  search: (q: string) =>
    apiClient.get<{ data: { itemSummaries: EbayListing[] } }>('/ebay/search', { params: { q } }),

  getListings: () =>
    apiClient.get('/ebay/listings'),

  disconnect: () =>
    apiClient.delete('/ebay/auth'),
};
