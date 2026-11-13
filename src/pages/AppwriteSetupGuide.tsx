import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  ShieldCheck, 
  Key, 
  Layers, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  Code2, 
  Terminal,
  FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AppwriteSetupGuide: React.FC = () => {
  const { t } = useLanguage();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const collections = [
    {
      name: 'shops',
      id: 'shops',
      description: 'दुकान आणि दुकानदाराची प्रोफाइल माहिती (Shop Profile & Configuration)',
      attributes: [
        { key: 'ownerUserId', type: 'string (size: 64)', required: true },
        { key: 'shopName', type: 'string (size: 128)', required: true },
        { key: 'ownerName', type: 'string (size: 128)', required: true },
        { key: 'mobile', type: 'string (size: 15)', required: true },
        { key: 'email', type: 'email', required: true },
        { key: 'address', type: 'string (size: 255)', required: false },
        { key: 'gstNumber', type: 'string (size: 32)', required: false },
        { key: 'tagline', type: 'string (size: 128)', required: false },
        { key: 'lowStockAlertLimit', type: 'integer', required: true, default: 5 },
        { key: 'currency', type: 'string (size: 10)', required: true, default: 'INR' },
      ],
      indexes: ['ownerUserId (unique key)'],
      permissions: 'Users ("users") create, read, update, delete own shop',
    },
    {
      name: 'customers',
      id: 'customers',
      description: 'ग्राहक माहिती व चालू शिल्लक (Customer Accounts & Udhar Balances)',
      attributes: [
        { key: 'shopId', type: 'string (size: 64)', required: true },
        { key: 'name', type: 'string (size: 128)', required: true },
        { key: 'mobile', type: 'string (size: 15)', required: true },
        { key: 'address', type: 'string (size: 255)', required: false },
        { key: 'notes', type: 'string (size: 500)', required: false },
        { key: 'totalPurchases', type: 'double', required: true, default: 0 },
        { key: 'totalUdhar', type: 'double', required: true, default: 0 },
        { key: 'totalPaid', type: 'double', required: true, default: 0 },
        { key: 'currentBalance', type: 'double', required: true, default: 0 },
      ],
      indexes: ['shopId (key)', 'mobile (key)', 'shopId + name (key)'],
      permissions: 'Authenticated shop owner',
    },
    {
      name: 'products',
      id: 'products',
      description: 'उत्पादने, विक्री किंमत व साठा (Inventory & Product Catalog)',
      attributes: [
        { key: 'shopId', type: 'string (size: 64)', required: true },
        { key: 'name', type: 'string (size: 128)', required: true },
        { key: 'sku', type: 'string (size: 64)', required: true },
        { key: 'category', type: 'string (size: 64)', required: true },
        { key: 'purchasePrice', type: 'double', required: true },
        { key: 'sellingPrice', type: 'double', required: true },
        { key: 'stock', type: 'double', required: true },
        { key: 'unit', type: 'string (size: 20)', required: true },
        { key: 'lowStockLimit', type: 'integer', required: true, default: 5 },
      ],
      indexes: ['shopId (key)', 'sku (key)', 'shopId + category (key)'],
      permissions: 'Authenticated shop owner',
    },
    {
      name: 'sales',
      id: 'sales',
      description: 'विक्री पावत्या व व्यवहार (Sales Invoices & Transactions)',
      attributes: [
        { key: 'shopId', type: 'string (size: 64)', required: true },
        { key: 'customerId', type: 'string (size: 64)', required: false },
        { key: 'customerName', type: 'string (size: 128)', required: false },
        { key: 'customerMobile', type: 'string (size: 15)', required: false },
        { key: 'invoiceNumber', type: 'string (size: 64)', required: true },
        { key: 'subtotal', type: 'double', required: true },
        { key: 'discount', type: 'double', required: true, default: 0 },
        { key: 'totalAmount', type: 'double', required: true },
        { key: 'paidAmount', type: 'double', required: true },
        { key: 'dueAmount', type: 'double', required: true, default: 0 },
        { key: 'paymentMethod', type: 'string (size: 20)', required: true },
        { key: 'paymentStatus', type: 'string (size: 20)', required: true },
        { key: 'items', type: 'string (size: 10000)', required: true },
        { key: 'notes', type: 'string (size: 255)', required: false },
      ],
      indexes: ['shopId (key)', 'invoiceNumber (unique)', 'shopId + customerId (key)'],
      permissions: 'Authenticated shop owner',
    },
    {
      name: 'payments',
      id: 'payments',
      description: 'ग्राहकांकडून जमा पावत्या (Payments Received / Jama Entries)',
      attributes: [
        { key: 'shopId', type: 'string (size: 64)', required: true },
        { key: 'customerId', type: 'string (size: 64)', required: true },
        { key: 'customerName', type: 'string (size: 128)', required: false },
        { key: 'saleId', type: 'string (size: 64)', required: false },
        { key: 'amount', type: 'double', required: true },
        { key: 'paymentMethod', type: 'string (size: 20)', required: true },
        { key: 'paymentDate', type: 'datetime', required: true },
        { key: 'notes', type: 'string (size: 255)', required: false },
      ],
      indexes: ['shopId (key)', 'customerId (key)', 'shopId + paymentDate (key)'],
      permissions: 'Authenticated shop owner',
    },
    {
      name: 'expenses',
      id: 'expenses',
      description: 'दुकान खर्च (Shop Expense Records)',
      attributes: [
        { key: 'shopId', type: 'string (size: 64)', required: true },
        { key: 'category', type: 'string (size: 64)', required: true },
        { key: 'amount', type: 'double', required: true },
        { key: 'description', type: 'string (size: 255)', required: true },
        { key: 'expenseDate', type: 'datetime', required: true },
      ],
      indexes: ['shopId (key)', 'shopId + category (key)', 'expenseDate (key)'],
      permissions: 'Authenticated shop owner',
    },
    {
      name: 'stock_movements',
      id: 'stock_movements',
      description: 'साठा हालचालींची नोंद (Stock In, Out, Adjustments Audit Log)',
      attributes: [
        { key: 'shopId', type: 'string (size: 64)', required: true },
        { key: 'productId', type: 'string (size: 64)', required: true },
        { key: 'productName', type: 'string (size: 128)', required: true },
        { key: 'movementType', type: 'string (size: 20)', required: true },
        { key: 'quantity', type: 'double', required: true },
        { key: 'previousStock', type: 'double', required: true },
        { key: 'newStock', type: 'double', required: true },
        { key: 'referenceId', type: 'string (size: 64)', required: false },
        { key: 'notes', type: 'string (size: 255)', required: false },
      ],
      indexes: ['shopId (key)', 'productId (key)', 'shopId + createdAt (key)'],
      permissions: 'Authenticated shop owner',
    },
  ];

  const envSample = `# Appwrite Cloud Credentials
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=6aec72aa000ab9b6e984
VITE_APPWRITE_DATABASE_ID=PASTE_EXISTING_DATABASE_ID

# Collection IDs (Default names)
VITE_APPWRITE_COLLECTION_SHOPS=shops
VITE_APPWRITE_COLLECTION_CUSTOMERS=customers
VITE_APPWRITE_COLLECTION_PRODUCTS=products
VITE_APPWRITE_COLLECTION_SALES=sales
VITE_APPWRITE_COLLECTION_SALE_ITEMS=sale_items
VITE_APPWRITE_COLLECTION_PAYMENTS=payments
VITE_APPWRITE_COLLECTION_EXPENSES=expenses
VITE_APPWRITE_COLLECTION_STOCK_MOVEMENTS=stock_movements`;

  const renderRewriteRules = `/*  /index.html  200`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 lg:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-700" />
          <span>Appwrite Cloud व Render डिप्लॉयमेंट मार्गदर्शक</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          MOTi Dukaan ला Appwrite Cloud आणि Render Static Site वर १००% सुरक्षितपणे लाइव्ह करण्याची संपूर्ण प्रक्रिया.
        </p>
      </div>

      {/* Part 1: Appwrite Cloud Setup */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-black">
            1
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              आधीपासून असलेला MOTIQCurrent प्रोजेक्ट वापरा
            </h3>
            <p className="text-xs text-slate-500">
              Appwrite Cloud (https://cloud.appwrite.io) वरील पावले
            </p>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
          <li>
            <strong>https://cloud.appwrite.io</strong> वर मोफत खाते तयार करा किंवा लॉगिन करा.
          </li>
          <li>
            <strong>'Create Project'</strong> वर क्लिक करा आणि नाव द्या: <code>MOTi Dukaan</code>.
          </li>
          <li>
            डाव्या मेनूमध्ये <strong>'Databases'</strong> वर क्लिक करा आणि <strong>'Create Database'</strong> निवडा.
            डेटाबेस ID ठेवा: <code>moti_dukaan_db</code>.
          </li>
          <li>
            डाव्या मेनूमधून <strong>'Settings' &rarr; 'Web Apps'</strong> मध्ये जाऊन तुमचा डोमेन किंवा Render URL <strong>Hostname</strong> म्हणून जोडा (उदा. <code>localhost</code> आणि <code>*.onrender.com</code>).
          </li>
        </ol>

        {/* Env snippet */}
        <div className="mt-3">
          <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-slate-700">
            <span>तुमच्या .env मध्ये जोडण्यासाठी व्हेरिएबल्स:</span>
            <button
              onClick={() => copyToClipboard(envSample, 'env')}
              className="flex items-center gap-1 text-emerald-700 hover:underline"
            >
              {copiedKey === 'env' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>कॉपी करा</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
            {envSample}
          </pre>
        </div>
      </div>

      {/* Part 2: Collection Schema Reference */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            2
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Appwrite Database Collections (टेबल्स व ॲट्रिब्युट्स)
            </h3>
            <p className="text-xs text-slate-500">
              खालील ७ कलेक्शन्स निवडलेल्या विद्यमान Database मध्ये तयार करा. आधीपासून त्याच ID चे Collection असल्यास पुन्हा तयार करू नका:
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {collections.map((col, idx) => (
            <div key={col.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                    {col.name}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{col.description}</span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-medium">
                  {col.permissions}
                </span>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-[11px] border-collapse bg-white rounded-lg border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-3">Attribute Key</th>
                      <th className="py-1.5 px-3">Type</th>
                      <th className="py-1.5 px-3">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {col.attributes.map(attr => (
                      <tr key={attr.key}>
                        <td className="py-1 px-3 text-slate-800 font-semibold">{attr.key}</td>
                        <td className="py-1 px-3 text-slate-600">{attr.type}</td>
                        <td className="py-1 px-3 text-slate-500">{attr.required ? 'होय (Yes)' : 'नाही'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                <strong>Indexes:</strong> {col.indexes.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 3: Render Static Site Deployment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
            3
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Render Static Site डिप्लॉयमेंट (Render.com)
            </h3>
            <p className="text-xs text-slate-500">
              Vercel न वापरता Render वर React SPA लाइव्ह करण्याची अचूक पद्धत
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            1. <strong>GitHub Repository:</strong> तुमचा कोड GitHub रिपॉझिटरीमध्ये पुश करा.
          </p>
          <p>
            2. <strong>Render वर जा:</strong> <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">dashboard.render.com</a> वर लॉगिन करा.
          </p>
          <p>
            3. <strong>New Static Site:</strong> <strong>'New +' &rarr; 'Static Site'</strong> वर क्लिक करा आणि तुमचे GitHub repo निवडा.
          </p>
          <p>
            4. <strong>Build Settings:</strong>
          </p>
          <ul className="list-disc list-inside pl-3 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
            <li>Name: <code>moti-dukaan</code></li>
            <li>Branch: <code>main</code></li>
            <li>Build Command: <code>npm install && npm run build</code></li>
            <li>Publish Directory: <code>dist</code></li>
          </ul>

          <p className="mt-2">
            5. <strong>Environment Variables:</strong> Render डॅशबोर्डमध्ये <strong>'Environment'</strong> टॅबमध्ये वरील <code>VITE_APPWRITE_*</code> व्हेरिएबल्स पेस्ट करा.
          </p>

          <p>
            6. <strong>SPA Rewrite Rules (महत्त्वाचे):</strong> React Router चे पेजेस (उदा. <code>/billing</code>, <code>/customers</code>) रिफ्रेश केल्यावर ४०४ एरर न येण्यासाठी Render च्या <strong>'Redirects / Rewrites'</strong> टॅबमध्ये खालील नियम जोडा:
          </p>

          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
            <span>Source: <code>/*</code> &rarr; Destination: <code>/index.html</code> (Action: <code>Rewrite</code>)</span>
            <button
              onClick={() => copyToClipboard('/* /index.html 200', 'rewrite')}
              className="flex items-center gap-1 text-emerald-400 hover:underline"
            >
              {copiedKey === 'rewrite' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
