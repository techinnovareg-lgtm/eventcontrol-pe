# ROADMAP.md - HOJA DE RUTA Y FASES DE DESARROLLO

## 1. Estrategia de Desarrollo Incremental por Fases

El desarrollo de la **Plataforma SaaS de Control de Eventos** se ejecutará en **14 Fases secuenciales (Fase 0 a Fase 13)**. Cada fase concluye con una entrega formal, ejecución de pruebas de validación y requerimiento de aprobación explícita del desarrollador supervisor antes de avanzar a la siguiente.

```text
Fase 0: Análisis y Diseño Arquitectónico (EN CURSO)
   │
   ▼
Fase 1: Estructura Base, UI & Autenticación
   │
   ▼
Fase 2: Multi-Tenant (Workspace, Roles & RLS)
   │
   ▼
Fase 3: Gestión de Eventos e Importación Excel (CUMPLE.xlsx)
   │
   ▼
Fase 4: Motor Criptográfico QR y Plano de Mesas Visual
   │
   ▼
Fase 5: Módulo de Check-in (Cámara, Escaneo y Concurrencia Atómica)
   │
   ▼
Fase 6: Dashboard Operativo en Tiempo Real (WebSockets)
   │
   ▼
Fase 7: Sistema de Cortes Inmutables y Control de Catering
   │
   ▼
Fase 8: Exportaciones Ejecutivas (Excel y PDF con Dashboards)
   │
   ▼
Fase 9: WhatsApp Asistido (Integración sin costo wa.me)
   │
   ▼
Fase 10: Landing Page Comercial, Planes & Configuración SaaS
   │
   ▼
Fase 11: Resiliencia Offline-First y Motor de Sincronización
   │
   ▼
Fase 12: QA Integral, Batería de Pruebas Críticas y Audits
   │
   ▼
Fase 13: Despliegue a Producción (Vercel + Supabase), Backup y Cierre
```

---

## 2. Detalle de Fases y Criterios de Aceptación

### Fase 0 — Análisis, Diseño y Aprobación Arquitectónica
* **Entregables**:
  - `ARCHITECTURE.md`: Arquitectura PWA + BaaS, diagramas de componentes, justificación de stack y estrategia offline.
  - `DATABASE.md`: Modelo ERD, esquemas DDL Postgres, RPCs atómicas y políticas RLS.
  - `SECURITY.md`: Matriz RBAC, cifrado QR, aislamiento multi-tenant y privacidad.
  - `ROADMAP.md`: Hoja de ruta completa y batería de pruebas de QA.
  - `implementation_plan.md`: Plan de implementación para revisión del desarrollador.
* **Criterio de Parada**: Detenerse y esperar aprobación del desarrollador humano.

### Fase 1 — Repositorio y Configuración Base
* **Entregables**: Proyecto Next.js 14 (App Router) + Tailwind + Shadcn UI + Supabase Auth inicial.
* **Validación**: Registro y login funcional, rutas protegidas.

### Fase 2 — Engine Multi-Tenant y Permisos
* **Entregables**: Creación de Workspace, invitación de miembros, asignación de roles (`OWNER`, `ADMIN`, `COORDINADOR`, `SEGURIDAD`) y políticas RLS aplicadas.
* **Validación**: Prueba de aislamiento (Usuario de Workspace A no puede ver recursos de Workspace B).

### Fase 3 — Gestión de Eventos e Importación de Excel
* **Entregables**: CRUD de eventos, parser interactivo de archivos XLSX/CSV (Wizard de mapeo de columnas), soporte directo del formato real `CUMPLE.xlsx`, detector de errores y vista previa.
* **Validación**: Carga exitosa de 250+ filas clasificadas en validas e inválidas con reporte de errores descargable.

### Fase 4 — Generación de QR y Plano Virtual de Mesas
* **Entregables**: Generación de tokens QR seguros (256-bit entropy), lienzo interactivo de mesas con drag-and-drop o asignación asistida, control de capacidad y alertas de sobrecupo.
* **Validación**: Asignación de grupos a mesas y generación de QR vectoriales sin PII.

### Fase 5 — Módulo de Check-in Atómico y Concurrencia
* **Entregables**: Interfaz optimizada para smartphone con escáner de cámara HTML5, registro de pases parciales/completos, bloqueo automático al completar cupo y stored procedure atómica `rpc_register_check_in`.
* **Validación**: Superar prueba de escaneo simultáneo con 2 operadores sin exceder pases autorizados.

### Fase 6 — Dashboard Operativo en Tiempo Real
* **Entregables**: Panel visual con métricas vivas (Autorizados, Ingresados, Pendientes, Ocupación por Mesa, Últimos Ingresos) actualizado mediante Supabase Realtime WebSockets.
* **Validación**: Actualización automática instantánea en pantalla de administración tras escaneo en smartphone.

### Fase 7 — Cortes Inmutables y Control de Catering
* **Entregables**: Creación de snapshots congelados del evento ("Brindis", "Servicio de comida"), cálculo de personas presentes al corte y contador en vivo de "Llegadas Posteriores".
* **Validación**: Verificar que ingresos posteriores no alteran los números congelados del corte de comida.

### Fase 8 — Reportes y Exportación Ejecutiva
* **Entregables**: Exportador masivo a Excel (.xlsx) y generador de informes ejecutivos PDF con renderizado visual de dashboards y gráficos de distribución por mesa.
* **Validación**: Generación limpia de PDF sin desbordamientos ni fallos de renderizado.

### Fase 9 — WhatsApp Asistido
* **Entregables**: Formateador de mensajes personalizados y botón de envío asistido que abre `wa.me` / WhatsApp Web sin costo de mensajería API.
* **Validación**: Apertura correcta de la conversación con el teléfono del responsable y mensaje precargado con enlace/QR.

### Fase 10 — Landing Page Comercial y Configuración de Planes
* **Entregables**: Landing page pública responsiva con hero visual (Excel -> QR -> Mesas -> Check-in -> Dashboard), tabla de precios (Free, Starter, Pro, Business), FAQ y matriz centralizada de límites por plan (`PLAN_LIMITS`).
* **Validación**: Demostración pública fluida y bloqueo correcto al superar límites del plan.

### Fase 11 — Motor Offline-First y Sincronización
* **Entregables**: Caché PWA en IndexedDB (Dexie.js), escaneo local sin conectividad a internet, cola de sincronización (`sync_queue`) y resolución atómica idempotente al reconectarse.
* **Validación**: Simular corte total de red, escanear 5 QR, reconectar internet y verificar sincronización limpia sin duplicados.

### Fase 12 — QA Integral y Batería de Pruebas Críticas
* **Entregables**: Ejecución completa de la batería de 10 Casos Críticos de QA, pruebas E2E, unitarias e integración.
* **Validación**: Informe final de QA con 100% de casos aprobados.

### Fase 13 — Despliegue a Producción, Documentación y Cierre
* **Entregables**: Despliegue en Vercel + Supabase Production, configuración de variables de entorno, documentación técnica final (`README.md`, `DEPLOYMENT.md`) y demo guiada.
* **Validación**: Aprobación final y sign-off del desarrollador supervisor.

---

## 3. Batería de Pruebas y Casos Críticos de QA

De acuerdo con el punto 65 del Prompt Maestro, las siguientes pruebas son de carácter **MANDATORIO**:

| Caso # | Descripción del Escenario | Acción Ejecutada | Resultado Esperado Exigido |
| :---: | :--- | :--- | :--- |
| **Caso 1** | Ingreso Parcial | Grupo de 5 personas. Ingresan 3. | Dashboard muestra `3/5`, estado **PARCIAL**, 2 pases pendientes. |
| **Caso 2** | Ingreso Completo | Ingresan las 2 personas restantes del Grupo. | Dashboard muestra `5/5`, estado **COMPLETO**, QR queda bloqueado. |
| **Caso 3** | Intento de Sobrepaso | Intentan ingresar 1 persona adicional con el QR completo. | Sistema muestra **RECHAZADO: GRUPO COMPLETO**. Registra en auditoría. |
| **Caso 4** | QR Inválido | Se escanea un QR con token ficticio o alterado. | Sistema muestra **RECHAZADO: QR NO VÁLIDO**. Cero exposición de PII. |
| **Caso 5** | Dos Operadores Simultáneos | Op A y Op B escanean al mismo tiempo el último pase disponible. | La RPC atómica procesa uno como **ÉXITO** y rechaza el segundo. Jamás supera el límite. |
| **Caso 6** | Pérdida de Internet | Se apaga la red en el teléfono de seguridad. | El escaneo continúa contra IndexedDB local de forma fluida. |
| **Caso 7** | Reconexión a Internet | Se restablece la conectividad en el teléfono. | La `sync_queue` sube los movimientos al servidor sin generar duplicados (idempotente). |
| **Caso 8** | Corte e Ingresos Posteriores | Corte de Comida a las 19:00 (231 presentes). A las 19:20 ingresan 6. | El corte de 19:00 se mantiene congelado en `231`. El indicador muestra `6 Llegadas Posteriores`. |
| **Caso 9** | Prueba de Aislamiento Tenant | Usuario del Workspace A intenta consultar datos del Workspace B. | Servidor retorna **ACCESS DENIED / 404 NOT FOUND**. RLS bloquea en base de datos. |
| **Caso 10** | Excel con Filas Erróneas | Se sube archivo Excel con campos vacíos, números negativos o sin pases. | Sistema muestra resumen con errores detectados y bloquea la importación silenciosa. |
