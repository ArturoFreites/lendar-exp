#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar la configuración de Firebase
 * Ejecuta: node scripts/check-firebase-config.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env');

// Función para cargar variables de entorno desde .env
function loadEnvFile() {
  if (!existsSync(envPath)) {
    return {};
  }

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      // Ignorar comentarios y líneas vacías
      if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remover comillas
          envVars[key] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return {};
  }
}

console.log('🔍 Verificando configuración de Firebase...\n');

// Cargar variables de .env
const envFileVars = loadEnvFile();

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function checkmark(isValid) {
  return isValid ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
}

function warning(isValid) {
  return isValid ? `${colors.green}✅${colors.reset}` : `${colors.yellow}⚠️${colors.reset}`;
}

// 1. Verificar variables de entorno
console.log(`${colors.bold}1. Variables de Entorno (.env)${colors.reset}`);
console.log('─'.repeat(50));

// Combinar process.env (producción) con .env (desarrollo)
const envVars = {
  'VITE_FIREBASE_API_KEY': process.env.VITE_FIREBASE_API_KEY || envFileVars.VITE_FIREBASE_API_KEY,
  'VITE_FIREBASE_AUTH_DOMAIN': process.env.VITE_FIREBASE_AUTH_DOMAIN || envFileVars.VITE_FIREBASE_AUTH_DOMAIN,
  'VITE_FIREBASE_PROJECT_ID': process.env.VITE_FIREBASE_PROJECT_ID || envFileVars.VITE_FIREBASE_PROJECT_ID,
  'VITE_FIREBASE_STORAGE_BUCKET': process.env.VITE_FIREBASE_STORAGE_BUCKET || envFileVars.VITE_FIREBASE_STORAGE_BUCKET,
  'VITE_FIREBASE_MESSAGING_SENDER_ID': process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || envFileVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  'VITE_FIREBASE_APP_ID': process.env.VITE_FIREBASE_APP_ID || envFileVars.VITE_FIREBASE_APP_ID,
  'VITE_FIREBASE_VAPID_KEY': process.env.VITE_FIREBASE_VAPID_KEY || envFileVars.VITE_FIREBASE_VAPID_KEY,
};

let envValid = true;
for (const [key, value] of Object.entries(envVars)) {
  const isValid = value && value.trim() !== '';
  const display = isValid ? (key === 'VITE_FIREBASE_VAPID_KEY' ? value.substring(0, 20) + '...' : value) : 'NO CONFIGURADA';
  console.log(`   ${checkmark(isValid)} ${key}: ${display}`);
  if (!isValid) envValid = false;
}

if (!envValid) {
  console.log(`\n${colors.red}❌ Faltan variables de entorno${colors.reset}`);
  console.log(`   Configura las variables en tu archivo .env o en Vercel Dashboard`);
} else {
  console.log(`\n${colors.green}✅ Todas las variables de entorno están configuradas${colors.reset}`);
}

// 2. Verificar Service Worker
console.log(`\n${colors.bold}2. Service Worker (firebase-messaging-sw.js)${colors.reset}`);
console.log('─'.repeat(50));

const swPath = resolve(rootDir, 'public/firebase-messaging-sw.js');
let swValid = true;

try {
  const swContent = readFileSync(swPath, 'utf-8');
  
  // Verificar que tenga la configuración
  const configMatch = swContent.match(/const firebaseConfig\s*=\s*\{[\s\S]*?\};/);
  if (!configMatch) {
    console.log(`   ${checkmark(false)} No se encontró firebaseConfig en el Service Worker`);
    swValid = false;
  } else {
    const configStr = configMatch[0];
    
    // Verificar cada campo
    const checks = {
      'apiKey': configStr.includes('"apiKey"') && !configStr.includes('"apiKey": ""'),
      'authDomain': configStr.includes('"authDomain"') && !configStr.includes('"authDomain": ""'),
      'projectId': configStr.includes('"projectId"') && !configStr.includes('"projectId": ""'),
      'storageBucket': configStr.includes('"storageBucket"') && !configStr.includes('"storageBucket": ""'),
      'messagingSenderId': configStr.includes('"messagingSenderId"') && !configStr.includes('"messagingSenderId": ""'),
      'appId': configStr.includes('"appId"') && !configStr.includes('"appId": ""'),
    };
    
    for (const [key, isValid] of Object.entries(checks)) {
      console.log(`   ${checkmark(isValid)} ${key}: ${isValid ? 'Configurado' : 'Vacío o faltante'}`);
      if (!isValid) swValid = false;
    }
  }
  
  // Verificar versión de Firebase
  const versionMatch = swContent.match(/firebasejs\/(\d+\.\d+\.\d+)/);
  if (versionMatch) {
    const version = versionMatch[1];
    console.log(`   ${warning(true)} Versión de Firebase: ${version}`);
  } else {
    console.log(`   ${warning(false)} No se pudo detectar la versión de Firebase`);
  }
  
} catch (error) {
  console.log(`   ${checkmark(false)} Error leyendo Service Worker: ${error.message}`);
  swValid = false;
}

if (!swValid) {
  console.log(`\n${colors.red}❌ El Service Worker no está configurado correctamente${colors.reset}`);
  console.log(`   Ejecuta: npm run build (esto ejecutará inject-sw-env.js automáticamente)`);
} else {
  console.log(`\n${colors.green}✅ Service Worker configurado correctamente${colors.reset}`);
}

// 3. Resumen y recomendaciones
console.log(`\n${colors.bold}📋 Resumen${colors.reset}`);
console.log('─'.repeat(50));

if (envValid && swValid) {
  console.log(`${colors.green}✅ Configuración completa${colors.reset}`);
  console.log(`\n${colors.blue}💡 Próximos pasos:${colors.reset}`);
  console.log(`   1. Verifica en Firebase Console que la VAPID key esté generada`);
  console.log(`   2. Verifica que Cloud Messaging API esté habilitada`);
  console.log(`   3. Prueba hacer login y revisa la consola del navegador`);
} else {
  console.log(`${colors.red}❌ Configuración incompleta${colors.reset}`);
  console.log(`\n${colors.yellow}⚠️  Acciones requeridas:${colors.reset}`);
  
  if (!envValid) {
    console.log(`   ${colors.red}•${colors.reset} Configura las variables de entorno faltantes`);
    console.log(`     - En desarrollo: archivo .env`);
    console.log(`     - En producción: Vercel Dashboard > Settings > Environment Variables`);
  }
  
  if (!swValid) {
    console.log(`   ${colors.red}•${colors.reset} Ejecuta el script de inyección:`);
    console.log(`     ${colors.blue}npm run build${colors.reset} o ${colors.blue}node scripts/inject-sw-env.js${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}📖 Ver guía completa en: FIREBASE_CONSOLE_SETUP.md${colors.reset}`);
}

console.log('\n');
