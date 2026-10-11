export type Language = 'ar' | 'en';

export type StoreSettings = {
  store_name: string;
  store_name_ar: string;
  store_name_en: string;
  logo_url: string;
  whatsapp_number: string;
  contact_phone: string;
  store_address: string;
  about: string;
  about_ar: string;
  currency: string;
};

export type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_ar?: string | null;
  alt_en?: string | null;
  is_primary: boolean;
  sort_order: number;
  media_type?: 'image' | 'video';
};

export type ServiceField = {
  name: string;
  label_ar: string;
  label_en?: string;
  type?: 'text' | 'number' | 'select';
  required?: boolean;
  options?: string[];
};

export type Product = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  short_desc_ar: string | null;
  short_desc_en: string | null;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  sku: string | null;
  barcode: string | null;
  is_active: boolean;
  is_featured: boolean;
  item_type: 'product' | 'service';
  service_fields: ServiceField[];
  created_at: string;
  product_images: ProductImage[];
  categories?: Category | null;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'جمال فون',
  store_name_ar: 'جمال فون',
  store_name_en: 'Djamel Phone',
  logo_url: '/assets/jamal-logo.webp',
  whatsapp_number: '',
  contact_phone: '',
  store_address: 'الجزائر',
  about: 'هواتف وإكسسوارات وخدمات رقمية، في مكان واحد.',
  about_ar: 'هواتف وإكسسوارات وخدمات رقمية، في مكان واحد.',
  currency: 'DZD',
};

export function unpackSetting(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

export function settingFromRows(rows: Array<{ key: string; value: unknown }> | null | undefined): StoreSettings {
  const result = { ...DEFAULT_SETTINGS };
  for (const row of rows ?? []) {
    if (row.key in result) {
      (result as unknown as Record<string, string>)[row.key] = unpackSetting(row.value);
    }
  }
  if (!result.logo_url) result.logo_url = '/assets/jamal-logo.webp';
  if (!result.store_name_ar) result.store_name_ar = result.store_name || 'جمال فون';
  if (!result.store_name_en) result.store_name_en = 'Djamel Phone';
  return result;
}

export function productTitle(product: Pick<Product, 'name_ar' | 'name_en'>, lang: Language): string {
  return lang === 'ar' ? product.name_ar || product.name_en : product.name_en || product.name_ar;
}

export function categoryTitle(category: Pick<Category, 'name_ar' | 'name_en'>, lang: Language): string {
  return lang === 'ar' ? category.name_ar || category.name_en : category.name_en || category.name_ar;
}

export function formatPrice(price: number | null | undefined, lang: Language = 'ar'): string {
  if (price === null || price === undefined || Number(price) <= 0) return lang === 'ar' ? 'السعر عند التواصل' : 'Price on request';
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency', currency: 'DZD', maximumFractionDigits: 0,
    }).format(Number(price));
  } catch {
    return `${Number(price).toLocaleString()} دج`;
  }
}

export function slugify(value: string): string {
  const ascii = value.normalize('NFKD').toLowerCase().trim()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Arabic-only labels can leave a misleading numeric-only slug (e.g. "آيفون 17" -> "17").
  // Add a small random suffix as well as a timestamp so rapid additions remain unlikely to collide.
  if (/[a-z]/.test(ascii)) return ascii;
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normaliseWhatsAppNumber(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`;
  return digits;
}

export function makeWhatsAppUrl(number: string, message: string): string | null {
  const digits = normaliseWhatsAppNumber(number);
  if (!digits || digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildProductMessage(product: Product, lang: Language, answers?: Record<string, string>): string {
  const arabic = lang === 'ar';
  const title = productTitle(product, lang);
  const lines = arabic
    ? [`السلام عليكم، أرغب في ${product.item_type === 'service' ? 'طلب الخدمة التالية' : 'شراء المنتج التالي'}:`, `الاسم: ${title}`]
    : [`Hello, I would like to ${product.item_type === 'service' ? 'request this service' : 'buy this product'}:`, `Name: ${title}`];
  if (product.barcode) lines.push(`${arabic ? 'الباركود' : 'Barcode'}: ${product.barcode}`);
  if (Number(product.base_price) > 0) lines.push(`${arabic ? 'السعر المعروض' : 'Listed price'}: ${formatPrice(product.base_price, lang)}`);
  if (answers) {
    for (const [label, value] of Object.entries(answers)) {
      if (value.trim()) lines.push(`${label}: ${value.trim()}`);
    }
  }
  lines.push(arabic ? 'أرجو تأكيد التوفر والتفاصيل وطريقة الاستلام. شكرًا لكم.' : 'Please confirm availability, details and delivery/pickup options. Thank you.');
  if (typeof window !== 'undefined') lines.push(`${arabic ? 'رابط المنتج' : 'Product link'}: ${window.location.href}`);
  return lines.join('\n');
}

export function buildGeneralContactMessage(lang: Language): string {
  return lang === 'ar'
    ? 'السلام عليكم، أتواصل مع متجر جمال فون للاستفسار عن المنتجات والخدمات المتوفرة. شكرًا لكم.'
    : 'Hello, I am contacting Djamel Phone to ask about available products and services. Thank you.';
}

export function getStoragePath(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/product-media/';
  const index = publicUrl.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export function parseServiceFields(input: string): ServiceField[] {
  return input.split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [label, rawName, rawType, rawRequired, rawOptions] = line.split('|').map((part) => part?.trim() ?? '');
    const name = slugify(rawName || label).replace(/-/g, '_') || `field_${index + 1}`;
    const type: ServiceField['type'] = rawType === 'number' || rawType === 'select' ? rawType : 'text';
    return {
      name,
      label_ar: label,
      label_en: label,
      type,
      required: rawRequired !== 'اختياري' && rawRequired.toLowerCase() !== 'optional',
      ...(type === 'select' && rawOptions ? { options: rawOptions.split(',').map((option) => option.trim()).filter(Boolean) } : {}),
    };
  });
}

export function serviceFieldsToText(fields: ServiceField[] | null | undefined): string {
  return (fields ?? []).map((field) => [
    field.label_ar || field.label_en || field.name,
    field.name,
    field.type || 'text',
    field.required === false ? 'اختياري' : 'مطلوب',
    (field.options ?? []).join(', '),
  ].join('|')).join('\n');
}
