import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Registrazione del Service Worker con gestione proattiva degli aggiornamenti
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Quando è pronto un aggiornamento con skipWaiting, ricarica in modo trasparente
    updateSW(true)
  },
  onRegisteredSW(swUrl, registration) {
    if (!registration) return

    // 1. Controllo periodico in background ogni 60 minuti
    const ONE_HOUR = 60 * 60 * 1000
    setInterval(() => {
      registration.update()
    }, ONE_HOUR)

    // 2. Controllo immediato quando l'utente torna sull'app (riapertura/focus/tab attiva)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update()
      }
    })
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

