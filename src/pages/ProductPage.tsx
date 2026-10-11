import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Image as ImageIcon, MessageCircle, Package, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { fetchProductBySlug, fetchStoreSettings } from '../lib/data';
import { buildProductMessage, categoryTitle, formatPrice, makeWhatsAppUrl, productTitle, type Product, type ServiceField, type StoreSettings } from '../lib/helpers';
import { DEFAULT_SETTINGS } from '../lib/helpers';
import { useLang } from '../components/Language';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([fetchProductBySlug(slug), fetchStoreSettings()]).then(([nextProduct, nextSettings]) => {
      if (!alive) return;
      setProduct(nextProduct);
      setSettings(nextSettings);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [slug]);

  const images = useMemo(() => [...(product?.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order), [product]);
  const fields = (product?.service_fields ?? []) as ServiceField[];
  const name = product ? productTitle(product, lang) : '';
  const description = product ? (isArabic ? product.description_ar || product.short_desc_ar : product.description_en || product.short_desc_en) : '';

  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    if (!product) return;
    const missing = fields.find((field) => field.required !== false && !answers[field.name]?.trim());
    if (missing) {
      setNotice(isArabic ? `يرجى ملء الحقل: ${missing.label_ar || missing.label_en || missing.name}` : `Please fill in: ${missing.label_en || missing.label_ar || missing.name}`);
      return;
    }
    const labels: Record<string, string> = {};
    for (const field of fields) labels[isArabic ? field.label_ar || field.label_en || field.name : field.label_en || field.label_ar || field.name] = answers[field.name] ?? '';
    openRequest(buildProductMessage(product, lang, labels));
  };

  const openRequest = (message: string) => {
    const url = makeWhatsAppUrl(settings.whatsapp_number, message);
    if (!url) {
      setNotice(isArabic ? 'رقم واتساب غير مضاف. يمكن ضبطه من لوحة الإدارة في «إعدادات المتجر».' : 'Store WhatsApp is not configured yet. Add it in Admin → Store Settings.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div className="container inner-page"><div className="product-loading"><span className="loading-pulse" /><p>{isArabic ? 'جارٍ تحميل تفاصيل المنتج...' : 'Loading product details...'}</p></div></div>;
  if (!product) return <div className="container inner-page"><div className="catalogue-empty"><span className="empty-icon"><Package size={35} /></span><h1>{isArabic ? 'المنتج غير موجود' : 'Item not found'}</h1><p>{isArabic ? 'ربما تم إخفاؤه أو أن الرابط غير صحيح.' : 'It may be hidden or the link may be incorrect.'}</p><Link className="button button-dark" to="/products">{isArabic ? 'العودة إلى المتجر' : 'Back to store'}<ArrowRight size={16} /></Link></div></div>;

  const activeImage = images[Math.min(selectedImage, Math.max(0, images.length - 1))];
  const category = product.categories ? categoryTitle(product.categories, lang) : '';
  const isService = product.item_type === 'service';

  return <div className="container inner-page product-detail-page">
    <nav className="breadcrumbs"><Link to="/">{isArabic ? 'الرئيسية' : 'Home'}</Link><ChevronLeft size={14} /><Link to="/products">{isArabic ? 'المتجر' : 'Store'}</Link>{category && <><ChevronLeft size={14} /><span>{category}</span></>}<ChevronLeft size={14} /><span className="breadcrumb-current">{name}</span></nav>
    <div className="product-detail-grid">
      <section className="product-gallery" aria-label={isArabic ? 'صور المنتج' : 'Product images'}>
        <div className="product-main-image">
          {activeImage ? (activeImage.media_type === 'video' ? <video className="product-gallery-video" src={activeImage.url} controls playsInline preload="metadata" aria-label={name} /> : <img src={activeImage.url} alt={name} />) : <div className="product-placeholder large"><ImageIcon size={56} strokeWidth={1.3} /><span>{isArabic ? 'لم تضف صورة لهذا العنصر' : 'No image has been added'}</span></div>}
          <span className={`product-type-badge ${isService ? 'service-badge' : ''}`}>{isService ? (isArabic ? 'خدمة رقمية' : 'Digital service') : (isArabic ? 'منتج' : 'Product')}</span>
          {images.length > 1 && <><button className="gallery-nav gallery-next" onClick={() => setSelectedImage((selectedImage + 1) % images.length)} aria-label={isArabic ? 'الصورة التالية' : 'Next image'}><ChevronRight size={22} /></button><button className="gallery-nav gallery-prev" onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)} aria-label={isArabic ? 'الصورة السابقة' : 'Previous image'}><ChevronLeft size={22} /></button></>}
        </div>
        {images.length > 1 && <div className="gallery-thumbnails">{images.map((image, index) => <button key={image.id} onClick={() => setSelectedImage(index)} className={selectedImage === index ? 'selected' : ''} aria-label={`${image.media_type === 'video' ? (isArabic ? 'فيديو' : 'Video') : (isArabic ? 'صورة' : 'Image')} ${index + 1}`}>{image.media_type === 'video' ? <span className="video-thumbnail"><video src={image.url} muted preload="metadata" /><span>▶</span></span> : <img src={image.url} alt="" />}</button>)}</div>}
      </section>

      <section className="product-detail-info">
        <div className="detail-kickers"><span className="eyebrow">{isService ? (isArabic ? 'خدمة جمال فون' : 'DJAMEL PHONE SERVICE') : (isArabic ? 'من متجر جمال فون' : 'FROM DJAMEL PHONE')}</span>{product.is_featured && <span className="detail-featured"><Sparkles size={13} />{isArabic ? 'مميز' : 'Featured'}</span>}</div>
        <h1>{name}</h1>
        {product.short_desc_ar || product.short_desc_en ? <p className="product-detail-short">{isArabic ? product.short_desc_ar || product.short_desc_en : product.short_desc_en || product.short_desc_ar}</p> : null}
        <div className="detail-price-row"><strong className="detail-price">{formatPrice(product.base_price, lang)}</strong>{product.compare_at_price && product.compare_at_price > product.base_price && <del>{formatPrice(product.compare_at_price, lang)}</del>}{product.base_price <= 0 && <span className="price-note">{isArabic ? 'يتم تأكيد السعر عند التواصل' : 'Price confirmed by the store'}</span>}</div>
        <div className="detail-check-list"><span><CheckCircle2 size={16} />{isArabic ? 'التوفر يؤكّد قبل الطلب' : 'Availability confirmed before order'}</span><span><ShieldCheck size={16} />{isArabic ? 'تفاصيل طلب واضحة' : 'Clear request details'}</span></div>
        {description && <div className="product-description"><h2>{isArabic ? 'التفاصيل' : 'Details'}</h2><p>{description}</p></div>}
        {category && <div className="product-meta"><span>{isArabic ? 'القسم' : 'Category'}</span><strong>{category}</strong></div>}
        {product.barcode && <div className="product-meta"><span>{isArabic ? 'رمز المنتج' : 'Product code'}</span><strong>{product.barcode}</strong></div>}

        {isService && fields.length > 0 ? <form className="service-request-form" onSubmit={submitRequest}>
          <div className="service-form-title"><h2>{isArabic ? 'بيانات طلب الخدمة' : 'Service request details'}</h2><p>{isArabic ? 'املأ البيانات اللازمة حتى نجهّز رسالة طلبك.' : 'Fill in the details so your request message is prepared.'}</p></div>
          {fields.map((field) => <label className="form-field" key={field.name}><span>{isArabic ? field.label_ar || field.label_en || field.name : field.label_en || field.label_ar || field.name}{field.required !== false && <em>*</em>}</span>{field.type === 'select' ? <select value={answers[field.name] ?? ''} onChange={(event) => setAnswers((old) => ({ ...old, [field.name]: event.target.value }))} required={field.required !== false}><option value="">{isArabic ? 'اختر...' : 'Select...'}</option>{(field.options ?? []).map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} value={answers[field.name] ?? ''} onChange={(event) => setAnswers((old) => ({ ...old, [field.name]: event.target.value }))} required={field.required !== false} placeholder={isArabic ? 'اكتب التفاصيل هنا' : 'Enter details'} />}</label>)}
          {notice && <p className="inline-notice">{notice}</p>}
          <button type="submit" className="button button-gold request-main-button"><ShoppingBag size={18} />{isArabic ? 'طلب الخدمة' : 'Request service'}</button>
        </form> : <div className="detail-actions"><button className="button button-gold request-main-button" onClick={() => openRequest(buildProductMessage(product, lang))}><ShoppingBag size={18} />{isService ? (isArabic ? 'طلب الخدمة' : 'Request service') : (isArabic ? 'شراء الآن' : 'Buy now')}</button><button className="button button-outline" onClick={() => openRequest(isArabic ? `السلام عليكم، أريد الاستفسار عن ${name}. يرجى توضيح التوفر والسعر والتفاصيل.` : `Hello, I would like to ask about ${name}. Please share availability, price and details.`)}><MessageCircle size={17} />{isArabic ? 'تواصل مع المتجر' : 'Contact the store'}</button></div>}
        {notice && !(isService && fields.length > 0) && <p className="inline-notice">{notice}</p>}
        <Link to="/products" className="back-to-products"><ArrowRight size={15} />{isArabic ? 'العودة إلى المنتجات والخدمات' : 'Back to products and services'}</Link>
      </section>
    </div>
  </div>;
}
