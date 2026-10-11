import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Cable, CircleCheck, Gamepad2, Headphones, Laptop, PackageSearch, ShieldCheck, Smartphone, Sparkles, Watch, Zap } from 'lucide-react';
import { fetchCategories, fetchProducts } from '../lib/data';
import { categoryTitle, type Category, type Product } from '../lib/helpers';
import { useLang } from '../components/Language';
import { ProductCard } from '../components/ProductCard';
import { SectionHeading } from '../components/Layout';

function categoryIcon(name: string) {
  const value = name.toLowerCase();
  if (value.includes('phone') || value.includes('هاتف') || value.includes('هواتف')) return Smartphone;
  if (value.includes('accessor') || value.includes('إكسس') || value.includes('اكسس')) return Headphones;
  if (value.includes('gaming') || value.includes('لعب')) return Gamepad2;
  if (value.includes('digital') || value.includes('رقمي') || value.includes('خدمات')) return Zap;
  if (value.includes('watch') || value.includes('ساع')) return Watch;
  if (value.includes('computer') || value.includes('حاسوب') || value.includes('إعلام')) return Laptop;
  return Cable;
}

export default function HomePage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchCategories(), fetchProducts()]).then(([nextCategories, nextProducts]) => {
      if (!alive) return;
      setCategories(nextCategories);
      setProducts(nextProducts);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const featured = useMemo(() => products.filter((product) => product.is_featured).slice(0, 8), [products]);
  const latest = useMemo(() => products.filter((product) => product.item_type === 'product').slice(0, 8), [products]);
  const services = useMemo(() => products.filter((product) => product.item_type === 'service').slice(0, 4), [products]);
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <div className="home-page">
      <section className="container hero-section">
        <div className="hero-banner-image">
          <img src="/assets/hero-banner.webp" alt={isArabic ? 'هواتف وإلكترونيات من جمال فون' : 'Phones and electronics from Djamel Phone'} />
          <div className="hero-shade" />
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={15} />{isArabic ? 'مرحبًا بك في جمال فون' : 'Welcome to Djamel Phone'}</span>
            <h1>{isArabic ? 'كل ما يحتاجه هاتفك، في مكان واحد' : 'Everything your phone needs, in one place'}</h1>
            <p>{isArabic ? 'هواتف، إكسسوارات مختارة وخدمات رقمية — بتجربة سهلة وواضحة.' : 'Phones, carefully selected accessories and digital services — made simple.'}</p>
            <div className="hero-actions"><Link to="/products" className="button button-gold">{isArabic ? 'تسوّق الآن' : 'Shop now'}<Arrow size={17} /></Link><Link to="/products?type=service" className="button button-glass">{isArabic ? 'اكتشف الخدمات' : 'Explore services'}</Link></div>
          </div>
          <div className="hero-side-note"><span>01</span><span>{isArabic ? 'جمال فون' : 'DJAMEL PHONE'}</span><span className="hero-note-line" /></div>
        </div>
        <div className="trust-row">
          <div><span className="trust-icon"><CircleCheck size={19} /></span><span><strong>{isArabic ? 'اختيار واضح' : 'Clear choices'}</strong><small>{isArabic ? 'تفاصيل وصور لكل منتج' : 'Photos and useful details'}</small></span></div>
          <div><span className="trust-icon"><ShieldCheck size={19} /></span><span><strong>{isArabic ? 'تواصل مباشر' : 'Direct contact'}</strong><small>{isArabic ? 'تأكيد التوفر قبل الطلب' : 'Confirm before ordering'}</small></span></div>
          <div><span className="trust-icon"><Zap size={19} /></span><span><strong>{isArabic ? 'خدمات رقمية' : 'Digital services'}</strong><small>{isArabic ? 'طلبات بحسب احتياجك' : 'Requests tailored to you'}</small></span></div>
        </div>
      </section>

      <section className="container section-block category-section">
        <SectionHeading eyebrow={isArabic ? 'استكشف المتجر' : 'EXPLORE THE STORE'} title={isArabic ? 'تسوّق حسب الفئة' : 'Shop by category'} subtitle={isArabic ? 'ابدأ من القسم الذي تبحث عنه.' : 'Start with the category you need.'} action={<Link to="/products">{isArabic ? 'كل الفئات' : 'All categories'}</Link>} />
        {categories.length ? <div className="category-grid">{categories.map((category) => {
          const Icon = categoryIcon(`${category.name_ar} ${category.name_en}`);
          return <Link key={category.id} to={`/products?category=${encodeURIComponent(category.id)}`} className="category-tile"><span className="category-icon"><Icon size={25} strokeWidth={1.6} /></span><strong>{categoryTitle(category, lang)}</strong><span className="category-arrow"><Arrow size={15} /></span></Link>;
        })}</div> : <div className="empty-category"><PackageSearch size={25} /><span>{loading ? (isArabic ? 'جارٍ تحميل الأقسام...' : 'Loading categories...') : (isArabic ? 'ستظهر الأقسام هنا عند تجهيزها في لوحة الإدارة.' : 'Categories will appear here once configured in Admin.')}</span></div>}
      </section>

      <section className="section-band">
        <div className="container section-block">
          <SectionHeading eyebrow={isArabic ? 'مختارة بعناية' : 'SELECTED FOR YOU'} title={isArabic ? 'منتجات مميزة' : 'Featured products'} subtitle={isArabic ? 'مجموعة مختارة من المنتجات المتوفرة في المتجر.' : 'A selection of items featured by the store.'} action={<Link to="/products?type=product">{isArabic ? 'عرض كل المنتجات' : 'View all products'}</Link>} />
          {featured.length ? <div className="products-grid">{featured.map((product) => <ProductCard product={product} lang={lang} key={product.id} />)}</div> : products.length ? <div className="products-grid">{latest.slice(0, 4).map((product) => <ProductCard product={product} lang={lang} key={product.id} />)}</div> : <div className="empty-products"><PackageSearch size={32} /><div><strong>{loading ? (isArabic ? 'جارٍ تحميل المنتجات' : 'Loading products') : (isArabic ? 'قريبًا — منتجات جمال فون' : 'Coming soon — Djamel Phone products')}</strong><p>{loading ? (isArabic ? 'نجهز قائمة المنتجات...' : 'Loading the live catalogue...') : (isArabic ? 'ستظهر هنا المنتجات الحقيقية عند إضافتها من لوحة الإدارة.' : 'Real products will appear here when added in Admin.')}</p></div>{!loading && <Link className="button button-outline" to="/admin/login">{isArabic ? 'دخول الإدارة' : 'Admin login'}</Link>}</div>}
        </div>
      </section>

      <section className="container section-block services-block">
        <div className="services-callout"><div className="services-art"><div className="services-orbit orbit-one" /><div className="services-orbit orbit-two" /><div className="service-mark"><Zap size={42} /></div><div className="services-floating-icon"><Gamepad2 size={24} /></div><div className="services-floating-icon second"><Smartphone size={23} /></div></div><div className="services-copy"><span className="eyebrow">{isArabic ? 'أكثر من مجرد منتجات' : 'MORE THAN PRODUCTS'}</span><h2>{isArabic ? 'هل تبحث عن خدمة رقمية؟' : 'Looking for a digital service?'}</h2><p>{isArabic ? 'خدمات الألعاب والطلبات الرقمية تُعرض بإعدادات واضحة، ونجهّز لك رسالة طلب بالتفاصيل التي تحددها.' : 'Gaming and digital services use clear request fields, with a prefilled inquiry based on your details.'}</p><Link to="/products?type=service" className="button button-dark">{isArabic ? 'استكشف الخدمات' : 'Explore services'}<Arrow size={16} /></Link></div></div>
        {services.length > 0 && <div className="service-products"><SectionHeading title={isArabic ? 'خدمات متاحة' : 'Available services'} action={<Link to="/products?type=service">{isArabic ? 'عرض الكل' : 'View all'}</Link>} /><div className="products-grid">{services.map((product) => <ProductCard product={product} lang={lang} key={product.id} />)}</div></div>}
      </section>

      <section className="bottom-promo"><div className="container bottom-promo-inner"><div><span className="eyebrow">{isArabic ? 'تحتاج إلى مساعدة؟' : 'NEED A HAND?'}</span><h2>{isArabic ? 'خلّينا نساعدك تختار المناسب' : 'Let us help you find the right fit'}</h2><p>{isArabic ? 'تواصل مع المتجر للاستفسار عن السعر والتوفر وتفاصيل الخدمات.' : 'Contact the store for pricing, availability and service details.'}</p></div><button className="button button-gold" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{isArabic ? 'العودة للأعلى' : 'Back to top'}<Arrow size={16} /></button></div></section>
    </div>
  );
}
