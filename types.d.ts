export interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
    imageUrl: string;
    rating: {
        rate: number;
        count: number;
    };
}
export interface CartItem {
    product: Product;
    quantity: number;
}
