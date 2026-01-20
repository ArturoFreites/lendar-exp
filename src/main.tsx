  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { initializeFirebase } from "./app/services/firebase";

// Inicializar Firebase al cargar la app
console.log('🚀 Inicializando aplicación...');
initializeFirebase();

// Registrar Service Worker para notificaciones push
if ('serviceWorker' in navigator) {
  // Registrar inmediatamente, no esperar a 'load'
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js', { scope: '/' })
    .then((registration) => {
      console.log('✅ Service Worker registrado exitosamente:', registration.scope);
      console.log('   Estado:', registration.active?.state || 'installing');
      
      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Nueva versión del Service Worker encontrada');
      });
    })
    .catch((error) => {
      console.error('❌ Error registrando Service Worker:', error);
      console.error('   Asegúrate de que firebase-messaging-sw.js existe en /public');
    });
} else {
  console.warn('⚠️ Service Worker no soportado en este navegador');
}

  createRoot(document.getElementById("root")!).render(<App />);
  