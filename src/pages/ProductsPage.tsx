import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageSearch, X } from 'lucide-react';
import { fetchCategories, fetchProducts } from '../lib/data';
import { categoryTitle, type Category, type Product } from '../lib/helpers';
import { useLang } from '../components/Language';
import { ProductCard } from '../components/ProductCard';

export default function ProductsPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const type = searchParams.get('type') ?? 'all';
  const categoryId = searchParams.get('category') ?? 'all';

  useEffect(() => {
    let alive = true;
    Promise.all([fetchProducts(), fetchCategories()]).then(([nextProducts, nextCategories]) => {
      if (!alive) return;
      setProducts(nextProducts);
      setCategories(nextCategories);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { setSearch(searchParams.get('q') ?? ''); }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      if (type !== 'all' && product.item_type !== type) return false;
      if (categoryId !== 'all' && product.category_id !== categoryId) return false;
      if (!term) return true;
      const categoryName = product.categories ? `${product.categories.name_ar} ${product.categories.name_en}` : '';
      return `${product.name_ar} ${product.name_en} ${product.description_ar ?? ''} ${product.description_en ?? ''} ${product.barcode ?? ''} ${categoryName}`.toLocaleLowerCase().includes(term);
    });
  }, [products, type, categoryId, search]);

  const changeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    if (key === 'type' && value === 'all') next.delete('type');
    setSearchParams(next);
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set('q', search.trim()); else next.delete('q');
    setSearchParams(next);
  };
  const clearFilters = () => { setSearch(''); setSearchParams(new URLSearchParams()); };

  const title = type === 'service' ? (isArabic ? 'الخدمات الرقمية' : 'Digital services') : type === 'product' ? (isArabic ? 'منتجات المتجر' : 'Store products') : (isArabic ? 'كل المنتجات والخدمات' : 'All products and services');

  return <div className="container inner-page">
    <div className="inner-page-heading"><div><span className="eyebrow">{isArabic ? 'كتالوج جمال فون' : 'DJAMEL PHONE CATALOGUE'}</span><h1>{title}</h1><p>{isArabic ? 'ابحث بسهولة، وافتح تفاصيل المنتج أو الخدمة قبل إرسال طلبك.' : 'Search, explore the details, then send your request.'}</p></div><span className="result-count">{filteredProducts.length} {isArabic ? 'عنصر' : 'items'}</span></div>

    <div className="catalogue-toolbar">
      <form className="catalogue-search" onSubmit={submitSearch}><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isArabic ? 'اسم المنتج، الوصف، الباركود...' : 'Name, description or barcode...'} aria-label={isArabic ? 'البحث في المتجر' : 'Search catalogue'} /><button type="submit">{isArabic ? 'بحث' : 'Search'}</button></form>
      <label className="filter-select"><SlidersHorizontal size={17} /><span>{isArabic ? 'النوع' : 'Type'}</span><select value={type} onChange={(event) => changeFilter('type', event.target.value)}><option value="all">{isArabic ? 'الكل' : 'All types'}</option><option value="product">{isArabic ? 'منتجات' : 'Products'}</option><option value="service">{isArabic ? 'خدمات' : 'Services'}</option></select></label>
      <label className="filter-select"><span>{isArabic ? 'القسم' : 'Category'}</span><select value={categoryId} onChange={(event) => changeFilter('category', event.target.value)}><option value="all">{isArabic ? 'جميع الأقسام' : 'All categories'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{categoryTitle(category, lang)}</option>)}</select></label>
      {(searchParams.has('q') || searchParams.has('type') || searchParams.has('category') || search) && <button className="clear-filter-button" onClick={clearFilters}><X size={15} />{isArabic ? 'مسح الفلاتر' : 'Clear filters'}</button>}
    </div>

    {filteredProducts.length ? <div className="products-grid catalogue-grid">{filteredProducts.map((product) => <ProductCard product={product} lang={lang} key={product.id} />)}</div> : <div className="catalogue-empty"><span className="empty-icon"><PackageSearch size={35} /></span><h2>{loading ? (isArabic ? 'جارٍ تحميل المتجر...' : 'Loading the store...') : (isArabic ? 'لم نعثر على نتائج' : 'No results found')}</h2><p>{loading ? (isArabic ? 'نحضر بيانات المنتجات من قاعدة البيانات.' : 'Fetching live catalogue data.') : (isArabic ? 'جرّب تغيير البحث أو اختيار قسم آخر. ستظهر المنتجات فور إضافتها من لوحة الإدارة.' : 'Try a different search or category. Products appear here once added in Admin.')}</p>{!loading && <><button className="button button-outline" onClick={clearFilters}>{isArabic ? 'عرض الكل' : 'Show all'}</button><Link className="admin-small-link" to="/admin/login">{isArabic ? 'دخول الإدارة' : 'Admin login'}</Link></>}</div>}
  </div>;
}
