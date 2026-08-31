# SECURITY.md - MODELO DE SEGURIDAD Y PRIVACIDAD DE DATOS

## 1. Visión General de Seguridad

La **Plataforma SaaS de Control de Eventos** aplica el principio de **Defensa en Profundidad (Defense in Depth)**. La seguridad está implementada no solo en la interfaz de usuario, sino como un control infranqueable en la base de datos y la arquitectura del backend.

```text
[ Cliente PWA / Navegador ]
         │
    HTTPS / TLS 1.3
         ▼
[ JWT Session / Supabase Auth ]
         │
    Validador de Permisos (RBAC)
         ▼
[ Postgres Row Level Security (RLS) ] ── (Infranqueable a nivel DB)
         │
    Auditoría / Audit Log
```

---

## 2. Aislamiento Multi-tenant (Data Isolation)

### 2.1 Garantía Infranqueable en Backend
* **Inexistencia de Tenancy Leakage**: Cada tabla contiene una columna `workspace_id`.
* **Filtros Automáticos de Base de Datos**: Ninguna consulta puede retornar filas que no correspondan al `workspace_id` al que pertenece el usuario autenticado.
* **Protección contra IDOR (Insecure Direct Object Reference)**: Si un usuario con rol de un Workspace 'A' intenta forzar una llamada a la API `/api/events/uuid-de-workspace-b`, el motor de Postgres interceptará la consulta a través de RLS y retornará `0 filas` o `Access Denied`.

---

## 3. Especificación Criptográfica y Seguridad del QR

### 3.1 Cero Exposición de Información Personal (PII)
* El código QR **NUNCA** codifica datos legibles como nombres de invitados, números de teléfono, mesa asignada o número de pases.
* Si un invitado o un tercero escanea el QR utilizando la cámara genérica de su smartphone, obtendrá únicamente una URL con un token indescifrable:
  `https://app.eventos.pe/checkin/tk_8f12a9c3e4b5d6f7`

### 3.2 Generación del Token
* Se genera con un generador de números aleatorios criptográficamente seguro (CS-PRNG) utilizando 256 bits de entropía (ej. UUIDv4 + Salt aleatorio).
* **Imposibilidad de Enumeración**: Un atacante no puede adivinar tokens secuenciales (ej. `token_001`, `token_002` no existen).

### 3.3 Revocación y Recuperación
* Ante la pérdida de un teléfono o reenvío involuntario a un contacto no deseado, el administrador puede revocar el QR desde la consola.
* La revocación invalida inmediatamente el `token_hash` en base de datos. Se emite un nuevo token sustituto sin alterar la lista de pases o el historial de check-ins previos.

---

## 4. Control de Acceso Basado en Roles (RBAC)

La plataforma impone la matriz de mínimos privilegios:

| Módulo / Acción | OWNER | ADMIN | COORDINADOR | SEGURIDAD | CONSULTA |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Facturación / Planes** |  | ❌ | ❌ | ❌ | ❌ |
| **Gestión de Usuarios del Workspace** |  | ❌ | ❌ | ❌ | ❌ |
| **Crear / Editar Eventos** |  |  | ⚠️ (Solo asignados) | ❌ | ❌ |
| **Importar Excel / Grupos** |  |  | ⚠️ | ❌ | ❌ |
| **Organizar Mesas y Asignar** |  |  |  | ❌ | ❌ |
| **Generar / Revocar QR** |  |  |  | ❌ | ❌ |
| **Escanear QR y Registrar Check-in** |  |  |  |  | ❌ |
| **Crear Cortes de Catering** |  |  |  | ❌ | ❌ |
| **Ver Dashboard en Vivo** |  |  |  | ❌ (Solo modal scan) |  |
| **Exportar Reportes PDF / Excel** |  |  |  | ❌ | ⚠️ (Lectura) |

> ⚠️ **Principio de Mínimo Privilegio para Personal de Seguridad**: El perfil `SEGURIDAD` únicamente tiene acceso a la pantalla de cámara y confirmación del número de personas que ingresan. No puede consultar la lista de otros invitados, números de teléfono, ingresos de otras mesas ni módulos financieros/administrativos.

---

## 5. Protección de Datos Personales (Cumplimiento Ley 29733 - Perú)

1. **Principio de Proporcionalidad**: Únicamente se solicita el nombre del responsable del grupo y la cantidad de pases. El número de teléfono es opcional y solo se utiliza de forma local en el navegador para iniciar la conversación asistida por WhatsApp.
2. **Derecho de Supresión (Cancelación)**: Cuando un evento es cerrado/archivado, el usuario Owner puede solicitar la depuración o anonimización de la lista de invitados conforme a las políticas de retención.
3. **No Comercialización**: Ningún dato ingresado por los Wedding Planners será compartido con terceros ni utilizado para entrenamiento de modelos externos.

---

## 6. Auditoría y Registro de Eventos de Seguridad

Se mantiene un registro inmutable en la tabla `audit_logs` para las siguientes acciones críticas:
* Intentos de inicio de sesión fallidos o sospechosos.
* Reemisión o revocación de códigos QR.
* Intentos de check-in que superen la cantidad autorizada (`REJECTED_EXCEEDED`).
* Intentos de escaneo de QR inválidos o revocados.
* Eliminación masiva de invitados o eventos.
* Modificaciones de roles o permisos de usuarios.

---

## 7. Gestión de Secretos y Variables de Entorno

* Las claves de servicio privilegiadas de Supabase (`SUPABASE_SERVICE_ROLE_KEY`) **NUNCA** se incluyen en el código bundle del frontend.
* Se proporciona una plantilla `.env.example` limpia.
* Los secretos de producción se configuran exclusivamente en las variables de entorno seguras del proveedor de hosting (Vercel Dashboard).
