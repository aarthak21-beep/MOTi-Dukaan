import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Store, 
  Plus, 
  Languages, 
  CheckCircle2, 
  Cloud,
  Database
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { shop } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return t.navDashboard;
      case '/billing': return t.navBilling;
      case '/customers': return t.navCustomers;
      case '/udhar': return t.navUdhar;
      case '/products': return t.navProducts;
      case '/stock-movements': return t.navStockMovements;
      case '/expenses': return t.navExpenses;
      case '/reports': return t.navReports;
      case '/settings': return t.navSettings;
      case '/setup-guide': return t.navSetupGuide;
      default: return t.brandName;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sm:py-3 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand on Mobile, Context Title on Desktop */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="lg:hidden flex items-center gap-2 min-w-0">
            <Link to="/" className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
              M
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                MOTi Dukaan
              </h1>
              <p className="text-[10px] text-emerald-700 font-semibold truncate">
                {shop?.shopName || t.brandTagline}
              </p>
            </div>
          </div>

          <div className="hidden lg:block min-w-0">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {shop?.shopName} • {shop?.address}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick New Sale button (if not already on billing page) */}
          {location.pathname !== '/billing' && (
            <Link
              to="/billing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.actionNewSale}</span>
            </Link>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 rounded-md transition ${
                language === 'mr'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md transition ${
                language === 'en'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>

          {/* Shop Avatar / Indicator */}
          <Link
            to="/settings"
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title={t.shopDetails}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-300">
              {shop?.ownerName?.charAt(0) || 'D'}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
