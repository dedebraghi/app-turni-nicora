import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Ricarica automatica in caso di discrepanza dei chunk dinamici tra deploy
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

// Registrazione del Service Worker con gestione proattiva degli aggiornamenti
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Quando è pronto un aggiornamento con skipWaiting, ricarica in modo trasparente
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    // 1. Controllo periodico in background ogni 15 minuti
    const CHECK_INTERVAL = 15 * 60 * 1000
    setInterval(() => {
      registration.update()
    }, CHECK_INTERVAL)

    // 2. Controllo immediato quando l'utente torna sull'app (riapertura/focus/tab attiva)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update()
      }
    })

    window.addEventListener('focus', () => {
      registration.update()
    })
  }
})

// Quando il nuovo Service Worker si attiva e prende il controllo, ricarica automaticamente
let isReloading = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (!isReloading) {
    isReloading = true
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
