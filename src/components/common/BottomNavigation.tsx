import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Package, 
  Menu, 
  BookOpen, 
  Wallet, 
  BarChart3, 
  Settings, 
  Database,
  ArrowLeftRight,
  LogOut,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const BottomNavigation: React.FC = () => {
  const { t } = useLanguage();
  const { logout, shop } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { to: '/', label: t.navDashboard, icon: LayoutDashboard },
    { to: '/customers', label: t.navCustomers, icon: Users },
    { to: '/billing', label: t.navBilling, icon: Receipt, isCenter: true },
    { to: '/products', label: t.navProducts, icon: Package },
    { to: '#more', label: t.navMore, icon: Menu, isMore: true },
  ];

  const moreItems = [
    { to: '/udhar', label: t.navUdhar, icon: BookOpen },
    { to: '/stock-movements', label: t.navStockMovements, icon: ArrowLeftRight },
    { to: '/expenses', label: t.navExpenses, icon: Wallet },
    { to: '/reports', label: t.navReports, icon: BarChart3 },
    { to: '/setup-guide', label: t.navSetupGuide, icon: Database },
    { to: '/settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg select-none">
        <div className="grid grid-cols-5 items-center h-14">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;

            if (tab.isMore) {
              return (
                <button
                  key="more-button"
                  type="button"
                  onClick={() => setShowMoreMenu(true)}
                  className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-emerald-700 active:scale-95 transition"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1 truncate">
                    {tab.label}
                  </span>
                </button>
              );
            }

            if (tab.isCenter) {
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className="flex flex-col items-center justify-center -mt-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600 group-hover:bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/40 ring-4 ring-white active:scale-90 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 tracking-tight mt-0.5 truncate">
                    {tab.label}
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center h-full min-h-[44px] transition active:scale-95 ${
                    isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] tracking-tight mt-1 truncate font-medium">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile "More" Drawer / Modal */}
      {showMoreMenu && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-5 pb-8 shadow-2xl border-t border-slate-100 max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.navMore}</h3>
                <p className="text-xs text-slate-500">{shop?.shopName}</p>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl border border-slate-100 text-xs font-semibold text-slate-800 transition"
                  >
                    <div className="p-2 bg-white text-emerald-700 rounded-lg shadow-2xs border border-slate-100">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Logout button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.actionLogout}</span>
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                {t.poweredBy}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
