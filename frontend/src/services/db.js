const DB_NAME = 'FinReportDB';
const STORE_NAME = 'AppState';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
    request.onerror = (e) => {
      reject(request.error);
    };
  });
}

export async function saveStateToDB(screen, extractedData, pdfFile) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(screen, 'screen');
      store.put(extractedData, 'extractedData');
      store.put(pdfFile, 'pdfFile');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save state to IndexedDB:', err);
  }
}

export async function loadStateFromDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const rScreen = store.get('screen');
      const rData = store.get('extractedData');
      const rFile = store.get('pdfFile');
      tx.oncomplete = () => {
        resolve({
          screen: rScreen.result || 'upload',
          extractedData: rData.result || null,
          pdfFile: rFile.result || null,
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to load state from IndexedDB:', err);
    return { screen: 'upload', extractedData: null, pdfFile: null };
  }
}

export async function clearStateInDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to clear state in IndexedDB:', err);
  }
}
