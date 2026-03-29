import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ebayApi } from '../../api/ebay.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatCurrency, formatDate } from '@ride-out/shared';

export function EbayPage() {
  const queryClient = useQueryClient();
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: txData, isLoading } = useQuery({
    queryKey: ['ebay-transactions'],
    queryFn: ebayApi.getTransactions,
  });

  const syncMutation = useMutation({
    mutationFn: ebayApi.syncTransactions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ebay-transactions'] }),
  });

  const inviteMutation = useMutation({
    mutationFn: (txId: string) => ebayApi.sendInvite(txId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ebay-transactions'] }),
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await ebayApi.search(searchQ);
      setSearchResults(res.data.data?.itemSummaries ?? []);
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/v1/ebay/auth';
  };

  const transactions = txData?.data.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brand-text">eBay</h1>
        <Button size="sm" variant="secondary" onClick={handleConnect}>
          Connect eBay
        </Button>
      </div>

      {/* eBay Search */}
      <Card className="p-4">
        <p className="text-sm font-medium text-brand-text-secondary mb-3">Search motorcycles on eBay</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="e.g. KTM 500 EXC-F"
            className="input flex-1"
          />
          <Button type="submit" size="sm" loading={searching}>Search</Button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            {searchResults.map((item: any) => (
              <a
                key={item.itemId}
                href={item.itemWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-brand-surface hover:bg-brand-border transition-colors"
              >
                {item.image?.imageUrl && (
                  <img src={item.image.imageUrl} alt={item.title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text line-clamp-2">{item.title}</p>
                  <p className="text-brand-orange font-bold text-sm mt-0.5">
                    {item.price?.currency} {item.price?.value}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-brand-muted uppercase tracking-wider">Past transactions</p>
          <Button size="sm" variant="ghost" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
            Sync from eBay
          </Button>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-12 h-12 text-brand-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-brand-muted">No transactions yet. Connect your eBay account and sync.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <Card key={tx.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-text text-sm">{tx.itemTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={tx.role === 'SELLER' ? 'orange' : 'blue'}>
                        {tx.role}
                      </Badge>
                      <span className="text-brand-muted text-xs">
                        {formatCurrency(tx.soldPrice, tx.currency)}
                      </span>
                      <span className="text-brand-muted text-xs">
                        {formatDate(tx.transactionDate)}
                      </span>
                    </div>
                  </div>
                  {!tx.inviteSent && tx.counterpartEmail ? (
                    <Button
                      size="sm"
                      onClick={() => inviteMutation.mutate(tx.id)}
                      loading={inviteMutation.isPending}
                    >
                      Invite to Ride-Out
                    </Button>
                  ) : tx.inviteSent ? (
                    <Badge variant="green">Invited</Badge>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
