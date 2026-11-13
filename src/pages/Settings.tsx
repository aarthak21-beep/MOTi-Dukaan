import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Save, 
  LogOut, 
  Smartphone,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { checkAppwriteConnection, APPWRITE_CONFIG } from '../services/appwrite';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

export const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { shop, updateShopData, logout } = useAuth();

  const [shopName, setShopName] = useState(shop?.shopName || '');
  const [ownerName, setOwnerName] = useState(shop?.ownerName || '');
  const [mobile, setMobile] = useState(shop?.mobile || '');
  const [email, setEmail] = useState(shop?.email || '');
  const [address, setAddress] = useState(shop?.address || '');
  const [gstNumber, setGstNumber] = useState(shop?.gstNumber || '');
  const [tagline, setTagline] = useState(shop?.tagline || '');
  const [lowStockLimit, setLowStockLimit] = useState((shop?.lowStockAlertLimit || 5).toString());

  const [isSaved, setIsSaved] = useState(false);
  const [testingAppwrite, setTestingAppwrite] = useState(false);
  const [appwriteStatus, setAppwriteStatus] = useState<{ ok?: boolean; message?: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    await updateShopData({
      ...shop,
      shopName,
      ownerName,
      mobile,
      email,
      address,
      gstNumber,
      tagline,
      lowStockAlertLimit: parseInt(lowStockLimit, 10) || 5,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestAppwrite = async () => {
    setTestingAppwrite(true);
    setAppwriteStatus(null);
    try {
      const res = await checkAppwriteConnection();
      setAppwriteStatus(res);
    } catch (err: any) {
      setAppwriteStatus({ ok: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setTestingAppwrite(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 lg:pb-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-700" />
            <span>{t.settingsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            दुकान तपशील, भाषा पर्याय व डेटाबेस जोडणी व्यवस्थापन.
          </p>
        </div>

        <Link
          to="/setup-guide"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Appwrite सेटअप मार्गदर्शक</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {/* Language Switcher Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-700" />
          <span>{t.languageSetting}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          ॲप्लिकेशनची मुख्य भाषा निवडा. सर्व लेबल्स आणि पावत्या निवडलेल्या भाषेत दिसतील.
        </p>

        <div className="mt-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage('mr')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
              language === 'mr'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>मराठी (Default)</span>
            {language === 'mr' && <CheckCircle2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
              language === 'en'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>English</span>
            {language === 'en' && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Shop Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>{t.shopDetails}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              पावतीवर व बिलावर छापणारी दुकानाची माहिती.
            </p>
          </div>

          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>जतन केले!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.shopName} *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.ownerName} *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.shopMobile} *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.shopEmail} *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.shopAddress} *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">दुकानाची टॅगलाईन (Tagline)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="उदा. तुमच्या विश्वासाचे हक्काचे किराणा दुकान"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.shopGST}</label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">कमी साठा इशारा मर्यादा (Low Stock Limit)</label>
            <input
              type="number"
              min="1"
              value={lowStockLimit}
              onChange={(e) => setLowStockLimit(e.target.value)}
              className="w-32 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{t.actionSave} माहिती जतन करा</span>
            </button>
          </div>
        </form>
      </div>

      {/* Appwrite Cloud Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>{t.appwriteConfig}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Appwrite Cloud किंवा सुरक्षित स्थानिक स्टोरेज स्थिती.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestAppwrite}
            disabled={testingAppwrite}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
          >
            {testingAppwrite ? 'तपासत आहे...' : t.testConnection}
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Endpoint:</span>
            <span className="font-mono text-slate-700">{APPWRITE_CONFIG.endpoint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Project ID:</span>
            <span className="font-mono text-slate-700">{APPWRITE_CONFIG.projectId || '(Not Configured)'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Database ID:</span>
            <span className="font-mono text-slate-700">{APPWRITE_CONFIG.databaseId || '(Not Configured)'}</span>
          </div>
        </div>

        {appwriteStatus && (
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            appwriteStatus.ok 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {appwriteStatus.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{appwriteStatus.ok ? t.connected : 'स्थानिक सुरक्षित मोड (Safe Local Fallback Active)'}</p>
              <p className="mt-0.5">{appwriteStatus.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* PWA Mobile Installation Section */}
      <PWAInstallButton variant="card" />

      {/* Logout & Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.actionLogout}</span>
        </button>

        <p className="text-xs text-slate-400 font-medium">
          {t.poweredBy}
        </p>
      </div>
    </div>
  );
};
