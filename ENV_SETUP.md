# Configuración de Variables de Entorno

## Paso 1: Crear archivo .env

Copia el archivo `.env.example` a `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Luego edita `.env` con tus valores reales.

## Paso 2: Obtener valores de Firebase

### Configuración General de Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `lendar-app` (o tu proyecto)
3. Ve a **Configuración del proyecto** (ícono de engranaje) > **Configuración general**
4. Baja a la sección "Tus aplicaciones" y haz clic en el ícono web `</>`
5. Si no existe una app web, créala con el nombre que desees
6. Copia los valores del objeto `firebaseConfig` que aparece
7. Pega estos valores en tu archivo `.env`

### VAPID Key para Web Push:

1. En Firebase Console, ve a **Cloud Messaging** (menú lateral)
2. Haz clic en **Configuración de notificaciones web** (o "Web Push certificates")
3. Si no existe una clave, haz clic en **Generar nuevo par de claves**
4. Copia la clave VAPID generada
5. Pega esta clave en `.env` como `VITE_FIREBASE_VAPID_KEY`

## Paso 3: Actualizar Service Worker

**IMPORTANTE**: Los service workers NO pueden usar variables de entorno (`import.meta.env`). Debes actualizar manualmente el archivo `public/firebase-messaging-sw.js` con los mismos valores que pusiste en `.env`.

1. Abre `public/firebase-messaging-sw.js`
2. Reemplaza los valores en el objeto `firebaseConfig` (líneas 8-14) con los mismos valores que usaste en `.env`
3. Guarda el archivo

**Nota**: Asegúrate de que los valores en `firebase-messaging-sw.js` coincidan con los de `.env` para evitar errores.

## Variables Requeridas

```env
# URLs del Backend
VITE_API_URL_DEV=http://localhost:8080
VITE_API_URL_PROD=https://api.empresa.com

# Firebase - Configuración General
VITE_FIREBASE_API_KEY=AIza...tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=lendar-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lendar-app
VITE_FIREBASE_STORAGE_BUCKET=lendar-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase - VAPID Key (para Web Push)
VITE_FIREBASE_VAPID_KEY=BK...tu_vapid_key
```

## Verificación

Después de configurar todo:

1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Abre la consola del navegador
3. Deberías ver: `Firebase inicializado correctamente`
4. Deberías ver: `Firebase Messaging inicializado`
5. Deberías ver: `Service Worker registrado`
6. Al hacer login, deberías ver: `Token FCM obtenido: ...`

Si ves errores, verifica:
- Que todas las variables en `.env` estén correctas
- Que `firebase-messaging-sw.js` tenga los mismos valores
- Que el navegador tenga permisos para notificaciones
- Que estés usando HTTPS (o localhost para desarrollo)
