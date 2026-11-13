import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  BookOpen, 
  Package, 
  ArrowLeftRight, 
  Wallet, 
  BarChart3, 
  Settings, 
  Database,
  LogOut,
  Store,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { shop, logout } = useAuth();

  const navItems = [
    { to: '/', label: t.navDashboard, icon: LayoutDashboard },
    { to: '/billing', label: t.navBilling, icon: Receipt, highlight: true },
    { to: '/customers', label: t.navCustomers, icon: Users },
    { to: '/udhar', label: t.navUdhar, icon: BookOpen },
    { to: '/products', label: t.navProducts, icon: Package },
    { to: '/stock-movements', label: t.navStockMovements, icon: ArrowLeftRight },
    { to: '/expenses', label: t.navExpenses, icon: Wallet },
    { to: '/reports', label: t.navReports, icon: BarChart3 },
    { to: '/setup-guide', label: t.navSetupGuide, icon: Database },
    { to: '/settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 font-black text-xl">
            M
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-white tracking-tight">MOTi Dukaan</span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Biz</span>
            </div>
            <p className="text-[11px] text-emerald-400 truncate font-medium">
              {t.brandTagline}
            </p>
          </div>
        </div>
      </div>

      {/* Shop Info Card */}
      {shop && (
        <div className="px-4 py-3 mx-3 my-2 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{shop.shopName}</p>
            <p className="text-[11px] text-slate-400 truncate">{shop.ownerName}</p>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                    : item.highlight
                    ? 'text-emerald-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Branding & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.actionLogout}</span>
        </button>

        <div className="mt-2 text-center text-[10px] text-slate-400 font-medium">
          {t.poweredBy}
        </div>
      </div>
    </aside>
  );
};
