export type OrderStatus = 'pending' | 'under_verification' | 'paid' | 'rejected' | 'refunded';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type OrderItem = {
  order_id: string;
  product_id: string;
  variant_id: string | null;
  variant_label: string | null;
  unit_price: number;
  quantity: number;
  currency: 'ETB' | 'USD';
};

export type Order = {
  id: string;
  user_id: string;
  order_ref: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: 'ETB' | 'USD';
  total: number;
  created_at: string;
};

export type CartItem = {
  key: string;
  slug: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  unitPrice: number;
  qty: number;
  type: "digital" | "physical";
  maxQty: number;
  currency: "ETB" | "USD";
};
