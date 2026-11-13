import { Client, Account, Databases, ID, Query } from 'appwrite';

const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6aec72aa000ab9b6e984'; // MOTIQCurrent
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

export const client = new Client();

if (ENDPOINT && PROJECT_ID) {
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
}

export const account = new Account(client);
export const databases = new Databases(client);

export const APPWRITE_CONFIG = {
  endpoint: ENDPOINT,
  projectId: PROJECT_ID,
  databaseId: DATABASE_ID,
  collections: {
    shops: import.meta.env.VITE_APPWRITE_COLLECTION_SHOPS || 'shops',
    customers: import.meta.env.VITE_APPWRITE_COLLECTION_CUSTOMERS || 'customers',
    products: import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCTS || 'products',
    sales: import.meta.env.VITE_APPWRITE_COLLECTION_SALES || 'sales',
    sale_items: import.meta.env.VITE_APPWRITE_COLLECTION_SALE_ITEMS || 'sale_items',
    payments: import.meta.env.VITE_APPWRITE_COLLECTION_PAYMENTS || 'payments',
    expenses: import.meta.env.VITE_APPWRITE_COLLECTION_EXPENSES || 'expenses',
    stock_movements: import.meta.env.VITE_APPWRITE_COLLECTION_STOCK_MOVEMENTS || 'stock_movements',
  },
};

export { ID, Query };

export async function checkAppwriteConnection(): Promise<{ ok: boolean; message: string; details?: any }> {
  if (!APPWRITE_CONFIG.projectId || !APPWRITE_CONFIG.databaseId) {
    return {
      ok: false,
      message: 'Appwrite Project ID or Database ID is missing in environment variables (.env).',
    };
  }

  try {
    // Attempt a light ping or get session
    await account.get();
    return { ok: true, message: 'Appwrite Cloud Connected and Authenticated!' };
  } catch (err: any) {
    // If error is 401 (unauthorized / no session), Appwrite connection is actually ALIVE and reaching cloud!
    if (err?.code === 401) {
      return { ok: true, message: 'Appwrite Cloud is reachable (Guest mode / No active session).' };
    }
    return {
      ok: false,
      message: err?.message || 'Failed to reach Appwrite Cloud endpoint.',
      details: err,
    };
  }
}
