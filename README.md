# PLATAFORMA SaaS DE CONTROL DE EVENTOS, INVITADOS Y CATERING

Plataforma Web SaaS Multi-tenant orientada a **Wedding Planners, organizadores de bodas y eventos sociales** para administrar la operación posterior a la confirmación de invitados.

![EventControl SaaS Architecture](https://img.shields.io/badge/Architecture-PWA%20Offline--First%20%2B%20BaaS-emerald)
![Framework](https://img.shields.io/badge/Framework-Next.js%2014%20App%20Router-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2015%20%2B%20RLS-indigo)
![Cost](https://img.shields.io/badge/Deploy%20Cost-S%2F%200%20(Free%20Tier)-brightgreen)
![Status](https://img.shields.io/badge/QA%20Status-100%25%20Passed%20(10%2F10)-success)

---

## 🚀 Guía de Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
- Node.js v20+ o superior
- npm v10+
- Git

### 2. Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd App_Asistencia_Evento

# Instalar dependencias
npm install
```

### 3. Ejecución en Modo Desarrollo
```bash
npm run dev
```
Abrir `http://localhost:3000` en el navegador.

### 4. Compilación y Validación de Producción
```bash
npm run build
```

---

## 🎬 Demostración Guiada Flujo E2E (Paso a Paso)

El desarrollador humano o evaluador puede probar la aplicación completa de principio a fin ejecutando la siguiente secuencia:

1. **Página Comercial & Registro**:
   - Ingresar a `http://localhost:3000` para ver la Landing Page y tabla de precios (`/pricing`).
   - Ir a `/register` para crear un nuevo Workspace de prueba.
2. **Navegación al Dashboard**:
   - Ingresar a `/dashboard` para ver las métricas en vivo.
3. **Gestión de Eventos & Importación de Excel**:
   - Ir a `/events` e ingresar a la opción **Importar Excel** en el evento de demostración (*Cumpleaños Tavo 60 Años*).
   - Hacer clic en **"Cargar Ejemplo CUMPLE.xlsx"** para probar el archivo real de referencia.
   - Completar el asistente de mapeo de columnas y verificar la detección de errores de filas vacías/negativas (Caso 10).
4. **Criptografía de Códigos QR**:
   - Navegar a `/events/evt-102/qr` para inspeccionar los códigos QR vectoriales generados. Probar el copiado de enlace o regeneración de token.
5. **Plano Virtual de Mesas**:
   - Ir a `/events/evt-102/tables` para ver la distribución visual de mesas y alertas de sobrecupo (`⚠️ SOBRECUPOS (+X)`).
6. **Escáner Móvil de Seguridad PWA (Check-in)**:
   - Abrir `/scan` (optimizado para smartphones).
   - Probar ingresos parciales (Caso 1), completos (Caso 2), sobrepasos rechazados (Caso 3) y simulación de concurrencia atómica de 2 operadores simultáneos (Caso 5).
7. **Sincronización Offline**:
   - En `/scan`, cambiar el interruptor a `OFFLINE` para simular pérdida de red (Caso 6). Realizar escaneos locales y presionar `Sincronizar` al volver a `ONLINE` (Caso 7).
8. **Dashboard en Tiempo Real**:
   - Observar cómo la pantalla `/dashboard` actualiza automáticamente las métricas y la actividad reciente en tiempo real.
9. **Cortes de Catering Inmutables**:
   - Ir a `/events/evt-102/cuts` para congelar un snapshot ("Servicio de Comida") y verificar la inmutabilidad ante llegadas posteriores (Caso 8).
10. **Reportes Ejecutivos**:
    - Navegar a `/events/evt-102/reports` para descargar el reporte completo en Excel multi-hoja (`.xlsx`) o imprimir el PDF Ejecutivo.
11. **Centro de Auditoría QA**:
    - Ir a `/qa` y hacer clic en **"Ejecutar Batería de 10 Casos QA"** para verificar el 100% de pasaje técnico.

---

## 🏛️ Documentación Normativa de Arquitectura

- 📘 **[ARCHITECTURE.md](file:///d:/Proyectos%20Desarrollo/Antigravity/HRA.estadistica/App_Asistencia_Evento/ARCHITECTURE.md)**: Arquitectura Full Stack PWA + BaaS, diagramas de secuencia, resiliencia offline y análisis de costos.
- 🗄️ **[DATABASE.md](file:///d:/Proyectos%20Desarrollo/Antigravity/HRA.estadistica/App_Asistencia_Evento/DATABASE.md)**: Modelo ERD, DDL SQL Postgres, stored procedures atómicas y políticas RLS multi-tenant.
- 🔒 **[SECURITY.md](file:///d:/Proyectos%20Desarrollo/Antigravity/HRA.estadistica/App_Asistencia_Evento/SECURITY.md)**: Aislamiento por Workspace, criptografía QR de 256 bits (Cero PII), RBAC de 5 roles y Ley 29733 (Perú).
- 🗺️ **[ROADMAP.md](file:///d:/Proyectos%20Desarrollo/Antigravity/HRA.estadistica/App_Asistencia_Evento/ROADMAP.md)**: Hoja de ruta de 14 Fases y especificación de los 10 Casos Críticos de QA.
- 🚀 **[DEPLOYMENT.md](file:///d:/Proyectos%20Desarrollo/Antigravity/HRA.estadistica/App_Asistencia_Evento/DEPLOYMENT.md)**: Guía paso a paso para despliegue en producción con Vercel + Supabase (Costo S/ 0).

---

## 📄 Licencia

Desarrollado para la plataforma SaaS de Control de Eventos. Todos los derechos reservados.
