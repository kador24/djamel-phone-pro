const APP = {
  store: {},
  home: {},
  categories: [],
  products: [],
  about: {},
  esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
  },
  async json(path, fallback = {}) {
    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (response.ok) return await response.json();
    } catch (error) {
      console.warn(`Could not load ${path}`, error);
    }
    return fallback;
  },
  path(path) {
    const value = String(path || '');
    if (/^(https?:|data:image\/)/i.test(value)) return value;
    return value.replace(/^\.?\//, '').replace(/^\/+/, '');
  },
  async init() {
    const [store, home, categoryData, about, index] = await Promise.all([
      this.json('content/store.json'),
      this.json('content/home.json'),
      this.json('content/categories.json', { categories: [] }),
      this.json('content/about.json'),
      this.json('products/index.json', { products: [] }),
    ]);
    this.store = store || {};
    this.home = home || {};
    this.categories = categoryData?.categories || [];
    this.about = about || {};
    const rows = Array.isArray(index?.products) ? index.products : [];
    this.products = (await Promise.all(rows.map(row =>
      this.json(`products/${encodeURIComponent(row.slug)}/product.json`, null),
    ))).filter(Boolean);
    this.bindShell();
    this.setCanonical();
    this.render();
  },
  safeExternal(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value).startsWith('http') ? value : `https://${value}`);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  },
  socialUrl(kind, value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^https?:\/\//i.test(raw)) return this.safeExternal(raw);
    const handle = raw.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
    const bases = { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', tiktok: 'https://tiktok.com/@' };
    return handle && bases[kind] ? `${bases[kind]}${encodeURIComponent(handle)}` : '';
  },
  bindShell() {
    const storeName = this.store?.name?.ar || 'جمال فون';
    document.querySelectorAll('[data-store-name]').forEach(element => { element.textContent = storeName; });
    document.querySelectorAll('.brand img').forEach(image => {
      image.src = this.path(this.store?.logo || 'content/brand/logo.svg');
    });
    document.querySelectorAll('[data-store-description]').forEach(element => {
      element.textContent = this.store?.description || 'كل ما تحتاجه لعالمك الرقمي، في مكان واحد.';
    });
    const whatsapp = String(this.store?.whatsapp || '').replace(/\D/g, '');
    document.querySelectorAll('[data-whatsapp]').forEach(link => {
      const text = link.dataset.message || this.store?.whatsappMessageTemplate || 'مرحبًا، أود الاستفسار عن المنتجات.';
      if (!whatsapp) {
        link.hidden = true;
        link.removeAttribute('href');
        return;
      }
      link.hidden = false;
      link.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'تواصل معنا عبر واتساب — يفتح في نافذة جديدة');
    });
    const phone = String(this.store?.phone || '').trim();
    document.querySelectorAll('[data-phone]').forEach(link => {
      if (!phone) {
        link.hidden = true;
        return;
      }
      link.hidden = false;
      link.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
      link.textContent = link.classList.contains('contact-phone-link') ? `اتصل بنا · ${phone}` : phone;
    });
    for (const kind of ['instagram', 'facebook', 'tiktok']) {
      const url = this.socialUrl(kind, this.store?.[kind]);
      document.querySelectorAll(`[data-${kind}]`).forEach(link => {
        if (!url) {
          link.hidden = true;
          return;
        }
        link.hidden = false;
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      });
    }
    const address = this.store?.address || 'الجزائر';
    const hours = this.store?.hours || '';
    document.querySelectorAll('#footer-address, #map-address, #map-address-home, #map-address').forEach(element => {
      element.textContent = address;
    });
    document.querySelectorAll('#footer-hours').forEach(element => { element.textContent = hours; element.hidden = !hours; });
    const mapLink = this.safeExternal(this.store?.mapsUrl);
    document.querySelectorAll('#footer-maps, #maps-link, #map-directions').forEach(link => {
      if (mapLink) {
        link.href = mapLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.hidden = false;
        if (link.id === 'map-directions') link.textContent = 'الاتجاهات ←';
      } else if (link.id === 'maps-link' || link.id === 'footer-maps') {
        link.href = 'contact.html';
        link.removeAttribute('target');
        link.removeAttribute('rel');
      } else {
        link.hidden = true;
      }
    });
    const icon = this.store?.favicon || this.store?.logo;
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && icon) favicon.href = this.path(icon);
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
    const menu = document.querySelector('.menu-btn');
    const nav = document.querySelector('.mobile-nav');
    if (menu && nav) {
      menu.onclick = () => {
        const open = nav.classList.toggle('open');
        menu.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
      };
    }
  },
  setCanonical() {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) return;
    const url = new URL(location.href);
    url.search = '';
    if (url.pathname.endsWith('/product.html')) {
      const slug = new URLSearchParams(location.search).get('slug');
      if (slug) url.searchParams.set('slug', slug);
    }
    canonical.href = url.href;
  },
  categoryName(slug) {
    const category = this.categories.find(item => item.slug === slug);
    return category?.ar || category?.en || slug || 'منتج تقني';
  },
  imageData(product, index = 0) {
    const image = product?.images?.[index];
    if (!image) return { src: 'assets/product-placeholder.svg', srcset: '' };
    if (image.files) {
      const files = image.files;
      const src = this.path(files.card || files.medium || files.large || files.thumb);
      const srcset = [
        [files.thumb, '240w'], [files.card, '640w'], [files.medium, '1000w'], [files.large, '1600w'],
      ].filter(([path], i, list) => path && list.findIndex(entry => entry[0] === path) === i)
        .map(([path, size]) => `${this.esc(this.path(path))} ${size}`).join(', ');
      return { src, srcset };
    }
    return { src: this.path(image.src), srcset: '' };
  },
  imageHTML(product, index = 0, alt = '', className = '', highPriority = false) {
    const { src, srcset } = this.imageData(product, index);
    const srcsetAttr = srcset ? ` srcset="${srcset}" sizes="(max-width: 680px) 82vw, (max-width: 1000px) 45vw, 360px"` : '';
    return `<img class="${this.esc(className)}" src="${this.esc(src)}"${srcsetAttr} alt="${this.esc(alt || product?.name || 'منتج من جمال فون')}" width="640" height="800" ${highPriority ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} onerror="this.onerror=null;this.src='assets/product-placeholder.svg'">`;
  },
  number(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  },
  priceText(value, currency = 'DZD') {
    const amount = this.number(value);
    if (amount === null) return '';
    const locale = 'ar-DZ';
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount) + ' ' + ({ DZD: 'دج', EUR: '€', USD: '$', GBP: '£' }[currency] || currency || 'دج');
    } catch {
      return `${amount.toLocaleString('ar-DZ')} ${currency || 'دج'}`;
    }
  },
  sale(product) {
    const price = this.number(product?.price);
    const compareAt = this.number(product?.compareAtPrice);
    return price !== null && compareAt !== null && compareAt > price ? { price, compareAt, percent: Math.round((1 - price / compareAt) * 100) } : null;
  },
  whatsappHref(message) {
    const phone = String(this.store?.whatsapp || '').replace(/\D/g, '');
    return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : 'contact.html';
  },
  productMessage(product) {
    const template = this.store?.whatsappMessageTemplate || 'مرحبًا، أود الاستفسار عن [Product Name].';
    return String(product?.whatsappMessage || template).replace(/\[Product Name\]/gi, product?.name || 'هذا المنتج');
  },
  card(product) {
    const sale = this.sale(product);
    const availability = product.availability === 'unavailable' ? 'غير متوفر' : 'متوفر';
    const badge = sale
      ? `<span class="badge badge-sale">خصم ${sale.percent}٪</span>`
      : product.new ? '<span class="badge badge-new">وصل حديثًا</span>' : '';
    const priceHTML = product.price != null && product.price !== ''
      ? `<div class="card-price">${sale ? `<del>${this.esc(this.priceText(sale.compareAt, product.currency))}</del>` : ''}<strong>${this.esc(this.priceText(product.price, product.currency))}</strong></div>`
      : '<div class="card-price"><strong class="price-contact">اسأل عن السعر</strong></div>';
    return `<article class="product-card">
      <a class="product-card-link" href="product.html?slug=${encodeURIComponent(product.slug)}" aria-label="تفاصيل ${this.esc(product.name)}">
        <div class="product-card-image">${this.imageHTML(product, 0, product.name)}${badge ? `<div class="card-badges">${badge}</div>` : ''}<span class="card-arrow" aria-hidden="true">↖</span></div>
        <div class="product-card-body"><span class="category">${this.esc(this.categoryName(product.category))}${product.brand ? ` <b>·</b> ${this.esc(product.brand)}` : ''}</span><h3>${this.esc(product.name)}</h3>${product.description ? `<p>${this.esc(product.description)}</p>` : ''}<div class="card-bottom">${priceHTML}<span class="availability${product.availability === 'unavailable' ? ' is-unavailable' : ''}"><i></i>${availability}</span></div></div>
      </a>
    </article>`;
  },
  emptyState(title, message, action = '') {
    return `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">✦</span><h3>${this.esc(title)}</h3><p>${this.esc(message)}</p>${action}</div>`;
  },
  setText(id, value) {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  },
  setStoryText(id, value) {
    const element = document.getElementById(id);
    if (!element || !value) return;
    const paragraphs = String(value).split(/\n+/).map(item => item.trim()).filter(Boolean);
    element.innerHTML = paragraphs.map((paragraph, index) => `<p${index === 0 ? ' class=\"lead\"' : ''}>${this.esc(paragraph)}</p>`).join('');
  },
  render() {
    const pathname = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
    const path = pathname.endsWith('.html') ? pathname : 'index.html';
    document.querySelectorAll('[data-nav]').forEach(link => {
      const active = link.dataset.nav === (path === 'index.html' ? 'home' : path.replace('.html', ''));
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (path === 'index.html') this.homePage();
    else if (path === 'collection.html') this.collectionPage();
    else if (path === 'product.html') this.productPage();
    else if (path === 'about.html') this.aboutPage();
    else if (path === 'contact.html') this.contactPage();
  },
  homePage() {
    const home = this.home || {};
    const hero = home.hero || {};
    this.setText('hero-title', hero.title || 'تقنيتك تبدأ من هنا.');
    this.setText('hero-text', hero.description || 'هواتف ذكية، إكسسوارات وأجهزة تقنية تختارها بثقة.');
    const heroImage = document.getElementById('hero-image');
    if (heroImage && hero.image) {
      heroImage.src = this.path(hero.image);
      heroImage.onerror = () => { heroImage.onerror = null; heroImage.src = 'assets/hero.svg'; };
    }
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) {
      categoryGrid.innerHTML = this.categories.length ? this.categories.map((category, index) => {
        const count = this.products.filter(product => product.category === category.slug).length;
        const symbols = ['▣', '⌚', '◉', '⌁', '◈', '⌘', '▤', '✦'];
        return `<a class="category-card" href="collection.html?category=${encodeURIComponent(category.slug)}"><span class="category-icon" aria-hidden="true">${symbols[index % symbols.length]}</span><span class="category-card-copy"><strong>${this.esc(category.ar || category.en)}</strong><small>${count ? `${count} منتجات` : 'اكتشف الفئة'}</small></span><span class="category-arrow" aria-hidden="true">↖</span></a>`;
      }).join('') : this.emptyState('الفئات قيد التجهيز', 'ستظهر فئات المنتجات هنا بعد تحديث كتالوج المتجر.');
    }
    const deals = this.products.filter(product => this.sale(product) && product.availability !== 'unavailable').slice(0, 4);
    this.setText('offers-title', home.offers?.title || 'عروض جمال فون');
    const offersGrid = document.getElementById('offers-grid');
    if (offersGrid) {
      offersGrid.innerHTML = deals.length ? deals.map(product => this.card(product)).join('')
        : this.emptyState('العروض قيد التحديث', 'لا توجد تخفيضات منشورة حاليًا. أضف سعر العرض والسعر السابق من لوحة الإدارة لتظهر المنتجات المخفّضة هنا.', `<a class="btn btn-outline-light" href="collection.html">تصفّح المنتجات <span aria-hidden="true">←</span></a>`);
    }
    const featured = home.featuredProducts || {};
    this.setText('featured-title', featured.title || 'منتجات مميزة');
    const featuredProducts = featured.slugs?.length
      ? featured.slugs.map(slug => this.products.find(product => product.slug === slug)).filter(Boolean)
      : this.products.filter(product => product.featured);
    const featuredGrid = document.getElementById('featured-products');
    if (featuredGrid) {
      featuredGrid.innerHTML = featuredProducts.length
        ? featuredProducts.slice(0, 6).map(product => this.card(product)).join('')
        : this.emptyState('قريبًا في جمال فون', 'نعمل على تجهيز كتالوج المنتجات. عُد قريبًا لاكتشاف أحدث الهواتف والإكسسوارات.');
    }
    const story = home.heritage || {};
    this.setText('heritage-title', story.title || 'التقنية اليومية، بكل بساطة.');
    this.setStoryText('heritage-text', story.text || this.store?.heritageStory || '');
    const heritageImage = document.getElementById('heritage-image');
    if (heritageImage && story.image) {
      heritageImage.src = this.path(story.image);
      heritageImage.onerror = () => { heritageImage.onerror = null; heritageImage.src = 'assets/hero.svg'; };
    }
    const craft = home.craftsmanship || {};
    this.setText('craftsmanship-title', craft.title || 'كل ما تحتاجه لعالمك الرقمي.');
    this.setStoryText('craftsmanship-text', craft.text || 'من الهواتف الذكية إلى الإكسسوارات والصوتيات والساعات والأجهزة التقنية.');
    const craftImage = document.getElementById('craftsmanship-image');
    if (craftImage && craft.image) {
      craftImage.src = this.path(craft.image);
      craftImage.onerror = () => { craftImage.onerror = null; craftImage.src = 'assets/hero.svg'; };
    }
    const why = home.whyUs || {};
    this.setText('why-title', why.title || 'تسوّق بثقة. واختر على راحتك.');
    const whyGrid = document.getElementById('why-grid');
    const defaultReasons = [
      { title: 'معلومات واضحة', text: 'مواصفات وحالة وضمان كل منتج ظاهرة قبل تواصلك معنا.', icon: '01' },
      { title: 'اختيار متنوع', text: 'هواتف وإكسسوارات وأجهزة تقنية في مكان واحد.', icon: '02' },
      { title: 'تواصل مباشر', text: 'اسأل عن السعر والتوفر عبر واتساب بكل سهولة.', icon: '03' },
    ];
    if (whyGrid) whyGrid.innerHTML = (why.items?.length ? why.items : defaultReasons).map((item, index) => `<article class="feature-card"><span class="feature-number">${item.icon ? this.esc(item.icon) : `0${index + 1}`}</span><h3>${this.esc(item.title)}</h3><p>${this.esc(item.text)}</p></article>`).join('');
    const location = home.location || {};
    this.setText('location-title', location.title || 'نحن أقرب إليك');
    this.setText('location-text', location.text || 'مرحبًا بك في متجر جمال فون. تواصل معنا لمعرفة الموقع ومواعيد العمل.');
    this.renderVisitDetails();
    const cta = home.whatsappCta || {};
    this.setText('cta-title', cta.title || 'تبحث عن شيء معيّن؟');
    this.setText('cta-text', cta.text || 'أخبرنا بما تحتاجه، وسنساعدك في معرفة التفاصيل والتوفر.');
  },
  renderVisitDetails() {
    const details = document.getElementById('visit-details');
    if (!details) return;
    const rows = [];
    if (this.store?.address) rows.push(`<div><span class="visit-detail-icon">⌖</span><span><small>العنوان</small><strong>${this.esc(this.store.address)}</strong></span></div>`);
    if (this.store?.hours) rows.push(`<div><span class="visit-detail-icon">◷</span><span><small>مواعيد العمل</small><strong>${this.esc(this.store.hours)}</strong></span></div>`);
    details.innerHTML = rows.join('') || `<div><span class="visit-detail-icon">⌖</span><span><small>الموقع</small><strong>الجزائر</strong></span></div>`;
    const map = document.getElementById('home-map');
    if (map && this.store?.address) this.setText('map-address', this.store.address);
  },
  collectionPage() {
    const grid = document.getElementById('products-grid');
    const search = document.getElementById('search');
    const category = document.getElementById('category-filter');
    const brand = document.getElementById('brand-filter');
    const min = document.getElementById('price-min');
    const max = document.getElementById('price-max');
    const offers = document.getElementById('offers-only');
    const sort = document.getElementById('sort-select');
    const count = document.getElementById('result-count');
    if (!grid || !search || !category || !brand || !min || !max || !offers || !sort) return;
    this.categories.forEach(item => category.insertAdjacentHTML('beforeend', `<option value="${this.esc(item.slug)}">${this.esc(item.ar || item.en)}</option>`));
    [...new Set(this.products.map(product => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar')).forEach(name => {
      brand.insertAdjacentHTML('beforeend', `<option value="${this.esc(name)}">${this.esc(name)}</option>`);
    });
    const query = new URLSearchParams(location.search);
    if (query.has('category')) category.value = query.get('category');
    if (query.get('offers') === '1') offers.checked = true;
    const clear = document.getElementById('clear-search');
    const draw = () => {
      const needle = search.value.trim().toLocaleLowerCase('ar');
      const low = min.value === '' ? null : this.number(min.value);
      const high = max.value === '' ? null : this.number(max.value);
      let matches = this.products.filter(product => {
        const sale = this.sale(product);
        const productPrice = this.number(product.price);
        const text = [product.name, product.description, product.brand, product.model, product.category, this.categoryName(product.category)]
          .filter(Boolean).join(' ').toLocaleLowerCase('ar');
        return (!needle || text.includes(needle))
          && (!category.value || product.category === category.value)
          && (!brand.value || product.brand === brand.value)
          && (low === null || (productPrice !== null && productPrice >= low))
          && (high === null || (productPrice !== null && productPrice <= high))
          && (!offers.checked || (Boolean(sale) && product.availability !== 'unavailable'));
      });
      if (sort.value === 'price-asc') matches.sort((a, b) => (this.number(a.price) ?? Infinity) - (this.number(b.price) ?? Infinity));
      if (sort.value === 'price-desc') matches.sort((a, b) => (this.number(b.price) ?? -Infinity) - (this.number(a.price) ?? -Infinity));
      if (sort.value === 'name') matches.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      if (count) count.textContent = `عرض ${matches.length} من ${this.products.length} منتج`;
      if (clear) clear.hidden = !search.value;
      grid.innerHTML = matches.length ? matches.map(product => this.card(product)).join('')
        : this.emptyState(this.products.length ? 'لا توجد نتائج مطابقة' : 'الكتالوج قيد التجهيز', this.products.length ? 'جرّب تعديل الفلاتر أو كلمات البحث.' : 'ستظهر المنتجات هنا فور نشرها من لوحة إدارة جمال فون.', this.products.length ? '<button class="btn btn-outline" type="button" id="empty-reset">مسح الفلاتر</button>' : '');
      document.getElementById('empty-reset')?.addEventListener('click', () => document.getElementById('reset-filters')?.click());
    };
    [search, category, brand, min, max, offers, sort].forEach(control => control.addEventListener(control === search || control === min || control === max ? 'input' : 'change', draw));
    clear?.addEventListener('click', () => { search.value = ''; search.focus(); draw(); });
    document.getElementById('reset-filters')?.addEventListener('click', event => {
      event.preventDefault();
      search.value = '';
      category.value = '';
      brand.value = '';
      min.value = '';
      max.value = '';
      offers.checked = false;
      sort.value = 'featured';
      history.replaceState(null, '', location.pathname);
      draw();
    });
    draw();
  },
  productPage() {
    const slug = new URLSearchParams(location.search).get('slug');
    const product = this.products.find(item => item.slug === slug);
    const element = document.getElementById('product-detail');
    if (!element) return;
    if (!product) {
      element.innerHTML = this.emptyState('لم نعثر على هذا المنتج', 'ربما أُزيل المنتج أو تغيّر رابطه. تصفّح المجموعة لاكتشاف بقية المنتجات.', '<a class="btn btn-primary" href="collection.html">العودة إلى المنتجات <span aria-hidden="true">←</span></a>');
      return;
    }
    const sale = this.sale(product);
    const specifications = [
      ['brand', 'الماركة'], ['model', 'الموديل'], ['ram', 'الذاكرة العشوائية'], ['storage', 'مساحة التخزين'],
      ['processor', 'المعالج'], ['screen', 'الشاشة'], ['battery', 'البطارية'], ['camera', 'الكاميرا'], ['color', 'اللون'],
    ].filter(([key]) => product[key]);
    const status = product.availability === 'unavailable' ? 'غير متوفر حاليًا' : 'متوفر — اسألنا عن التوفر';
    const guarantees = [
      product.condition ? `<div class="assurance-item"><span class="assurance-icon">✓</span><span><small>الحالة</small><strong>${this.esc(product.condition)}</strong></span></div>` : '',
      product.warranty ? `<div class="assurance-item"><span class="assurance-icon">◇</span><span><small>الضمان</small><strong>${this.esc(product.warranty)}</strong></span></div>` : '',
      `<div class="assurance-item"><span class="assurance-icon">◉</span><span><small>التوفر</small><strong>${this.esc(status)}</strong></span></div>`,
    ].filter(Boolean).join('');
    const imageCount = product.images?.length || 0;
    const price = product.price != null && product.price !== ''
      ? `<div class="detail-price">${sale ? `<div class="sale-line"><del>${this.esc(this.priceText(sale.compareAt, product.currency))}</del><span class="badge badge-sale">خصم ${sale.percent}٪</span></div>` : ''}<strong>${this.esc(this.priceText(product.price, product.currency))}</strong></div>`
      : '<div class="detail-price"><strong class="price-contact">اسألنا عن السعر</strong></div>';
    const message = this.productMessage(product);
    element.innerHTML = `<div class="product-detail-layout"><div class="product-gallery">
      <div class="gallery-stage" id="gallery-stage">${this.imageHTML(product, 0, product.name, 'gallery-image', true)}${sale ? `<span class="gallery-badge badge badge-sale">عرض خاص · خصم ${sale.percent}٪</span>` : ''}</div>
      ${imageCount > 1 ? `<div class="gallery-thumbs" role="group" aria-label="صور المنتج">${product.images.map((image, index) => `<button type="button" class="gallery-thumb${index === 0 ? ' active' : ''}" data-image-index="${index}" aria-label="عرض الصورة ${index + 1}" aria-pressed="${index === 0}">${this.imageHTML(product, index, `${product.name} — صورة ${index + 1}`)}</button>`).join('')}</div>` : ''}
    </div><div class="detail-copy"><div class="detail-heading"><span class="eyebrow">${this.esc(this.categoryName(product.category))}${product.brand ? ` · ${this.esc(product.brand)}` : ''}</span><h1>${this.esc(product.name)}</h1>${product.model ? `<p class="model-line">${this.esc(product.model)}</p>` : ''}</div>${product.description ? `<p class="detail-description">${this.esc(product.description)}</p>` : ''}${price}<div class="detail-assurances">${guarantees}</div>${specifications.length ? `<div class="specifications"><h2>المواصفات</h2><dl>${specifications.map(([key, label]) => `<div class="spec-row"><dt>${label}</dt><dd>${this.esc(product[key])}</dd></div>`).join('')}</dl></div>` : ''}<div class="detail-actions"><a class="btn btn-primary detail-whatsapp" data-whatsapp data-message="${this.esc(message)}" href="${this.esc(this.whatsappHref(message))}">اسأل عن المنتج عبر واتساب <span aria-hidden="true">↗</span></a><a class="btn btn-outline" href="collection.html">العودة إلى المنتجات</a></div><p class="detail-footnote">السعر والتوفر قابلان للتحديث؛ تواصل معنا للتأكيد قبل الزيارة.</p></div></div>`;
    document.title = `${product.name} | جمال فون`;
    this.setText('breadcrumb-current', product.name);
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (description) description.content = `${product.name}${product.brand ? ` من ${product.brand}` : ''} — المواصفات والسعر والضمان في جمال فون.`;
    if (ogTitle) ogTitle.content = `${product.name} | جمال فون`;
    if (ogDescription) ogDescription.content = product.description || `اطّلع على تفاصيل ${product.name} وتواصل مع جمال فون.`;
    const thumbnails = element.querySelectorAll('.gallery-thumb');
    thumbnails.forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.imageIndex);
        const image = element.querySelector('.gallery-image');
        const next = this.imageData(product, index);
        image.src = next.src;
        if (next.srcset) image.srcset = next.srcset;
        thumbnails.forEach(item => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', String(active));
        });
      });
    });
    this.bindShell();
    const related = this.products.filter(item => item.slug !== product.slug && item.category === product.category).slice(0, 3);
    const relatedSection = document.getElementById('related-section');
    const relatedGrid = document.getElementById('related-products');
    if (related.length && relatedSection && relatedGrid) {
      relatedSection.hidden = false;
      relatedGrid.innerHTML = related.map(item => this.card(item)).join('');
    }
  },
  aboutPage() {
    this.setText('about-title', this.about?.title || 'تقنية أقرب، واختيار أوضح.');
    this.setText('about-subtitle', this.store?.description || this.about?.subtitle || '');
    const story = document.getElementById('about-story');
    const storeStory = String(this.store?.heritageStory || '').split(/\n+/).filter(Boolean);
    const paragraphs = storeStory.length ? storeStory : this.about?.story || [];
    if (story) story.innerHTML = paragraphs.map((paragraph, index) => `<p${index === 0 ? ' class="lead"' : ''}>${this.esc(paragraph)}</p>`).join('');
    const values = document.getElementById('about-values');
    if (values) {
      const items = this.about?.values?.length ? this.about.values : [
        { title: 'وضوح قبل الشراء', text: 'مواصفات وحالة وضمان معروضة بوضوح لتختار وأنت مطمئن.' },
        { title: 'تنوع يناسبك', text: 'هواتف وإكسسوارات وأجهزة تقنية تتجاوز فئة واحدة.' },
        { title: 'خدمة مباشرة', text: 'تواصل محلي سريع للإجابة عن أسئلتك حول المنتجات.' },
      ];
      values.innerHTML = items.map((item, index) => `<article class="feature-card"><span class="feature-number">0${index + 1}</span><h3>${this.esc(item.title)}</h3><p>${this.esc(item.text)}</p></article>`).join('');
    }
  },
  contactPage() {
    const info = document.getElementById('contact-info');
    if (info) {
      const rows = [];
      if (this.store?.address) rows.push(`<div class="contact-line"><span class="contact-line-icon">⌖</span><div><small>العنوان</small><strong>${this.esc(this.store.address)}</strong></div></div>`);
      if (this.store?.phone) rows.push(`<div class="contact-line"><span class="contact-line-icon">↗</span><div><small>الهاتف</small><a href="tel:${this.esc(String(this.store.phone).replace(/\D/g, ''))}">${this.esc(this.store.phone)}</a></div></div>`);
      if (this.store?.hours) rows.push(`<div class="contact-line"><span class="contact-line-icon">◷</span><div><small>مواعيد العمل</small><strong>${this.esc(this.store.hours)}</strong></div></div>`);
      info.innerHTML = rows.join('') || '<p class="contact-unconfigured">بيانات التواصل والعنوان ستظهر هنا عند إضافتها.</p>';
    }
    const map = document.getElementById('map-card');
    const address = this.store?.address || '';
    if (map && address) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
      iframe.loading = 'lazy';
      iframe.title = `موقع جمال فون — ${address}`;
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      map.replaceChildren(iframe);
    } else if (map && this.safeExternal(this.store?.mapsUrl)) {
      const link = document.createElement('a');
      link.className = 'map-open-card';
      link.href = this.safeExternal(this.store.mapsUrl);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.innerHTML = '<span class=\"map-open-icon\">⌖</span><strong>افتح موقع المتجر على Google Maps</strong><small>اضغط لعرض الموقع والاتجاهات</small>';
      map.replaceChildren(link);
    }
    const socials = document.getElementById('contact-socials');
    if (socials) {
      const entries = [
        ['instagram', 'إنستغرام'], ['facebook', 'فيسبوك'], ['tiktok', 'تيك توك'],
      ].filter(([kind]) => this.socialUrl(kind, this.store?.[kind]));
      socials.innerHTML = entries.map(([kind, label]) => `<a data-${kind} href="#">${label} <span aria-hidden="true">↗</span></a>`).join('');
      for (const [kind] of entries) {
        const link = socials.querySelector(`[data-${kind}]`);
        link.href = this.socialUrl(kind, this.store[kind]);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    }
  },
};

document.addEventListener('DOMContentLoaded', () => APP.init());