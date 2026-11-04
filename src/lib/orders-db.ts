import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/data/orders";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";

export async function storePaymentEvidence(orderId: string, file: File): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  const isAdmin = await isCurrentUserAdmin();
  if (order.user_id !== user.id && !isAdmin) {
    throw new Error('Forbidden');
  }

  const bucketName = "payment-evidence";
  const storagePath = `orders/${orderId}/${file.name}`;
  const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
    upsert: true,
    cacheControl: '3600',
    contentType: file.type,
  });

  if (error) {
    console.error('Error storing payment evidence:', error.message);
    throw new Error('Failed to store payment evidence');
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) {
    console.error('Error updating order status:', error.message);
    throw new Error('Failed to update order status');
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) {
    console.error('Error fetching order:', error.message);
    return null;
  }
  return data as Order;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error.message);
    return [];
  }
  return data as Order[];
}

export async function getPaymentEvidence(orderId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const order = await getOrderById(orderId);
  if (!order) return null;

  const isAdmin = await isCurrentUserAdmin();
  if (order.user_id !== user.id && !isAdmin) {
    return null;
  }

  const bucketName = "payment-evidence";
  const { data: listData, error: listError } = await supabase.storage
    .from(bucketName)
    .list(`orders/${orderId}`, { limit: 1 });

  if (listError || !listData || listData.length === 0) {
    return null;
  }

  const fileName = listData[0].name;
  const filePath = `orders/${orderId}/${fileName}`;

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 3600);

  if (signedError || !signedData?.signedUrl) {
    console.error('Error generating signed URL for payment evidence:', signedError?.message);
    return null;
  }

  return signedData.signedUrl;
}
