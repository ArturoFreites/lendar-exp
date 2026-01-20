# Configuración para Vercel

Esta guía te ayudará a configurar el proyecto para deploy en Vercel.

## Variables de Entorno Requeridas

Configura estas variables en **Vercel Dashboard > Settings > Environment Variables**:

### Backend URLs
- `VITE_API_URL_PROD` - URL del backend en producción (ej: `https://api.tudominio.com`)
- `VITE_API_URL_DEV` - URL del backend en desarrollo (opcional, solo para testing)

### Firebase Configuration
Obtén estos valores de [Firebase Console](https://console.firebase.google.com/) > Tu proyecto > Configuración del proyecto:

- `VITE_FIREBASE_API_KEY` - API Key de Firebase
- `VITE_FIREBASE_AUTH_DOMAIN` - Auth Domain (ej: `lendar-app.firebaseapp.com`)
- `VITE_FIREBASE_PROJECT_ID` - Project ID (ej: `lendar-app`)
- `VITE_FIREBASE_STORAGE_BUCKET` - Storage Bucket (ej: `lendar-app.appspot.com`)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Messaging Sender ID
- `VITE_FIREBASE_APP_ID` - App ID completo (ej: `1:123456789:web:abcdef`)

### Firebase VAPID Key (Crítico para Web Push)
- `VITE_FIREBASE_VAPID_KEY` - VAPID Key para Web Push
  - Obtener en: Firebase Console > Cloud Messaging > Configuración de notificaciones web
  - Si no existe, haz clic en "Generar nuevo par de claves"

## Pasos para Deploy

### 1. Conectar Repositorio
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en "Add New Project"
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona el directorio `qr-lendar-config`

### 2. Configurar Variables de Entorno
1. En la configuración del proyecto, ve a **Settings > Environment Variables**
2. Agrega todas las variables listadas arriba
3. Asegúrate de seleccionar los ambientes correctos (Production, Preview, Development)

### 3. Configurar Build Settings
Vercel detectará automáticamente que es un proyecto Vite, pero verifica:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `dist` (automático)
- **Install Command**: `npm install` (automático)

### 4. Deploy
1. Haz clic en "Deploy"
2. Vercel ejecutará el build automáticamente
3. El script `inject-sw-env.js` inyectará las variables de entorno en el Service Worker durante el build

## Verificación Post-Deploy

### 1. Verificar Service Worker
1. Abre tu sitio en Vercel
2. Abre DevTools > Application > Service Workers
3. Verifica que `firebase-messaging-sw.js` esté registrado
4. Verifica que no haya errores en la consola

### 2. Verificar Variables de Entorno
1. Abre DevTools > Console
2. Deberías ver: `Firebase inicializado correctamente`
3. Al hacer login, deberías ver: `Token FCM obtenido exitosamente`

### 3. Verificar Notificaciones Push
1. Permite notificaciones cuando el navegador lo solicite
2. Haz login
3. Verifica que el token FCM se registre en el backend

## Troubleshooting

### Service Worker no se registra
- Verifica que `firebase-messaging-sw.js` esté en `/public`
- Verifica que las variables de Firebase estén correctas
- Revisa la consola del navegador para errores

### Token FCM no se obtiene
- Verifica que `VITE_FIREBASE_VAPID_KEY` esté configurada
- Verifica que el usuario haya permitido notificaciones
- Revisa los logs del build en Vercel

### Variables de entorno no funcionan
- Asegúrate de que todas las variables empiecen con `VITE_`
- Reinicia el deploy después de agregar nuevas variables
- Verifica que estén configuradas para el ambiente correcto (Production)

## Optimizaciones Aplicadas

- ✅ Code splitting automático (vendors separados)
- ✅ Minificación optimizada
- ✅ Cache busting con hashes
- ✅ Service Worker con variables inyectadas en build time
- ✅ Headers de cache optimizados en Vercel
- ✅ Remoción de console.log en producción

## URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com/
- **Documentación Vercel**: https://vercel.com/docs
