-- Adds the service catalogue extension while keeping the existing store schema.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS service_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_item_type_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_item_type_check
      CHECK (item_type IN ('product', 'service'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_service_fields_array_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_service_fields_array_check
      CHECK (jsonb_typeof(service_fields) = 'array');
  END IF;
END $$;

INSERT INTO public.categories (name_en, name_ar, slug, sort_order, is_active)
VALUES
  ('Phones', 'الهواتف', 'phones', 10, true),
  ('Accessories', 'الإكسسوارات', 'accessories', 20, true),
  ('Gaming Services', 'خدمات الألعاب', 'gaming-services', 30, true),
  ('Digital Services', 'الخدمات الرقمية', 'digital-services', 40, true)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.site_settings
SET value = to_jsonb('جمال فون'::text), updated_at = now()
WHERE key IN ('store_name', 'store_name_ar');

UPDATE public.site_settings
SET value = to_jsonb('Djamel Phone'::text), updated_at = now()
WHERE key = 'store_name_en';
