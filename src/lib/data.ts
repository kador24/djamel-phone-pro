import { DEFAULT_SETTINGS, settingFromRows, type Category, type Product, type StoreSettings } from './helpers';
import { supabase } from './supabase';

const PRODUCT_SELECT = `
  id,name_ar,name_en,slug,description_ar,description_en,short_desc_ar,short_desc_en,
  category_id,base_price,compare_at_price,sku,barcode,is_active,is_featured,item_type,service_fields,created_at,
  categories(id,name_ar,name_en,slug,image_url,sort_order,is_active),
  product_images(id,product_id,url,alt_ar,alt_en,is_primary,sort_order,media_type)
`;

export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!supabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase.from('site_settings').select('key,value');
  if (error) {
    console.error('تعذر تحميل إعدادات المتجر:', error.message);
    return DEFAULT_SETTINGS;
  }
  return settingFromRows(data as Array<{ key: string; value: unknown }>);
}

export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  if (!supabase) return [];
  let query = supabase.from('categories').select('id,name_ar,name_en,slug,image_url,sort_order,is_active').order('sort_order', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) {
    console.error('تعذر تحميل الفئات:', error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function fetchProducts(options?: { includeInactive?: boolean; limit?: number }): Promise<Product[]> {
  if (!supabase) return [];
  let query = supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false }).limit(options?.limit ?? 120);
  if (!options?.includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) {
    console.error('تعذر تحميل المنتجات:', error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) {
    console.error('تعذر تحميل المنتج:', error.message);
    return null;
  }
  return (data ?? null) as unknown as Product | null;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as Product | null;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return false;
  const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return !error && data?.role === 'admin';
}
