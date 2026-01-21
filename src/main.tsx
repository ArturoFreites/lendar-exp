import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initializeFirebase } from "./app/services/firebase";

// Inicializar Firebase
initializeFirebase();

// El Service Worker se registra automáticamente cuando se llama getFCMToken()
// No es necesario registrarlo aquí

createRoot(document.getElementById("root")!).render(<App />);
  