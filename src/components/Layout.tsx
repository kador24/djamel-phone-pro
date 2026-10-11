import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe2, Headphones, MapPin, Menu, Search, Smartphone, X } from 'lucide-react';
import { DEFAULT_SETTINGS, buildGeneralContactMessage, makeWhatsAppUrl, type StoreSettings } from '../lib/helpers';
import { fetchStoreSettings } from '../lib/data';
import { useLang } from './Language';

export function StoreLayout({ children }: { children: ReactNode }) {
  const { lang, setLang } = useLang();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { void fetchStoreSettings().then(setSettings); }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);

  const isArabic = lang === 'ar';
  const storeName = isArabic ? settings.store_name_ar : settings.store_name_en;
  const contact = () => {
    const url = makeWhatsAppUrl(settings.whatsapp_number, buildGeneralContactMessage(lang));
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else window.alert(isArabic ? 'أضف رقم واتساب من لوحة الإدارة أولاً: /admin/settings' : 'Add the store WhatsApp number in Admin → Store Settings first.');
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/products${searchText.trim() ? `?q=${encodeURIComponent(searchText.trim())}` : ''}`);
  };

  return (
    <div className="site-shell">
      <div className="announcement-bar">
        <span className="announcement-dot" />
        <span>{isArabic ? 'جمال فون — هواتف وإكسسوارات وخدمات رقمية في مكان واحد' : 'Djamel Phone — phones, accessories and digital services in one place'}</span>
        <button className="announcement-lang" onClick={() => setLang(isArabic ? 'en' : 'ar')} aria-label={isArabic ? 'Switch language to English' : 'غيّر اللغة إلى العربية'}>
          <Globe2 size={14} /> {isArabic ? 'English' : 'العربية'}
        </button>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label={isArabic ? 'فتح القائمة' : 'Open menu'}>
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link to="/" className="brand-lockup" aria-label={storeName}>
            <img src={settings.logo_url || '/assets/jamal-logo.webp'} alt="شعار جمال فون" className="brand-logo" />
            <span className="brand-text"><strong>{storeName || 'جمال فون'}</strong><small>{isArabic ? 'اختيارك للتقنية' : 'Your tech choice'}</small></span>
          </Link>

          <form className="header-search" onSubmit={submitSearch} role="search">
            <Search size={19} aria-hidden="true" />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder={isArabic ? 'ابحث عن هاتف أو إكسسوار أو خدمة...' : 'Search phones, accessories or services...'} aria-label={isArabic ? 'بحث المنتجات' : 'Search products'} />
            <button type="submit">{isArabic ? 'بحث' : 'Search'}</button>
          </form>

          <button onClick={contact} className="contact-header"><Headphones size={17} /><span>{isArabic ? 'تواصل مع المتجر' : 'Contact the store'}</span></button>
        </div>
        <div className="nav-line">
          <nav className={`container main-nav ${mobileOpen ? 'nav-open' : ''}`}>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>{isArabic ? 'الرئيسية' : 'Home'}</Link>
            <Link to="/products?type=product" className={location.pathname === '/products' && !location.search.includes('type=service') ? 'active' : ''}><Smartphone size={16} />{isArabic ? 'المنتجات' : 'Products'}</Link>
            <Link to="/products?type=service" className={location.search.includes('type=service') ? 'active' : ''}>{isArabic ? 'الخدمات الرقمية' : 'Digital services'}</Link>
            <Link to="/products">{isArabic ? 'جميع المنتجات' : 'All items'}</Link>
            <button onClick={contact} className="nav-contact">{isArabic ? 'كيف نساعدك؟' : 'Need help?'}</button>
          </nav>
        </div>
      </header>

      {!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && <div className="setup-banner">{isArabic ? 'يلزم إعداد مفتاح Supabase في متغيرات البيئة لتظهر المنتجات الحقيقية.' : 'Set the Supabase publishable key in the environment to load live products.'}</div>}
      <main className="main-content">{children}</main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand-lockup footer-lockup"><img src={settings.logo_url || '/assets/jamal-logo.webp'} alt="" className="brand-logo" /><span className="brand-text"><strong>{storeName || 'جمال فون'}</strong><small>{isArabic ? 'تقنية أقرب إليك' : 'Technology, closer to you'}</small></span></Link>
            <p>{isArabic ? (settings.about_ar || settings.about || 'هواتف وإكسسوارات وخدمات رقمية، في مكان واحد.') : (settings.about || 'Phones, accessories and digital services in one place.')}</p>
          </div>
          <div><h3>{isArabic ? 'تسوّق' : 'Shop'}</h3><Link to="/products?type=product">{isArabic ? 'المنتجات' : 'Products'}</Link><Link to="/products?type=service">{isArabic ? 'الخدمات الرقمية' : 'Digital services'}</Link><Link to="/products">{isArabic ? 'كل المنتجات' : 'All items'}</Link></div>
          <div><h3>{isArabic ? 'نحن هنا لمساعدتك' : 'We are here to help'}</h3><button className="footer-link-button" onClick={contact}>{isArabic ? 'تواصل مع المتجر' : 'Contact the store'}</button><a href="https://maps.app.goo.gl/YmrnasgehXS8gYGx5?g_st=ac" target="_blank" rel="noreferrer"><MapPin size={15} />{isArabic ? 'موقع المتجر على الخريطة' : 'Store location'}</a>{settings.contact_phone && <a href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}>{settings.contact_phone}</a>}</div>
        </div>
        <div className="footer-bottom"><div className="container"><span>© {new Date().getFullYear()} {storeName || 'جمال فون'}</span><Link to="/admin/login">{isArabic ? 'دخول الإدارة' : 'Admin login'}</Link><span>{isArabic ? 'صنع بعناية في الجزائر' : 'Made with care in Algeria'}</span></div></div>
      </footer>
      <button className="floating-contact" onClick={contact} aria-label={isArabic ? 'تواصل مع المتجر' : 'Contact the store'}><Headphones size={20} /><span>{isArabic ? 'تواصل معنا' : 'Contact us'}</span></button>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  const isArabic = useLang().lang === 'ar';
  const BackArrow = isArabic ? ArrowLeft : ArrowRight;
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="section-action">{action}<BackArrow size={17} /></div>}</div>;
}
