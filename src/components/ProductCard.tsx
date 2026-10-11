import { Link } from 'react-router-dom';
import { ArrowUpLeft, BadgeCheck, Package, Sparkles } from 'lucide-react';
import { formatPrice, productTitle, type Language, type Product } from '../lib/helpers';

export function ProductCard({ product, lang }: { product: Product; lang: Language }) {
  const isArabic = lang === 'ar';
  const images = [...(product.product_images ?? [])].filter((image) => image.media_type !== 'video').sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const image = images[0];
  const title = productTitle(product, lang);
  const description = isArabic ? product.short_desc_ar || product.description_ar : product.short_desc_en || product.description_en;
  const category = product.categories ? (isArabic ? product.categories.name_ar : product.categories.name_en) : '';

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-image-link" aria-label={title}>
        <div className="product-image-wrap">
          {image ? <img src={image.url} alt={title} loading="lazy" /> : <div className="product-placeholder"><Package size={42} strokeWidth={1.2} /><span>{isArabic ? 'صورة المنتج' : 'Product image'}</span></div>}
          <span className={`product-type-badge ${product.item_type === 'service' ? 'service-badge' : ''}`}>{product.item_type === 'service' ? (isArabic ? 'خدمة' : 'Service') : (isArabic ? 'منتج' : 'Product')}</span>
          {product.is_featured && <span className="featured-badge"><Sparkles size={13} />{isArabic ? 'مميز' : 'Featured'}</span>}
          {product.compare_at_price && product.compare_at_price > product.base_price && <span className="discount-badge">{isArabic ? 'عرض' : 'Offer'}</span>}
        </div>
      </Link>
      <div className="product-card-content">
        {category && <span className="product-category-label">{category}</span>}
        <Link to={`/products/${product.slug}`} className="product-title-link"><h3>{title}</h3></Link>
        {description && <p className="product-short-description">{description}</p>}
        <div className="product-card-bottom">
          <div className="product-price-wrap"><strong>{formatPrice(product.base_price, lang)}</strong>{product.compare_at_price && product.compare_at_price > product.base_price && <del>{formatPrice(product.compare_at_price, lang)}</del>}</div>
          <Link className="round-arrow" to={`/products/${product.slug}`} aria-label={isArabic ? 'عرض التفاصيل' : 'View details'}><ArrowUpLeft size={18} /></Link>
        </div>
        {product.barcode && <span className="product-card-barcode"><BadgeCheck size={12} />{isArabic ? 'رقم المنتج محفوظ' : 'Product code recorded'}</span>}
      </div>
    </article>
  );
}
