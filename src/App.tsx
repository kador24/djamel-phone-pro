import { Link, Route, Routes } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Home } from 'lucide-react';
import { LanguageProvider, useLang } from './components/Language';
import { StoreLayout } from './components/Layout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductPage from './pages/ProductPage';
import { AdminCategoriesPage, AdminGuard, AdminLoginPage, AdminProductEditorPage, AdminProductsPage, AdminSettingsPage } from './pages/AdminPages';

function NotFoundPage() {
  const { lang } = useLang();
  const isArabic = lang === 'ar';
  return <div className="container inner-page"><div className="catalogue-empty"><span className="empty-icon"><AlertTriangle size={32} /></span><h1>{isArabic ? 'الصفحة غير موجودة' : 'Page not found'}</h1><p>{isArabic ? 'الرابط الذي فتحته غير متاح.' : 'The page you opened is not available.'}</p><Link className="button button-dark" to="/"><Home size={16} />{isArabic ? 'العودة للرئيسية' : 'Back home'}<ArrowRight size={16} /></Link></div></div>;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<StoreLayout><HomePage /></StoreLayout>} />
    <Route path="/products" element={<StoreLayout><ProductsPage /></StoreLayout>} />
    <Route path="/products/:slug" element={<StoreLayout><ProductPage /></StoreLayout>} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<AdminGuard />}>
      <Route path="/admin" element={<AdminProductsPage />} />
      <Route path="/admin/products/new" element={<AdminProductEditorPage />} />
      <Route path="/admin/products/:id" element={<AdminProductEditorPage />} />
      <Route path="/admin/categories" element={<AdminCategoriesPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
    </Route>
    <Route path="*" element={<StoreLayout><NotFoundPage /></StoreLayout>} />
  </Routes>;
}

export default function App() {
  return <LanguageProvider><AppRoutes /></LanguageProvider>;
}
