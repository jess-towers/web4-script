#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando Tortuga Script para producción...\n');

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env desde .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado exitosamente');
  } else {
    console.log('❌ No se encontró el archivo .env.example');
    process.exit(1);
  }
} else {
  console.log('✅ El archivo .env ya existe');
}

// Generar el cliente de Prisma
console.log('\n🔨 Generando cliente de Prisma...');
const { execSync } = require('child_process');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente de Prisma generado exitosamente');
} catch (error) {
  console.error('❌ Error al generar el cliente de Prisma:', error.message);
  process.exit(1);
}

console.log('\n🎉 Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Verifica que el archivo .env contenga la URL correcta de tu base de datos');
console.log('2. Ejecuta "npm run dev" para probar la aplicación');
console.log('3. Si todo funciona correctamente, ejecuta "npm run build" para crear el ejecutable'); 