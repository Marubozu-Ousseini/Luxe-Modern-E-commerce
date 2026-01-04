
export interface Product {
  id: number;
  name: string;
  price: number;
  /** Optional original (non-discounted) price to show promotional savings */
  originalPrice?: number;
  description: string;
  category: string;
  imageUrl: string;
  /** Optional gallery images for PDP carousel */
  images?: string[];
  /** Optional product video for gallery */
  videoUrl?: string;
  /** Optional available stock quantity for inventory management */
  stock?: number;
  /** Optional flag to display a neutral "Limited Availability" badge on cards */
  limitedAvailability?: boolean;
  rating: {
    rate: number;
    count: number;
  };
  /** Optional label slugs applied to the product (managed via Admin). */
  labels?: string[];
  /** Optional merchandising metadata for filtering */
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  fit?: 'Slim' | 'Regular' | 'Relaxed';
}

export interface CartItem {
  product: Product;
  quantity: number;
}
