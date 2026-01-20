import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const swPath = resolve(rootDir, 'public/firebase-messaging-sw.js');

try {
  let swContent = readFileSync(swPath, 'utf-8');

  // Obtener variables de entorno (Vite las expone en process.env)
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'lendar-app',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || '',
  };

  // Verificar que al menos apiKey esté configurado
  if (!firebaseConfig.apiKey) {
    console.warn('⚠️  VITE_FIREBASE_API_KEY no está configurada. El Service Worker puede no funcionar correctamente.');
  }

  // Reemplazar la configuración de Firebase en el Service Worker
  const configRegex = /const firebaseConfig = \{[\s\S]*?\};/;
  const newConfig = `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`;

  if (configRegex.test(swContent)) {
    swContent = swContent.replace(configRegex, newConfig);
    writeFileSync(swPath, swContent, 'utf-8');
    console.log('✅ Service Worker actualizado con variables de entorno');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);
  } else {
    console.error('❌ No se encontró firebaseConfig en el Service Worker');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error actualizando Service Worker:', error.message);
  process.exit(1);
}
