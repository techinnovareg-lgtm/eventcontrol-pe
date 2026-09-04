# DEPLOYMENT.md - GUÍA DE DESPLIEGUE A PRODUCCIÓN Y MANTENIMIENTO

## 1. Visión General del Despliegue (Dominio Oficial: tech-innova.online)

La plataforma **EventControl.pe** desarrollada por **Tech Innova** está optimizada para desplegarse con alto rendimiento y escalabilidad en la nube combinando **Vercel** (Frontend Next.js PWA) y **Supabase** (Backend PostgreSQL + Auth Realtime), vinculada al dominio empresarial `tech-innova.online`.

- **Dominio Principal**: `https://tech-innova.online/`
- **Subdominio de la App**: `https://eventcontrol.tech-innova.online` (o `app.tech-innova.online`)
- **Frontend / PWA**: Vercel Cloud (Next.js 14 App Router + Service Worker PWA).
- **Backend & Base de Datos**: Supabase PostgreSQL + Auth + Realtime Engine.
- **Servicio de Correos 2FA**: Resend API / SMTP transaccional para `tech.innova.reg@gmail.com`.

---

## 2. Paso 1: Configuración del Proyecto en Supabase (Backend & DB)

1. **Crear Proyecto**:
   - Acceder a [Supabase Dashboard](https://supabase.com/dashboard) y crear un nuevo proyecto (Región recomendada: `sa-east-1` São Paulo).
2. **Ejecutar Migración de Base de Datos**:
   - Abrir el **SQL Editor** en Supabase.
   - Copiar y ejecutar el contenido del script de esquema:
     `supabase/schema.sql`
   - Esto creará todas las tablas (`workspaces`, `admin_accounts`, `events`, `guest_groups`, `check_ins`, `cuts`), enums y políticas de seguridad RLS.
3. **Obtener Credenciales de API**:
   - Ir a **Project Settings -> API** en Supabase.
   - Copiar:
     - `Project URL` (ej. `https://xyzcompany.supabase.co`)
     - `anon / public key` (ej. `eyJhbGciOiJKV1QiLC...`)

---

## 3. Paso 2: Despliegue en Vercel (Frontend PWA)

1. **Importar Repositorio Git**:
   - Ir a [Vercel Dashboard](https://vercel.com/new) e importar el repositorio del proyecto desde GitHub.
2. **Configurar Variables de Entorno (Environment Variables)**:
   - En la sección **Environment Variables**, agregar los siguientes valores:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
     NEXT_PUBLIC_APP_URL=https://eventcontrol.tech-innova.online
     RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
     ```
3. **Desplegar**:
   - Hacer clic en **Deploy**. Vercel compilará la aplicación Next.js, configurará el Service Worker PWA y asignará la capa SSL/HTTPS.

---

## 4. Vinculación del Dominio `tech-innova.online` y Subdominios

1. **Configuración de DNS en Proveedor de Dominio**:
   - Ir al panel de administración del dominio `tech-innova.online`.
   - Agregar los registros DNS recomendados por Vercel:
     - **Registro A**: `@` -> `76.76.21.21`
     - **Registro CNAME**: `eventcontrol` -> `cname.vercel-dns.com`
2. **Asignación en Vercel Dashboard**:
   - Ir a **Project Settings -> Domains**.
   - Agregar el subdominio `eventcontrol.tech-innova.online`.
   - Vercel verificará automáticamente los registros DNS y emitirá el certificado SSL gratuito de Let's Encrypt.

---

## 5. Pruebas de Funcionamiento en Producción

- **Verificación de Login Superadmin 2FA**:
  - Ingresar con `tech.innova.reg@gmail.com` en `https://eventcontrol.tech-innova.online/login`.
  - Confirmar el despacho e ingreso del PIN de 4 dígitos enviado a `tech.innova.reg@gmail.com`.
- **Acceso de Usuarios Registrados**:
  - Probar con credenciales de cuenta cliente registrada (ej. `ana@amgweddings.pe`).
  - Intentos con correos no autorizados serán rechazados por la validación estricta de la plataforma.
