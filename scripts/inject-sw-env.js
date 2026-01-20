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
  // En Vercel, estas variables deben estar configuradas en el dashboard
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'lendar-app',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || '',
  };

  console.log('🔧 Variables de entorno detectadas:');
  console.log(`   VITE_FIREBASE_API_KEY: ${firebaseConfig.apiKey ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   VITE_FIREBASE_AUTH_DOMAIN: ${firebaseConfig.authDomain ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   VITE_FIREBASE_PROJECT_ID: ${firebaseConfig.projectId}`);
  console.log(`   VITE_FIREBASE_STORAGE_BUCKET: ${firebaseConfig.storageBucket ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   VITE_FIREBASE_MESSAGING_SENDER_ID: ${firebaseConfig.messagingSenderId ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   VITE_FIREBASE_APP_ID: ${firebaseConfig.appId ? '✅ Configurada' : '❌ No configurada'}`);

  // Verificar que las variables críticas estén configuradas
  const requiredVars = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
  const missingVars = requiredVars.filter(key => !firebaseConfig[key] || firebaseConfig[key].trim() === '');
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Variables de entorno faltantes:', missingVars.join(', '));
    console.warn('   Asegúrate de configurar estas variables en Vercel Dashboard > Settings > Environment Variables');
    if (!firebaseConfig.apiKey) {
      console.error('❌ VITE_FIREBASE_API_KEY es requerida. El Service Worker no funcionará correctamente.');
      process.exit(1);
    }
  }

  // Reemplazar la configuración de Firebase en el Service Worker
  // Buscar el objeto firebaseConfig con o sin comentarios
  // Patrón más flexible que busca desde "const firebaseConfig" hasta el cierre del objeto
  const configRegex = /const firebaseConfig\s*=\s*\{[\s\S]*?\};/;
  const newConfig = `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`;

  if (configRegex.test(swContent)) {
    swContent = swContent.replace(configRegex, newConfig);
    writeFileSync(swPath, swContent, 'utf-8');
    console.log('✅ Service Worker actualizado con variables de entorno');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);
    console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
  } else {
    console.error('❌ No se encontró el patrón "const firebaseConfig = {...};" en el Service Worker');
    console.error('   Verifica que el archivo public/firebase-messaging-sw.js tenga el formato correcto');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error actualizando Service Worker:', error.message);
  if (error.code === 'ENOENT') {
    console.error(`   El archivo no existe: ${swPath}`);
  }
  console.error('   Stack:', error.stack);
  process.exit(1);
}
