# DEPLOYMENT.md - GUÍA DE DESPLIEGUE A PRODUCCIÓN Y MANTENIMIENTO

## 1. Visión General del Despliegue (Costo S/ 0)

La **Plataforma SaaS de Control de Eventos** está optimizada para desplegarse inicialmente con **Costo S/ 0 de infraestructura** aprovechando las capas gratuitas (Free Tiers) de **Vercel** y **Supabase**:

- **Frontend / PWA**: Vercel Free Tier (Next.js 14 App Router + Service Worker).
- **Backend & Base de Datos**: Supabase Free Tier (PostgreSQL 15+ con RLS + Auth + WebSockets Realtime).
- **Control de Código**: Repositorio GitHub (Público o Privado).

---

## 2. Paso 1: Configuración del Proyecto en Supabase (Backend & DB)

1. **Crear Proyecto**:
   - Acceder a [Supabase Console](https://supabase.com/dashboard) y crear un nuevo proyecto (Región recomendada: `sa-east-1` São Paulo / América del Sur).
2. **Ejecutar Migración de Base de Datos**:
   - Abrir el **SQL Editor** en el panel de Supabase.
   - Copiar el contenido íntegro del archivo de migración:
     `supabase/migrations/00001_initial_schema.sql`
   - Ejecutar la consulta. Esto creará todas las tablas (`workspaces`, `events`, `guest_groups`, `qr_tokens`, `tables`, `table_assignments`, `check_ins`, `cuts`, `audit_logs`), tipos ENUM, políticas RLS y la función atómica `rpc_register_check_in`.
3. **Habilitar Realtime**:
   - Ir a **Database -> Replication** y habilitar Supabase Realtime para la tabla `check_ins`.
4. **Obtener Credenciales de API**:
   - Ir a **Project Settings -> API**.
   - Copiar:
     - `Project URL` (ej. `https://xyzcompany.supabase.co`)
     - `anon / public key` (ej. `eyJhbGciOiJKV1QiLC...`)

---

## 3. Paso 2: Despliegue en Vercel (Frontend PWA)

1. **Conectar Repositorio Git**:
   - Importar el repositorio desde GitHub a [Vercel Dashboard](https://vercel.com/new).
2. **Configurar Variables de Entorno**:
   - En la sección **Environment Variables**, agregar:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
     NEXT_PUBLIC_APP_URL=https://tu-subdominio.vercel.app
     ```
3. **Desplegar**:
   - Hacer clic en **Deploy**. Vercel compilará automáticamente la aplicación Next.js y configurará el Service Worker PWA con HTTPS activado por defecto.

---

## 4. Estrategia de Dominios y Subdominios

- **Subdominio Gratuito (MVP)**: `https://eventcontrol.vercel.app`
- **Dominio Personalizado (Producción Comercial)**:
  - En Vercel: Ir a **Project Settings -> Domains**.
  - Agregar dominio propio (ej. `https://app.eventos.pe`).
  - Configurar los registros DNS `CNAME` y `A` apuntando a Vercel.

---

## 5. Política de Respaldos (Backups) y Monitoreo

- **Backups de Base de Datos**:
  - Supabase incluye backups diarios automáticos con retención de 7 días en el plan Free Tier.
  - Para respaldos manuales descargables:
    ```bash
    supabase db dump -f backup_eventcontrol.sql
    ```
- **Monitoreo de Infraestructura**:
  - Inspeccionar el consumo de almacenamiento (< 500 MB) y conexiones activas (< 200 en Realtime) desde el panel **Project Health** de Supabase.
