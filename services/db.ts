import { Trip, Member, Expense } from '../types';

const DB_NAME = 'fairshare_db';
const DB_VERSION = 1;

interface DBData {
  trip?: Trip[]; // Changed to array
  members: Member[];
  expenses: Expense[];
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('IndexedDB error');

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store trip objects
      if (!db.objectStoreNames.contains('trip')) {
        db.createObjectStore('trip', { keyPath: 'id' });
      }
      
      // Store members
      if (!db.objectStoreNames.contains('members')) {
        db.createObjectStore('members', { keyPath: 'id' });
      }
      
      // Store expenses
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' });
      }
    };
  });
};

export const saveToDB = async (storeName: string, items: any | any[]) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    if (Array.isArray(items)) {
      items.forEach(item => store.put(item));
    } else {
      store.put(items);
    }
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteFromDB = async (storeName: string, id: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const clearStore = async (storeName: string) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export const loadAllFromDB = async () => {
  const db = await initDB();
  return new Promise<DBData>((resolve, reject) => {
    const tx = db.transaction(['trip', 'members', 'expenses'], 'readonly');
    const tripReq = tx.objectStore('trip').getAll();
    const membersReq = tx.objectStore('members').getAll();
    const expensesReq = tx.objectStore('expenses').getAll();

    tx.oncomplete = () => {
      resolve({
        trip: tripReq.result || [], // Return array
        members: membersReq.result || [],
        expenses: expensesReq.result || [],
      });
    };
    tx.onerror = () => reject(tx.error);
  });
};