# 🚀 Instrucciones de Configuración Rápida

## Paso 1: Crear archivo .env

```bash
cp env.example .env
```

## Paso 2: Obtener valores de Firebase Console

### 2.1 Configuración General de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **⚙️ Configuración del proyecto** > **Configuración general**
4. En la sección **"Tus aplicaciones"**, haz clic en el ícono **`</>`** (Web)
5. Si no existe una app web, créala
6. Copia los valores del objeto `firebaseConfig` que aparece

### 2.2 VAPID Key (⚠️ CRÍTICO - Sin esto NO funcionará)

1. En Firebase Console, ve a **Cloud Messaging** (menú lateral)
2. Desplázate hasta **"Web Push certificates"** o **"Configuración de notificaciones web"**
3. Si no hay una key:
   - Haz clic en **"Generate key pair"** / **"Generar par de claves"**
   - Copia la clave completa (empieza con `BK...`)
4. Si ya existe, cópiala

## Paso 3: Configurar .env

Edita el archivo `.env` y reemplaza los valores de ejemplo con los reales:

```env
VITE_FIREBASE_API_KEY=TU_API_KEY_AQUI
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_VAPID_KEY=TU_VAPID_KEY_AQUI  # ⚠️ MÁS IMPORTANTE
```

## Paso 4: Verificar configuración

```bash
npm run check-firebase
```

Deberías ver todas las variables marcadas con ✅

## Paso 5: Inyectar configuración en Service Worker

El script se ejecuta automáticamente cuando haces:

```bash
npm run dev
# o
npm run build
```

Si quieres ejecutarlo manualmente:

```bash
node scripts/inject-sw-env.js
```

## ✅ Listo!

Ahora puedes hacer login y el token FCM debería obtenerse correctamente.

## 📖 Documentación Completa

- **FIREBASE_CONSOLE_SETUP.md** - Guía detallada de Firebase Console
- **ENV_SETUP.md** - Configuración de variables de entorno
- **VERCEL_SETUP.md** - Configuración para producción en Vercel
