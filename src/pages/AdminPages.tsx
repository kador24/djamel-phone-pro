import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchCategories, fetchProductById, fetchProducts, fetchStoreSettings } from '../lib/data';
import { DEFAULT_SETTINGS, getStoragePath, parseServiceFields, serviceFieldsToText, slugify, type Category, type Product, type StoreSettings } from '../lib/helpers';
import { useLang } from '../components/Language';
import { ArrowLeft, BadgeCheck, BarChart3, Check, ChevronLeft, CircleAlert, FileImage, FolderTree, Gauge, ImagePlus, LoaderCircle, LogOut, Package, Pencil, Plus, Save, Search, Settings, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react';

function noSupabaseMessage(isArabic: boolean) {
  return isArabic ? 'الاتصال بقاعدة البيانات غير مُعد. أضف متغيرات Supabase في إعدادات البيئة.' : 'Supabase is not configured. Add the Supabase environment variables.';
}

export function AdminLoginPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!supabase) { setError(noSupabaseMessage(isArabic)); return; }
    setBusy(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (loginError || !data.user) {
      setBusy(false);
      setError(isArabic ? 'تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.' : 'Sign in failed. Check your email and password.');
      return;
    }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setBusy(false);
      setError(isArabic ? 'هذا الحساب ليس حساب مدير للمتجر.' : 'This account is not an administrator.');
      return;
    }
    navigate('/admin', { replace: true });
  };

  return <div className="admin-login-page">
    <Link to="/" className="login-back"><ArrowLeft size={17} />{isArabic ? 'العودة إلى المتجر' : 'Back to store'}</Link>
    <div className="admin-login-card">
      <div className="admin-login-logo"><img src="/assets/jamal-logo.webp" alt="جمال فون" /></div>
      <span className="eyebrow">{isArabic ? 'إدارة المتجر' : 'STORE ADMIN'}</span>
      <h1>{isArabic ? 'مرحبًا بعودتك' : 'Welcome back'}</h1>
      <p>{isArabic ? 'سجّل الدخول لإدارة المنتجات والصور والخدمات.' : 'Sign in to manage products, images and services.'}</p>
      <form onSubmit={submit} className="admin-form">
        <label className="form-field"><span>{isArabic ? 'البريد الإلكتروني' : 'Email address'}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" dir="ltr" /></label>
        <label className="form-field"><span>{isArabic ? 'كلمة المرور' : 'Password'}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" dir="ltr" /></label>
        {error && <p className="form-error"><CircleAlert size={16} />{error}</p>}
        <button type="submit" className="button button-gold full-width" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin" /> : <ShieldCheck size={18} />}{isArabic ? 'دخول لوحة الإدارة' : 'Sign in to Admin'}</button>
      </form>
      <small className="login-security-note"><ShieldCheck size={14} />{isArabic ? 'الدخول مخصص لحساب المدير فقط.' : 'Administrator account access only.'}</small>
    </div>
  </div>;
}

export function AdminGuard() {
  const { lang } = useLang();
  const [status, setStatus] = useState<'checking' | 'admin' | 'unauthenticated' | 'denied' | 'unconfigured'>('checking');
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    const verify = async () => {
      if (!supabase) { if (alive) setStatus('unconfigured'); return; }
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user || error) { if (alive) setStatus('unauthenticated'); return; }
      const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!alive) return;
      setStatus(!profileError && profile?.role === 'admin' ? 'admin' : 'denied');
    };
    void verify();
    return () => { alive = false; };
  }, [location.pathname]);
  const isArabic = lang === 'ar';

  if (status === 'checking') return <div className="admin-loading"><LoaderCircle size={25} className="spin" /><p>{isArabic ? 'جارٍ التحقق من صلاحيات الإدارة...' : 'Checking administrator access...'}</p></div>;
  if (status === 'unconfigured') return <div className="admin-loading"><CircleAlert size={28} /><p>{noSupabaseMessage(isArabic)}</p></div>;
  if (status === 'unauthenticated') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (status === 'denied') return <div className="admin-loading"><CircleAlert size={28} /><h2>{isArabic ? 'لا تملك صلاحية الإدارة' : 'Administrator access required'}</h2><Link className="button button-outline" to="/">{isArabic ? 'العودة إلى المتجر' : 'Back to store'}</Link></div>;
  return <AdminLayout><Outlet /></AdminLayout>;
}

function AdminLayout({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };
  const links = [
    { to: '/admin', label: isArabic ? 'المنتجات' : 'Products', icon: Package, exact: true },
    { to: '/admin/categories', label: isArabic ? 'الفئات' : 'Categories', icon: FolderTree },
    { to: '/admin/settings', label: isArabic ? 'إعدادات المتجر' : 'Store settings', icon: Settings },
  ];
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link to="/" className="admin-brand"><img src="/assets/jamal-logo.webp" alt="" /><span><strong>جمال فون</strong><small>{isArabic ? 'لوحة الإدارة' : 'Admin workspace'}</small></span></Link>
      <div className="admin-sidebar-label">{isArabic ? 'إدارة المتجر' : 'STORE MANAGEMENT'}</div>
      <nav>{links.map(({ to, label, icon: Icon, exact }) => <Link key={to} to={to} className={(exact ? location.pathname === to : location.pathname.startsWith(to)) ? 'selected' : ''}><Icon size={18} /><span>{label}</span><ChevronLeft size={15} /></Link>)}</nav>
      <div className="admin-sidebar-bottom"><div className="admin-status-dot" /><span>{isArabic ? 'متصل بـ Supabase' : 'Connected to Supabase'}</span></div>
      <button className="admin-logout" onClick={logout}><LogOut size={17} />{isArabic ? 'تسجيل الخروج' : 'Sign out'}</button>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><div><span className="admin-mobile-brand">{isArabic ? 'جمال فون' : 'Djamel Phone'}</span><span className="admin-crumb">{isArabic ? 'لوحة الإدارة' : 'Admin'}</span><ChevronLeft size={14} /><span className="admin-crumb current">{links.find((item) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label ?? (isArabic ? 'تحرير المنتج' : 'Edit product')}</span></div><Link to="/" target="_blank" className="view-store-link">{isArabic ? 'عرض المتجر' : 'View storefront'}<ArrowLeft size={15} /></Link></header>
      <main className="admin-page-content">{children}</main>
    </div>
  </div>;
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="admin-page-heading"><div><span className="eyebrow">DJAMEL PHONE · ADMIN</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function AdminProductsPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>({ text: '' });
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    const next = await fetchProducts({ includeInactive: true, limit: 300 });
    setProducts(next);
    setLoading(false);
  };
  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return products;
    return products.filter((product) => `${product.name_ar} ${product.name_en} ${product.barcode ?? ''} ${product.sku ?? ''}`.toLocaleLowerCase().includes(term));
  }, [products, search]);

  const locateAndDeleteByBarcode = async (event: FormEvent) => {
    event.preventDefault();
    setNotice({ text: '' });
    const code = barcode.trim();
    if (!code) return;
    const item = products.find((product) => product.barcode?.trim() === code);
    if (!item) { setNotice({ text: isArabic ? 'لم نعثر على منتج بهذا الباركود.' : 'No product was found with this barcode.', error: true }); return; }
    const message = isArabic ? `سيتم حذف «${item.name_ar}» نهائيًا. هل تريد المتابعة؟` : `Permanently delete “${item.name_en}”? Continue?`;
    if (!window.confirm(message)) return;
    if (!supabase) return;
    setBusy(true);
    try {
      const { data: imageRows } = await supabase.from('product_images').select('url').eq('product_id', item.id);
      const paths = (imageRows ?? []).map((row) => getStoragePath(row.url)).filter((value): value is string => Boolean(value));
      if (paths.length) await supabase.storage.from('product-media').remove(paths);
      const { error } = await supabase.from('products').delete().eq('id', item.id);
      if (error) throw error;
      setBarcode('');
      setNotice({ text: isArabic ? 'تم حذف المنتج والصور المرتبطة به.' : 'Product and linked images deleted.' });
      await reload();
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : (isArabic ? 'تعذر حذف المنتج.' : 'Could not delete the product.'), error: true });
    } finally { setBusy(false); }
  };

  const toggleActive = async (product: Product) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    if (error) setNotice({ text: isArabic ? 'تعذر تعديل حالة المنتج.' : 'Could not update the item status.', error: true });
    else await reload();
  };

  return <div className="admin-content-stack">
    <PageHeader title={isArabic ? 'المنتجات والخدمات' : 'Products & services'} subtitle={isArabic ? 'أضف منتجًا أو خدمة، عدّل الصور والباركود، أو أخفِ العنصر مؤقتًا.' : 'Add products or services, manage images and barcode, or hide an item.'} action={<button className="button button-dark" onClick={() => navigate('/admin/products/new')}><Plus size={17} />{isArabic ? 'إضافة جديد' : 'Add new item'}</button>} />
    <div className="admin-stat-row"><div className="admin-stat"><span className="admin-stat-icon"><Package size={19} /></span><div><strong>{products.length}</strong><small>{isArabic ? 'إجمالي العناصر' : 'Total items'}</small></div></div><div className="admin-stat"><span className="admin-stat-icon green"><BadgeCheck size={19} /></span><div><strong>{products.filter((item) => item.is_active).length}</strong><small>{isArabic ? 'ظاهر للزبائن' : 'Visible to customers'}</small></div></div><div className="admin-stat"><span className="admin-stat-icon gold"><BarChart3 size={19} /></span><div><strong>{products.filter((item) => item.item_type === 'service').length}</strong><small>{isArabic ? 'خدمات رقمية' : 'Digital services'}</small></div></div></div>

    <section className="admin-panel barcode-panel"><div className="admin-panel-heading"><div><h2><Search size={18} />{isArabic ? 'بحث وحذف بواسطة الباركود' : 'Find and delete by barcode'}</h2><p>{isArabic ? 'يعرض اسم المنتج قبل الحذف ويطلب تأكيدًا.' : 'The item is identified first, then deletion requires confirmation.'}</p></div></div><form className="barcode-delete-form" onSubmit={locateAndDeleteByBarcode}><input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder={isArabic ? 'اكتب أو امسح الباركود...' : 'Enter or scan barcode...'} aria-label="Barcode" /><button type="submit" className="button button-danger" disabled={busy}><Trash2 size={16} />{busy ? (isArabic ? 'جارٍ الحذف' : 'Deleting') : (isArabic ? 'بحث ثم حذف' : 'Find & delete')}</button></form>{notice.text && <p className={`admin-notice ${notice.error ? 'error' : 'success'}`}>{notice.text}</p>}</section>

    <section className="admin-panel"><div className="admin-list-toolbar"><div><h2>{isArabic ? 'قائمة العناصر' : 'Catalogue'}</h2><p>{isArabic ? `${filtered.length} عنصر` : `${filtered.length} items`}</p></div><label className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isArabic ? 'بحث بالاسم أو الباركود' : 'Search name or barcode'} /></label></div>
      <div className="admin-products-list">{loading ? <div className="admin-empty"><LoaderCircle className="spin" size={23} />{isArabic ? 'تحميل البيانات...' : 'Loading data...'}</div> : filtered.length ? filtered.map((product) => {
        const itemImages = (product.product_images ?? []).filter((entry) => entry.media_type !== 'video');
        const image = itemImages.find((entry) => entry.is_primary) ?? itemImages[0];
        return <div key={product.id} className="admin-product-row"><div className="admin-product-thumb">{image ? <img src={image.url} alt="" /> : <Package size={23} />}</div><div className="admin-product-info"><strong>{isArabic ? product.name_ar : product.name_en || product.name_ar}</strong><span>{product.barcode ? `${isArabic ? 'باركود' : 'Barcode'}: ${product.barcode}` : (isArabic ? 'لا يوجد باركود' : 'No barcode')}</span><small>{product.categories ? (isArabic ? product.categories.name_ar : product.categories.name_en) : (isArabic ? 'بدون تصنيف' : 'Uncategorised')}</small></div><span className={`admin-kind-pill ${product.item_type === 'service' ? 'service' : ''}`}>{product.item_type === 'service' ? (isArabic ? 'خدمة' : 'Service') : (isArabic ? 'منتج' : 'Product')}</span><span className={`admin-status-pill ${product.is_active ? 'active' : 'hidden'}`}>{product.is_active ? (isArabic ? 'ظاهر' : 'Visible') : (isArabic ? 'مخفي' : 'Hidden')}</span><div className="admin-row-actions"><button onClick={() => toggleActive(product)} className="text-action" title={isArabic ? 'إظهار/إخفاء' : 'Show/hide'}>{product.is_active ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'إظهار' : 'Show')}</button><button onClick={() => navigate(`/admin/products/${product.id}`)} className="icon-button" aria-label={isArabic ? 'تعديل' : 'Edit'}><Pencil size={17} /></button></div></div>;
      }) : <div className="admin-empty"><Package size={25} /><strong>{isArabic ? 'لا توجد عناصر بعد' : 'No items yet'}</strong><span>{isArabic ? 'ابدأ بإضافة أول منتج أو خدمة.' : 'Add your first product or service.'}</span><button className="button button-gold" onClick={() => navigate('/admin/products/new')}><Plus size={16} />{isArabic ? 'إضافة جديد' : 'Add new item'}</button></div>}</div>
    </section>
  </div>;
}

export function AdminProductEditorPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const location = useLocation();
  const currentId = location.pathname.match(/\/admin\/products\/([^/]+)/)?.[1];
  const isNew = !currentId || currentId === 'new';
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [form, setForm] = useState({
    name_ar: '', name_en: '', slug: '', barcode: '', sku: '', category_id: '', item_type: 'product' as 'product' | 'service',
    base_price: '', compare_at_price: '', short_desc_ar: '', short_desc_en: '', description_ar: '', description_en: '',
    service_fields_text: '', is_active: true, is_featured: false,
  });
  useEffect(() => {
    let alive = true;
    Promise.all([fetchCategories(true), currentId && currentId !== 'new' ? fetchProductById(currentId) : Promise.resolve(null)]).then(([nextCategories, nextProduct]) => {
      if (!alive) return;
      setCategories(nextCategories);
      if (nextProduct) {
        setProduct(nextProduct);
        setForm({
          name_ar: nextProduct.name_ar ?? '', name_en: nextProduct.name_en ?? '', slug: nextProduct.slug ?? '', barcode: nextProduct.barcode ?? '', sku: nextProduct.sku ?? '',
          category_id: nextProduct.category_id ?? '', item_type: nextProduct.item_type ?? 'product', base_price: String(nextProduct.base_price ?? ''), compare_at_price: nextProduct.compare_at_price == null ? '' : String(nextProduct.compare_at_price),
          short_desc_ar: nextProduct.short_desc_ar ?? '', short_desc_en: nextProduct.short_desc_en ?? '', description_ar: nextProduct.description_ar ?? '', description_en: nextProduct.description_en ?? '',
          service_fields_text: serviceFieldsToText(nextProduct.service_fields), is_active: nextProduct.is_active, is_featured: nextProduct.is_featured,
        });
      }
      setLoading(false);
    }).catch((loadError) => { if (alive) { setError(loadError instanceof Error ? loadError.message : String(loadError)); setLoading(false); } });
    return () => { alive = false; };
  }, [currentId]);

  const setValue = (key: keyof typeof form, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));

  const uploadImages = async (productId: string) => {
    if (!supabase || !files.length) return;
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) throw new Error(isArabic ? `حجم الملف ${file.name} يتجاوز الحد المسموح (10 ميغابايت).` : `${file.name} exceeds the 10 MB upload limit.`);
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type)) throw new Error(isArabic ? `نوع الملف ${file.name} غير مدعوم.` : `Unsupported file type: ${file.name}.`);
    }
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || `media-${i + 1}`;
      const path = `${productId}/${Date.now()}-${i}-${safeName}`;
      setUploadProgress(`${isArabic ? 'رفع الصورة' : 'Uploading image'} ${i + 1}/${files.length}`);
      const { error: uploadError } = await supabase.storage.from('product-media').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from('product-media').getPublicUrl(path);
      const { error: imageError } = await supabase.from('product_images').insert({ product_id: productId, url: publicUrl.publicUrl, alt_ar: form.name_ar, alt_en: form.name_en || form.name_ar, sort_order: (product?.product_images?.length ?? 0) + i, is_primary: (product?.product_images?.length ?? 0) === 0 && i === 0, media_type: file.type.startsWith('video/') ? 'video' : 'image' });
      if (imageError) throw imageError;
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!supabase) { setError(noSupabaseMessage(isArabic)); return; }
    if (!form.name_ar.trim()) { setError(isArabic ? 'اسم المنتج بالعربية مطلوب.' : 'Arabic item name is required.'); return; }
    setSaving(true);
    try {
      const slug = form.slug.trim() || (product?.slug ?? slugify(form.name_en.trim() || form.name_ar));
      const payload = {
        name_ar: form.name_ar.trim(), name_en: form.name_en.trim() || form.name_ar.trim(), slug,
        barcode: form.barcode.trim() || null, sku: form.sku.trim() || null,
        category_id: form.category_id || null, item_type: form.item_type,
        base_price: form.base_price.trim() ? Number(form.base_price) : 0,
        compare_at_price: form.compare_at_price.trim() ? Number(form.compare_at_price) : null,
        short_desc_ar: form.short_desc_ar.trim() || null, short_desc_en: form.short_desc_en.trim() || null,
        description_ar: form.description_ar.trim() || null, description_en: form.description_en.trim() || null,
        service_fields: form.item_type === 'service' ? parseServiceFields(form.service_fields_text) : [],
        is_active: form.is_active, is_featured: form.is_featured,
        track_inventory: false,
      };
      let productId = product?.id;
      if (productId) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', productId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase.from('products').insert(payload).select('id').single();
        if (insertError) throw insertError;
        productId = data.id;
      }
      await uploadImages(productId!);
      setFiles([]); setUploadProgress('');
      setSuccess(isArabic ? 'تم حفظ البيانات بنجاح.' : 'Item saved successfully.');
      if (isNew) { navigate(`/admin/products/${productId}`, { replace: true }); return; }
      const refreshed = await fetchProductById(productId!);
      setProduct(refreshed);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : String(saveError);
      setError(message.includes('products_barcode_key') || message.includes('duplicate key') ? (isArabic ? 'هذا الباركود مستخدم في منتج آخر.' : 'This barcode is already used by another item.') : message);
    } finally { setSaving(false); }
  };

  const deleteImage = async (imageId: string, url: string) => {
    if (!supabase || !window.confirm(isArabic ? 'حذف هذه الصورة من المنتج؟' : 'Remove this image from the item?')) return;
    const path = getStoragePath(url);
    if (path) await supabase.storage.from('product-media').remove([path]);
    const { error: deleteError } = await supabase.from('product_images').delete().eq('id', imageId);
    if (deleteError) setError(deleteError.message);
    else if (product) setProduct({ ...product, product_images: product.product_images.filter((image) => image.id !== imageId) });
  };

  if (loading) return <div className="admin-empty"><LoaderCircle className="spin" size={24} />{isArabic ? 'تحميل بيانات العنصر...' : 'Loading item...'}</div>;

  return <div className="admin-content-stack">
    <div className="admin-edit-back"><Link to="/admin"><ArrowLeft size={15} />{isArabic ? 'قائمة المنتجات' : 'Catalogue'}</Link><ChevronLeft size={14} /><span>{isNew ? (isArabic ? 'إضافة عنصر' : 'Add item') : (isArabic ? 'تعديل عنصر' : 'Edit item')}</span></div>
    <PageHeader title={isNew ? (isArabic ? 'إضافة منتج أو خدمة' : 'Add a product or service') : (isArabic ? 'تعديل العنصر' : 'Edit item')} subtitle={isArabic ? 'املأ الحقول الأساسية أولاً، ثم أضف الصور. اترك السعر صفرًا إذا كان يُحدّد عند التواصل.' : 'Complete the essential details and add photos. Leave price at zero if confirmed by contact.'} />
    <form onSubmit={save} className="admin-editor-form">
      <div className="admin-editor-main">
        <section className="admin-panel editor-panel"><div className="editor-section-heading"><span>01</span><div><h2>{isArabic ? 'معلومات أساسية' : 'Basic information'}</h2><p>{isArabic ? 'الاسم، نوع العنصر ورمزه.' : 'Name, item type and code.'}</p></div></div>
          <div className="form-grid two-cols"><label className="form-field"><span>{isArabic ? 'الاسم بالعربية *' : 'Arabic name *'}</span><input value={form.name_ar} onChange={(e) => setValue('name_ar', e.target.value)} required /></label><label className="form-field"><span>{isArabic ? 'الاسم بالإنجليزية' : 'English name'}</span><input value={form.name_en} onChange={(e) => setValue('name_en', e.target.value)} dir="auto" /></label></div>
          <div className="form-grid two-cols"><label className="form-field"><span>{isArabic ? 'نوع العنصر' : 'Item type'}</span><select value={form.item_type} onChange={(e) => setValue('item_type', e.target.value as 'product' | 'service')}><option value="product">{isArabic ? 'منتج ملموس' : 'Physical product'}</option><option value="service">{isArabic ? 'خدمة رقمية' : 'Digital service'}</option></select></label><label className="form-field"><span>{isArabic ? 'الفئة' : 'Category'}</span><select value={form.category_id} onChange={(e) => setValue('category_id', e.target.value)}><option value="">{isArabic ? 'بدون فئة' : 'No category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{isArabic ? category.name_ar : category.name_en}</option>)}</select></label></div>
          <div className="form-grid two-cols"><label className="form-field"><span>{isArabic ? 'الباركود (اختياري)' : 'Barcode (optional)'}</span><input value={form.barcode} onChange={(e) => setValue('barcode', e.target.value)} dir="ltr" /></label><label className="form-field"><span>{isArabic ? 'رمز داخلي / SKU (اختياري)' : 'SKU (optional)'}</span><input value={form.sku} onChange={(e) => setValue('sku', e.target.value)} dir="ltr" /></label></div>
          <label className="form-field"><span>{isArabic ? 'الرابط المختصر (اختياري)' : 'URL slug (optional)'}</span><input value={form.slug} onChange={(e) => setValue('slug', e.target.value)} dir="ltr" placeholder={isArabic ? 'يتم إنشاؤه تلقائيًا إذا تركته فارغًا' : 'Generated automatically when empty'} /></label>
        </section>

        <section className="admin-panel editor-panel"><div className="editor-section-heading"><span>02</span><div><h2>{isArabic ? 'السعر والوصف' : 'Price & description'}</h2><p>{isArabic ? 'الحقول التي تظهر للزبون في صفحة التفاصيل.' : 'Information shown on the item detail page.'}</p></div></div>
          <div className="form-grid two-cols"><label className="form-field"><span>{isArabic ? 'السعر بالدينار الجزائري' : 'Price in DZD'}</span><input type="number" min="0" step="1" value={form.base_price} onChange={(e) => setValue('base_price', e.target.value)} placeholder="0" /></label><label className="form-field"><span>{isArabic ? 'السعر قبل التخفيض (اختياري)' : 'Compare-at price (optional)'}</span><input type="number" min="0" step="1" value={form.compare_at_price} onChange={(e) => setValue('compare_at_price', e.target.value)} /></label></div>
          <label className="form-field"><span>{isArabic ? 'وصف قصير بالعربية' : 'Short description (Arabic)'}</span><input value={form.short_desc_ar} onChange={(e) => setValue('short_desc_ar', e.target.value)} /></label>
          <label className="form-field"><span>{isArabic ? 'وصف قصير بالإنجليزية' : 'Short description (English)'}</span><input value={form.short_desc_en} onChange={(e) => setValue('short_desc_en', e.target.value)} dir="ltr" /></label>
          <label className="form-field"><span>{isArabic ? 'الوصف الكامل بالعربية' : 'Full description (Arabic)'}</span><textarea rows={5} value={form.description_ar} onChange={(e) => setValue('description_ar', e.target.value)} /></label>
          <label className="form-field"><span>{isArabic ? 'الوصف الكامل بالإنجليزية' : 'Full description (English)'}</span><textarea rows={4} value={form.description_en} onChange={(e) => setValue('description_en', e.target.value)} dir="ltr" /></label>
        </section>

        {form.item_type === 'service' && <section className="admin-panel editor-panel"><div className="editor-section-heading"><span>03</span><div><h2>{isArabic ? 'حقول طلب الخدمة' : 'Service request fields'}</h2><p>{isArabic ? 'كل سطر حقل يظهر للزبون ويُضاف إلى رسالة الطلب.' : 'Each line becomes a customer field and is included in the request message.'}</p></div></div>
          <label className="form-field"><span>{isArabic ? 'الحقول — سطر لكل حقل' : 'Fields — one per line'}</span><textarea rows={5} value={form.service_fields_text} onChange={(e) => setValue('service_fields_text', e.target.value)} placeholder={isArabic ? 'اسم الحساب|account_name|text|مطلوب\nالمنصة|platform|select|مطلوب|PS5, Xbox, PC\nملاحظات إضافية|notes|text|اختياري' : 'Account name|account_name|text|required\nPlatform|platform|select|required|PS5, Xbox, PC\nExtra notes|notes|text|optional'} dir="auto" /></label>
          <div className="field-help"><strong>{isArabic ? 'الصيغة:' : 'Format:'}</strong> {isArabic ? 'اسم الحقل | المفتاح | النوع (text/number/select) | مطلوب أو اختياري | خيارات القائمة (اختياري)' : 'Label | key | type (text/number/select) | required or optional | select options (optional)'}</div>
        </section>}

        <section className="admin-panel editor-panel"><div className="editor-section-heading"><span>{form.item_type === 'service' ? '04' : '03'}</span><div><h2>{isArabic ? 'صور العنصر' : 'Item images'}</h2><p>{isArabic ? 'ارفع صورًا واضحة؛ أول صورة ستكون الرئيسية إذا لم توجد صورة سابقة.' : 'Upload clear images. The first will be primary when no existing image is present.'}</p></div></div>
          {product?.product_images?.length ? <div className="admin-image-grid">{product.product_images.map((image) => <div key={image.id} className="admin-image-item">{image.media_type === 'video' ? <video src={image.url} controls preload="metadata" /> : <img src={image.url} alt="" />}<button type="button" onClick={() => void deleteImage(image.id, image.url)} aria-label={isArabic ? 'حذف الوسيط' : 'Delete media'}><X size={15} /></button>{image.is_primary && <span>{isArabic ? 'رئيسية' : 'Primary'}</span>}</div>)}</div> : null}
          <label className="upload-dropzone"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /><span className="upload-drop-icon"><ImagePlus size={26} /></span><strong>{isArabic ? 'اضغط لاختيار صور أو فيديو من جهازك' : 'Choose images or videos'}</strong><small>{isArabic ? 'صور أو فيديو MP4/WebM — حد 10 ميغابايت لكل ملف' : 'JPG/PNG/WebP or MP4/WebM videos — max 10 MB each'}</small><span className="button button-outline"><UploadCloud size={16} />{isArabic ? 'اختيار الصور والفيديو' : 'Select images'}</span></label>
          {files.length > 0 && <div className="selected-file-list">{files.map((file) => <span key={`${file.name}-${file.size}`}><FileImage size={14} />{file.name}<button type="button" onClick={() => setFiles((old) => old.filter((current) => current !== file))}><X size={13} /></button></span>)}</div>}
        </section>
      </div>

      <aside className="admin-editor-side"><section className="admin-panel editor-publish-panel"><h2>{isArabic ? 'حالة النشر' : 'Publishing status'}</h2><label className="switch-field"><span><strong>{isArabic ? 'ظاهر في المتجر' : 'Visible in store'}</strong><small>{isArabic ? 'يمكن للزبائن الوصول إليه' : 'Customers can see this item'}</small></span><input type="checkbox" checked={form.is_active} onChange={(e) => setValue('is_active', e.target.checked)} /></label><label className="switch-field"><span><strong>{isArabic ? 'منتج مميز' : 'Featured item'}</strong><small>{isArabic ? 'يعرض في قسم المنتجات المميزة' : 'Show in featured section'}</small></span><input type="checkbox" checked={form.is_featured} onChange={(e) => setValue('is_featured', e.target.checked)} /></label><div className="editor-save-actions"><button type="submit" className="button button-gold full-width" disabled={saving}>{saving ? <LoaderCircle size={18} className="spin" /> : <Save size={17} />}{saving ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...') : (isArabic ? 'حفظ العنصر' : 'Save item')}</button><button type="button" className="button button-outline full-width" onClick={() => navigate('/admin')}>{isArabic ? 'إلغاء' : 'Cancel'}</button></div>{uploadProgress && <p className="upload-progress"><LoaderCircle size={15} className="spin" />{uploadProgress}</p>}{error && <p className="form-error"><CircleAlert size={15} />{error}</p>}{success && <p className="form-success"><Check size={15} />{success}</p>}</section><div className="admin-side-tip"><ShieldCheck size={18} /><p>{isArabic ? 'الباركود فريد. إذا كان مستخدمًا لمنتج آخر سيظهر خطأ بدل استبدال البيانات.' : 'Barcode is unique. If already used by another item, the save will be rejected.'}</p></div></aside>
    </form>
  </div>;
}

export function AdminCategoriesPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');

  const reload = async () => { setLoading(true); setCategories(await fetchCategories(true)); setLoading(false); };
  useEffect(() => { void reload(); }, []);

  const addCategory = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!supabase || !newNameAr.trim()) return;
    setSaving(true);
    const slug = slugify(newNameEn.trim() || newNameAr.trim());
    const { error: insertError } = await supabase.from('categories').insert({ name_ar: newNameAr.trim(), name_en: newNameEn.trim() || newNameAr.trim(), slug, sort_order: categories.length * 10 + 10, is_active: true });
    if (insertError) setError(insertError.message);
    else { setNewNameAr(''); setNewNameEn(''); await reload(); }
    setSaving(false);
  };

  const updateCategory = async (category: Category, fields: Partial<Category>) => {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('categories').update(fields).eq('id', category.id);
    if (updateError) setError(updateError.message); else await reload();
  };

  const deleteCategory = async (category: Category) => {
    if (!supabase || !window.confirm(isArabic ? `حذف الفئة «${category.name_ar}»؟ المنتجات المرتبطة بها ستبقى دون فئة.` : `Delete category “${category.name_en}”? Its products will remain uncategorised.`)) return;
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', category.id);
    if (deleteError) setError(deleteError.message); else await reload();
  };

  return <div className="admin-content-stack"><PageHeader title={isArabic ? 'الفئات والأقسام' : 'Categories'} subtitle={isArabic ? 'رتّب الهواتف والإكسسوارات والخدمات الرقمية.' : 'Organise phones, accessories and digital services.'} />
    <section className="admin-panel"><div className="admin-panel-heading"><div><h2><FolderTree size={18} />{isArabic ? 'إضافة فئة' : 'Add a category'}</h2><p>{isArabic ? 'اسم واضح بالعربية، ويمكن إضافة الاسم الإنجليزي.' : 'Use a clear name; English label is optional.'}</p></div></div><form className="category-add-form" onSubmit={addCategory}><label className="form-field"><span>{isArabic ? 'اسم الفئة بالعربية' : 'Arabic label'}</span><input value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} required /></label><label className="form-field"><span>{isArabic ? 'الاسم بالإنجليزية' : 'English label'}</span><input value={newNameEn} onChange={(e) => setNewNameEn(e.target.value)} /></label><button type="submit" className="button button-dark" disabled={saving}><Plus size={16} />{isArabic ? 'إضافة الفئة' : 'Add category'}</button></form>{error && <p className="form-error">{error}</p>}</section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><h2>{isArabic ? 'الفئات الحالية' : 'Existing categories'}</h2><p>{isArabic ? 'يمكن تعديل الأسماء وترتيب العرض وحالة الظهور.' : 'Edit names, display order and visibility.'}</p></div></div><div className="category-admin-list">{loading ? <div className="admin-empty"><LoaderCircle size={22} className="spin" />{isArabic ? 'تحميل الفئات...' : 'Loading categories...'}</div> : categories.map((category) => <div className="category-admin-row" key={category.id}><div className="category-admin-symbol"><FolderTree size={19} /></div><div className="category-admin-inputs"><input aria-label={isArabic ? 'اسم الفئة بالعربية' : 'Arabic category name'} defaultValue={category.name_ar} onBlur={(event) => { if (event.target.value.trim() && event.target.value !== category.name_ar) void updateCategory(category, { name_ar: event.target.value.trim() }); }} /><input aria-label={isArabic ? 'الاسم الإنجليزي' : 'English name'} defaultValue={category.name_en} dir="ltr" onBlur={(event) => { if (event.target.value.trim() && event.target.value !== category.name_en) void updateCategory(category, { name_en: event.target.value.trim() }); }} /></div><label className="category-active-toggle"><input type="checkbox" checked={category.is_active} onChange={(event) => void updateCategory(category, { is_active: event.target.checked })} /><span>{category.is_active ? (isArabic ? 'نشطة' : 'Active') : (isArabic ? 'مخفية' : 'Hidden')}</span></label><label className="sort-order-field"><span>{isArabic ? 'الترتيب' : 'Order'}</span><input type="number" defaultValue={category.sort_order} onBlur={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value !== category.sort_order) void updateCategory(category, { sort_order: value }); }} /></label><button className="icon-button danger-icon" onClick={() => void deleteCategory(category)} aria-label={isArabic ? 'حذف الفئة' : 'Delete category'}><Trash2 size={17} /></button></div>)}{!loading && !categories.length && <div className="admin-empty"><FolderTree size={24} />{isArabic ? 'لا توجد فئات.' : 'No categories yet.'}</div>}</div></section>
  </div>;
}

export function AdminSettingsPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { let alive = true; fetchStoreSettings().then((next) => { if (alive) { setSettings(next); setLoading(false); } }); return () => { alive = false; }; }, []);
  const setValue = (key: keyof StoreSettings, value: string) => setSettings((old) => ({ ...old, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!supabase) { setError(noSupabaseMessage(isArabic)); return; }
    setSaving(true);
    try {
      const rows = [
        ['store_name', settings.store_name_ar || 'جمال فون'], ['store_name_ar', settings.store_name_ar || 'جمال فون'], ['store_name_en', settings.store_name_en || 'Djamel Phone'],
        ['whatsapp_number', settings.whatsapp_number], ['contact_phone', settings.contact_phone], ['store_address', settings.store_address],
        ['logo_url', settings.logo_url === '/assets/jamal-logo.webp' ? '' : settings.logo_url], ['about', settings.about], ['about_ar', settings.about_ar], ['currency', 'DZD'],
      ].map(([key, value]) => ({ key, value }));
      const { error: saveError } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (saveError) throw saveError;
      setSuccess(isArabic ? 'تم حفظ إعدادات المتجر.' : 'Store settings saved.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : String(saveError)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="admin-empty"><LoaderCircle size={22} className="spin" />{isArabic ? 'تحميل الإعدادات...' : 'Loading settings...'}</div>;
  return <div className="admin-content-stack"><PageHeader title={isArabic ? 'إعدادات المتجر' : 'Store settings'} subtitle={isArabic ? 'هوية المتجر ورقم التواصل الذي ستُرسل إليه طلبات الشراء والخدمات.' : 'Store identity and the contact number for product and service requests.'} />
    <form onSubmit={save} className="admin-settings-form"><section className="admin-panel editor-panel"><div className="editor-section-heading"><span>01</span><div><h2>{isArabic ? 'الهوية' : 'Store identity'}</h2><p>{isArabic ? 'الأسماء التي تظهر في الواجهة الرئيسية.' : 'Names shown throughout the storefront.'}</p></div></div><div className="settings-brand-preview"><img src={settings.logo_url || '/assets/jamal-logo.webp'} alt="" /><span><strong>{settings.store_name_ar || 'جمال فون'}</strong><small>{isArabic ? 'معاينة هوية المتجر' : 'Store identity preview'}</small></span></div><label className="form-field"><span>{isArabic ? 'اسم المتجر بالعربية' : 'Store name in Arabic'}</span><input value={settings.store_name_ar} onChange={(e) => setValue('store_name_ar', e.target.value)} required /></label><label className="form-field"><span>{isArabic ? 'اسم المتجر بالإنجليزية' : 'Store name in English'}</span><input value={settings.store_name_en} onChange={(e) => setValue('store_name_en', e.target.value)} dir="ltr" required /></label><label className="form-field"><span>{isArabic ? 'رابط شعار بديل (اختياري)' : 'Custom logo URL (optional)'}</span><input value={settings.logo_url === '/assets/jamal-logo.webp' ? '' : settings.logo_url} onChange={(e) => setValue('logo_url', e.target.value || '/assets/jamal-logo.webp')} dir="ltr" placeholder="https://..." /></label><label className="form-field"><span>{isArabic ? 'وصف قصير بالعربية' : 'About the store (Arabic)'}</span><textarea rows={3} value={settings.about_ar} onChange={(e) => setValue('about_ar', e.target.value)} /></label><label className="form-field"><span>{isArabic ? 'الوصف بالإنجليزية' : 'About the store (English)'}</span><textarea rows={3} value={settings.about} onChange={(e) => setValue('about', e.target.value)} dir="ltr" /></label></section>
    <section className="admin-panel editor-panel"><div className="editor-section-heading"><span>02</span><div><h2>{isArabic ? 'التواصل' : 'Contact details'}</h2><p>{isArabic ? 'من دون رقم صحيح لن تعمل أزرار طلب WhatsApp بعد.' : 'Order buttons need a valid WhatsApp number to open a message.'}</p></div></div><label className="form-field"><span>{isArabic ? 'رقم WhatsApp للمتجر' : 'Store WhatsApp number'}</span><input value={settings.whatsapp_number} onChange={(e) => setValue('whatsapp_number', e.target.value)} dir="ltr" placeholder="2135XXXXXXXX" /><small className="field-help">{isArabic ? 'يمكن إدخال رقم جزائري يبدأ بـ 0، وسيحوّل إلى صيغة +213 تلقائيًا، أو رقم دولي دون علامة +.' : 'For Algeria, a local number starting with 0 is converted to +213. International format without + is also accepted.'}</small></label><label className="form-field"><span>{isArabic ? 'رقم اتصال إضافي (اختياري)' : 'Alternative phone (optional)'}</span><input value={settings.contact_phone} onChange={(e) => setValue('contact_phone', e.target.value)} dir="ltr" /></label><label className="form-field"><span>{isArabic ? 'العنوان' : 'Store address'}</span><input value={settings.store_address} onChange={(e) => setValue('store_address', e.target.value)} /></label><div className="settings-notice"><ShieldCheck size={19} /><p>{isArabic ? 'مفتاح Supabase العام آمن للاستعمال في الواجهة؛ لا تضف مطلقًا مفتاح service_role هنا أو في المتصفح.' : 'The Supabase publishable key is intended for frontend use. Never put a service_role key in the browser.'}</p></div></section><div className="settings-save-row">{error && <p className="form-error"><CircleAlert size={15} />{error}</p>}{success && <p className="form-success"><Check size={15} />{success}</p>}<button type="submit" className="button button-gold" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Save size={17} />}{isArabic ? 'حفظ إعدادات المتجر' : 'Save store settings'}</button></div></form>
  </div>;
}
