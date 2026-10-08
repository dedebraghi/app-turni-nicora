/**
 * Servizio per la gestione sicura dell'aggiornamento dell'applicazione.
 * 
 * Svuota ESCLUSIVAMENTE la cache dei file applicativi (CacheStorage e Service Worker)
 * garantendo che NESSUN dato utente (localStorage, IndexedDB, turni, preferenze, sessione Supabase)
 * venga perso o resettato.
 */

export async function forceAppUpdate(): Promise<void> {
  try {
    // 1. Elimina le cache dei file statici memorizzate da Workbox / browser
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }

    // 2. Forza il Service Worker a verificare e scaricare l'ultimo manifest dal server
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    }
  } catch (error) {
    console.warn('[AppUpdate] Pulizia cache completata con avvisi:', error);
  } finally {
    // 3. Ricarica pulita della pagina recuperando l'ultimo bundle
    window.location.reload();
  }
}
