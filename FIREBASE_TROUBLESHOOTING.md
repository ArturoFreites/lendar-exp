# 🔧 Solución de Problemas: "Registration failed - push service error"

Este error indica que falta configurar algo en Firebase/Google Cloud Console.

## ✅ Checklist de Verificación en Firebase Console

### 1. Verificar que la App Web esté registrada

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (`lendar-app`)
3. Ve a **⚙️ Configuración del proyecto** (ícono de engranaje)
4. En la sección **"Your apps"**, verifica que haya una app web (ícono `</>`)
5. Si no existe, créala:
   - Haz clic en el ícono `</>` (Web)
   - Registra con un nombre (ej: "Lendar Web App")
   - **NO marques** "Also set up Firebase Hosting"
   - Haz clic en **Register app**

### 2. ⚠️ CRÍTICO: Habilitar Cloud Messaging API en Google Cloud Console

Este es el paso que más se olvida y causa el error `push service error`:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **Selecciona el mismo proyecto** que en Firebase (debe tener el mismo Project ID: `lendar-app`)
3. En el menú lateral, ve a **APIs & Services** > **Library** (o **Enabled APIs**)
4. Busca **"Firebase Cloud Messaging API"** o **"FCM API"**
5. Si NO está habilitada:
   - Haz clic en **"Firebase Cloud Messaging API"**
   - Haz clic en **"ENABLE"** o **"HABILITAR"**
   - Espera unos segundos a que se habilite
6. También verifica que esté habilitada **"Firebase Cloud Messaging API (V1)"** si aparece

**⚠️ IMPORTANTE**: Sin esta API habilitada, NO podrás obtener tokens FCM.

### 3. Verificar VAPID Key

1. En Firebase Console, ve a **⚙️ Configuración del proyecto**
2. Ve a la pestaña **Cloud Messaging**
3. Desplázate hasta **"Web Push certificates"**
4. Verifica que haya una VAPID key generada
5. Si no existe, genera una nueva:
   - Haz clic en **"Generate key pair"** o **"Generar par de claves"**
   - Copia la clave completa (empieza con `BK...`)
   - Actualiza `VITE_FIREBASE_VAPID_KEY` en tu `.env`

### 4. Verificar que la VAPID Key coincida

La VAPID key en tu `.env` debe ser **exactamente la misma** que aparece en Firebase Console:

1. En Firebase Console > Cloud Messaging > Web Push certificates
2. Copia la key completa
3. Compara con tu `.env`:
   ```bash
   cat .env | grep VAPID
   ```
4. Deben ser idénticas (sin espacios extra, sin saltos de línea)

### 5. Verificar permisos del proyecto

1. En Google Cloud Console, ve a **IAM & Admin** > **IAM**
2. Verifica que tu cuenta tenga permisos de **Editor** o **Owner**
3. Si no tienes permisos, pídele al administrador del proyecto que te los otorgue

## 🔍 Verificación Rápida

Ejecuta estos comandos para verificar tu configuración:

```bash
# Verificar variables de entorno
cd qr-lendar-config
cat .env | grep FIREBASE

# Debe mostrar:
# VITE_FIREBASE_API_KEY=AIza...
# VITE_FIREBASE_AUTH_DOMAIN=lendar-app.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=lendar-app
# VITE_FIREBASE_STORAGE_BUCKET=lendar-app.appspot.com
# VITE_FIREBASE_MESSAGING_SENDER_ID=744581318647
# VITE_FIREBASE_APP_ID=1:744581318647:web:...
# VITE_FIREBASE_VAPID_KEY=BK...
```

## 🚨 Solución Paso a Paso

### Si el error persiste después de habilitar la API:

1. **Espera 2-3 minutos** después de habilitar la API (puede tardar en propagarse)

2. **Limpia todo el cache**:
   ```bash
   # En DevTools:
   # 1. Application > Service Workers > Unregister (todos)
   # 2. Application > Storage > Clear site data
   # 3. Recarga con Ctrl+Shift+R
   ```

3. **Verifica que el Project ID coincida**:
   - Firebase Console: Project ID = `lendar-app`
   - Google Cloud Console: Project ID = `lendar-app`
   - Tu `.env`: `VITE_FIREBASE_PROJECT_ID=lendar-app`
   - Todos deben ser **exactamente iguales**

4. **Verifica la VAPID key**:
   - Debe tener ~87 caracteres
   - Debe empezar con `BK` o `B`
   - No debe tener espacios ni saltos de línea

5. **Reinicia el servidor de desarrollo**:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

## 📋 Checklist Final

Antes de intentar login nuevamente, verifica:

- [ ] **App Web registrada** en Firebase Console
- [ ] **Cloud Messaging API habilitada** en Google Cloud Console ⚠️ CRÍTICO
- [ ] **VAPID Key generada** en Firebase Console
- [ ] **VAPID Key correcta** en `.env` (coincide con Firebase)
- [ ] **Project ID coincide** en Firebase, Google Cloud y `.env`
- [ ] **Todas las variables de entorno** configuradas
- [ ] **Cache limpiado** en el navegador
- [ ] **Servidor reiniciado** después de cambios

## 🔗 Enlaces Directos

- [Firebase Console - Cloud Messaging](https://console.firebase.google.com/project/_/settings/cloudmessaging)
- [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library)
- [Google Cloud Console - Firebase Cloud Messaging API](https://console.cloud.google.com/apis/library/fcm.googleapis.com)

## 💡 Nota Importante

El error `Registration failed - push service error` **casi siempre** se debe a que la **Cloud Messaging API no está habilitada** en Google Cloud Console. Asegúrate de habilitarla antes de continuar.
