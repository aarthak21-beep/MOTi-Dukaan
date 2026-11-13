# MOTi Dukaan – Smart Shop Management SaaS
**तुमच्या दुकानाचा स्मार्ट साथीदार**

> Software Brand: **MOTi Biz**  
> Company: **MOTI TECHNOLOGIES**  
> Footer: **Powered by MOTI TECHNOLOGIES**

---

## 1. Overview
**MOTi Dukaan** is a modern, responsive, mobile-first Shop Management SaaS tailored specifically for Indian Kirana and retail stores. It streamlines daily business workflows:
- **Fast POS Billing (जलद बिलिंग):** Touch-friendly product catalog, barcode/SKU search, category filters, instant stock deduction, and thermal (58mm/80mm) or A4 printable receipts.
- **Udhar Management (उधार वही / Khata):** Complete customer credit ledger, partial and full payment recording (Jama), automatic balance updates, duplicate payment prevention, and 1-tap WhatsApp reminders in Marathi & English.
- **Product & Stock Management (वस्तू व साठा):** Multi-unit support (नग, पाकीट, किलो, ग्रॅम, लिटर, मिली, बॉक्स, डझन), low-stock visual alerts, and full stock movement audit trails (Purchase, Sale, Adjustment, Return).
- **Expense Tracking (दुकान खर्च):** Categorized expense records (Rent, Electricity, Salary, Transport, Tea/Snacks) with daily and monthly totals.
- **Business Reports & Estimated Profit (अहवाल):** Real-time daily, weekly, and monthly sales summaries, gross profit calculations (sales price vs. purchase price minus expenses), and CSV data exports.
- **Bilingual Localization:** Full Marathi (default) and English UI with Indian Rupee (₹) and Indian number formatting (`1,23,456.00`).
- **Progressive Web App (PWA):** Installable on Android smartphones, iPhones (via Safari Share sheet), and Desktop Chrome.

---

## 2. Technology Stack
- **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS v4, React Router 7, Lucide React Icons.
- **Backend:** Appwrite Cloud (Authentication, Databases API, Collections).
- **Offline / Resilient Mode:** Built-in safe local persistence fallback for offline or sandbox preview with pre-seeded realistic Kirana items.
- **Hosting:** Render Static Site (with SPA rewrite support).

---

## 3. Appwrite Cloud Setup Guide

### Step 1: Create Project & Database
1. Sign up or log in at [cloud.appwrite.io](https://cloud.appwrite.io).
2. Click **Create Project** &rarr; Name: `MOTi Dukaan`.
3. In the left navigation, go to **Databases** &rarr; **Create Database**:
   - Database Name: `MOTi Dukaan DB`
   - Database ID: `moti_dukaan_db`
4. In **Settings** &rarr; **Web Apps**, add your Render domain or `localhost` as an authorized Hostname.

### Step 2: Database Collections & Attributes
Create the following collections inside `moti_dukaan_db`:

1. **`shops`**
   - Attributes: `ownerUserId` (string, 64), `shopName` (string, 128), `ownerName` (string, 128), `mobile` (string, 15), `email` (email), `address` (string, 255), `gstNumber` (string, 32), `tagline` (string, 128), `lowStockAlertLimit` (integer, default 5), `currency` (string, 10).
2. **`customers`**
   - Attributes: `shopId` (string, 64), `name` (string, 128), `mobile` (string, 15), `address` (string, 255), `notes` (string, 500), `totalPurchases` (double), `totalUdhar` (double), `totalPaid` (double), `currentBalance` (double).
3. **`products`**
   - Attributes: `shopId` (string, 64), `name` (string, 128), `sku` (string, 64), `category` (string, 64), `purchasePrice` (double), `sellingPrice` (double), `stock` (double), `unit` (string, 20), `lowStockLimit` (integer).
4. **`sales`**
   - Attributes: `shopId` (string, 64), `customerId` (string, 64), `customerName` (string, 128), `customerMobile` (string, 15), `invoiceNumber` (string, 64), `subtotal` (double), `discount` (double), `totalAmount` (double), `paidAmount` (double), `dueAmount` (double), `paymentMethod` (string, 20), `paymentStatus` (string, 20), `items` (string, 10000), `notes` (string, 255).
5. **`payments`**
   - Attributes: `shopId` (string, 64), `customerId` (string, 64), `customerName` (string, 128), `saleId` (string, 64), `amount` (double), `paymentMethod` (string, 20), `paymentDate` (datetime), `notes` (string, 255).
6. **`expenses`**
   - Attributes: `shopId` (string, 64), `category` (string, 64), `amount` (double), `description` (string, 255), `expenseDate` (datetime).
7. **`stock_movements`**
   - Attributes: `shopId` (string, 64), `productId` (string, 64), `productName` (string, 128), `movementType` (string, 20), `quantity` (double), `previousStock` (double), `newStock` (double), `referenceId` (string, 64), `notes` (string, 255).

---

## 4. Render Static Site Deployment

1. Push your repository to **GitHub**.
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New + &rarr; Static Site**.
3. Connect your GitHub repository.
4. Configure the build parameters:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Under **Environment**, add the following environment variables:
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your-appwrite-project-id
   VITE_APPWRITE_DATABASE_ID=moti_dukaan_db
   ```
6. Under **Redirects / Rewrites**, add the SPA rewrite rule:
   - **Type:** `Rewrite`
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Status:** `200`
7. Click **Create Static Site**. Render will build and deploy the app with global HTTPS!

---

## 5. Development & Testing
```bash
# Run local dev server
npm run dev

# Verify TypeScript and linting
npm run lint

# Build production bundle
npm run build
```

---
**Powered by MOTI TECHNOLOGIES**
