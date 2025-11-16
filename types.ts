
export interface Product {
  id: number;
  name: string;
  price: number;
  /** Optional original (non-discounted) price to show promotional savings */
  originalPrice?: number;
  description: string;
  category: string;
  imageUrl: string;
  /** Optional available stock quantity for inventory management */
  stock?: number;
  /** Optional flag to display a neutral "Limited Availability" badge on cards */
  limitedAvailability?: boolean;
  rating: {
    rate: number;
    count: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}
