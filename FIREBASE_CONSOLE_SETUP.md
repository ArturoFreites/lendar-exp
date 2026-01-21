# 🔥 Guía de Configuración de Firebase Console para FCM Web Push

Esta guía te ayudará a configurar Firebase Console correctamente para que las notificaciones push web funcionen.

## 📋 Checklist de Configuración en Firebase Console

### Paso 1: Verificar/Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo si no existe)
3. Asegúrate de que el **Project ID** sea el correcto (ej: `lendar-app`)

### Paso 2: Habilitar Cloud Messaging API

1. En Firebase Console, ve a **⚙️ Configuración del proyecto** (ícono de engranaje)
2. Ve a la pestaña **Cloud Messaging**
3. **IMPORTANTE**: Verifica que **Cloud Messaging API (Legacy)** esté habilitada
   - Si no está habilitada, ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Selecciona tu proyecto
   - Ve a **APIs & Services > Enabled APIs**
   - Busca "Firebase Cloud Messaging API" y habilítala

### Paso 3: Registrar App Web (si no está registrada)

1. En Firebase Console, ve a **⚙️ Configuración del proyecto**
2. Desplázate hasta la sección **Your apps**
3. Si no hay una app web registrada:
   - Haz clic en el ícono **</>** (Web)
   - Registra tu app con un nombre (ej: "Lendar Web App")
   - **NO marques** "Also set up Firebase Hosting" (a menos que lo necesites)
   - Haz clic en **Register app**

### Paso 4: Obtener Configuración de Firebase

1. Después de registrar la app, verás un objeto `firebaseConfig` como este:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "lendar-app.firebaseapp.com",
  projectId: "lendar-app",
  storageBucket: "lendar-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

2. **Copia estos valores** - los necesitarás para las variables de entorno:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

### Paso 5: Generar VAPID Key (Web Push Certificates) ⚠️ CRÍTICO

**Este es el paso MÁS IMPORTANTE y el que más se olvida:**

1. En Firebase Console, ve a **⚙️ Configuración del proyecto**
2. Ve a la pestaña **Cloud Messaging**
3. Desplázate hasta la sección **Web Push certificates**
4. Si no hay una key generada:
   - Haz clic en **Generate key pair** o **Generar par de claves**
   - Se generará una clave VAPID (parece: `BK...`)
   - **Copia esta clave completa** - la necesitas para `VITE_FIREBASE_VAPID_KEY`
5. Si ya existe una key:
   - Cópiala (haz clic en el ícono de copiar)
   - Esta es tu `VITE_FIREBASE_VAPID_KEY`

**⚠️ IMPORTANTE**: Sin la VAPID key, **NO podrás obtener tokens FCM** en web.

### Paso 6: Configurar Dominios Autorizados (Opcional pero Recomendado)

1. En Firebase Console, ve a **Authentication** (si usas Auth)
2. Ve a **Settings > Authorized domains**
3. Asegúrate de que tu dominio esté en la lista:
   - `localhost` (ya está por defecto para desarrollo)
   - Tu dominio de producción (ej: `tu-app.vercel.app`)

### Paso 7: Verificar Configuración

Después de configurar todo, verifica:

✅ **Cloud Messaging API** está habilitada
✅ **App Web** está registrada
✅ **VAPID Key** está generada y copiada
✅ **Variables de entorno** están configuradas con todos los valores

## 🔍 Verificación de Configuración

### En el Frontend (Variables de Entorno)

Verifica que tengas estas variables configuradas:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=lendar-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lendar-app
VITE_FIREBASE_STORAGE_BUCKET=lendar-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_VAPID_KEY=BK...  # ⚠️ ESTA ES LA MÁS IMPORTANTE
```

### En el Service Worker

El Service Worker debe tener la configuración inyectada. Verifica:

1. Ejecuta `npm run build` o `npm run dev`
2. Verifica que `scripts/inject-sw-env.js` se ejecutó correctamente
3. Revisa `public/firebase-messaging-sw.js` - debe tener valores reales (no vacíos)

## 🐛 Problemas Comunes

### ❌ "VAPID key no configurada"
**Solución**: 
- Ve a Firebase Console > Cloud Messaging > Web Push certificates
- Genera o copia la VAPID key
- Configúrala en `VITE_FIREBASE_VAPID_KEY`

### ❌ "Service Worker no está listo"
**Solución**:
- Verifica que `firebase-messaging-sw.js` existe en `public/`
- Verifica que el script `inject-sw-env.js` se ejecutó durante el build
- Revisa la consola del Service Worker en DevTools

### ❌ "Firebase no inicializado en Service Worker"
**Solución**:
- Verifica que las variables de entorno estén configuradas
- Verifica que `inject-sw-env.js` inyectó los valores correctamente
- Revisa la consola del Service Worker para errores

### ❌ "messaging/invalid-vapid-key"
**Solución**:
- Verifica que la VAPID key sea correcta (debe empezar con `BK`)
- Asegúrate de copiar la key completa
- Verifica que no haya espacios extra al inicio/final

## 📝 Resumen de Pasos en Firebase Console

1. ✅ Proyecto Firebase creado/seleccionado
2. ✅ Cloud Messaging API habilitada
3. ✅ App Web registrada
4. ✅ Configuración de Firebase copiada (6 valores)
5. ✅ **VAPID Key generada y copiada** ⚠️ CRÍTICO
6. ✅ Dominios autorizados configurados (opcional)

## 🔗 Enlaces Útiles

- [Firebase Console](https://console.firebase.google.com/)
- [Documentación FCM Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Checklist Final

Antes de intentar obtener el token FCM, verifica:

- [ ] Firebase Console configurado correctamente
- [ ] VAPID Key generada y copiada
- [ ] Todas las variables de entorno configuradas
- [ ] Service Worker tiene la configuración inyectada
- [ ] Permisos de notificaciones habilitados en el navegador
- [ ] HTTPS o localhost (no funciona en HTTP en producción)
