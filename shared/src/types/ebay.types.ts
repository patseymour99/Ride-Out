export interface EbayConnection {
  id: string;
  userId: string;
  ebayUserId: string;
  tokenExpiresAt: string;
  connectedAt: string;
}

export interface EbayTransaction {
  id: string;
  userId: string;
  ebayTransactionId: string;
  itemId: string;
  itemTitle: string;
  itemPhotoUrl: string | null;
  soldPrice: number;
  currency: string;
  role: 'BUYER' | 'SELLER';
  counterpartEmail: string | null;
  inviteSent: boolean;
  transactionDate: string;
  createdAt: string;
}

export interface EbayListing {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image: {
    imageUrl: string;
  } | null;
  condition: string;
  itemWebUrl: string;
  seller: {
    username: string;
  };
}
