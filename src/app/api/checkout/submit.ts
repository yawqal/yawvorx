import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 500 });
  }

  const { items, currency, customer } = await request.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  const p_customer = {
    name: `${customer.firstName} ${customer.lastName}`.trim(),
    email: customer.email,
    phone: '',
    address: null,
    city: null,
    country: 'ET',
    notes: null,
  };

  const p_items = items.map((item: any) => ({
    slug: item.slug,
    variant_id: item.variantId || null,
    qty: item.qty,
  }));

  const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const { data: orderData, error: orderError } = await supabase.rpc('yvx_create_order', {
    p_items,
    p_customer,
    p_idempotency_key: idempotencyKey,
    p_payment_method: 'manual',
    p_currency: currency,
  });

  if (orderError) {
    console.error('Error creating order:', orderError.message);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }

  const orderId = orderData?.order_ref;

  if (!orderId) {
    return NextResponse.json({ error: 'Order creation failed.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Order has been created and is awaiting verification.',
    orderReference: orderData.order_ref,
    orderNumber: orderId,
  }, { status: 201 });
}