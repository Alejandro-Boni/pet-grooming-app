# Peluquería / Spa de Mascotas — App de Agendamiento

Monorepo con dos proyectos independientes:

```
pet-grooming-app/
├── server/   API REST — Node.js + Express + PostgreSQL
└── client/   PWA — React + Vite + Tailwind CSS (módulo cliente y panel admin)
```

## 1. Cómo está resuelto cada requisito técnico

- **Algoritmo de control de concurrencia** (`server/src/routes/appointments.js`): al crear una
  cita, la transacción toma un `pg_advisory_xact_lock` específico para esa fecha antes de
  contar las citas existentes. Esto serializa a nivel de base de datos las solicitudes
  simultáneas para el mismo día: la primera transacción que llega hace su verificación e
  inserción y libera el bloqueo al hacer `COMMIT`; solo entonces la segunda puede continuar,
  ve la cita recién creada y es rechazada con `409 Conflict` si el cupo ya se llenó.
- **Cálculo dinámico de tiempo** (`server/src/utils/duration.js`): cada servicio tiene una
  duración base; se multiplica por un factor según el tamaño de la mascota (pequeño ×0.75,
  mediano ×1, grande ×1.5) y se redondea al bloque de 15 minutos más cercano.
- **Servicio móvil sin local fijo — traslado entre citas, con tráfico real** (`server/src/utils/tomtom.js`
  y `server/src/utils/slots.js` → `hasTravelBuffer`): como el negocio atiende desde un solo
  vehículo, las citas de un día forman una ruta secuencial. Cada cita guarda `address`, `lat`
  y `lng` (geocodificados con TomTom al momento de agendar), y además de la duración del
  servicio, se reserva el tiempo de traslado real —con tráfico— hacia la cita anterior y desde
  la cita siguiente, calculado con la API de rutas de TomTom (plan gratuito, sin tarjeta de
  crédito, 2,500 solicitudes/día). El cálculo se hace una sola vez por cita vecina (no por cada
  franja de 15 minutos), para no gastar cuota innecesariamente. Si más adelante el negocio suma
  un segundo vehículo, este mecanismo necesitaría extenderse a asignación de citas por
  vehículo/ruta — avísame cuando quieras que la agregue.
- **Base de datos en la nube**: esquema relacional en PostgreSQL (`server/src/db/schema.sql`)
  con tablas de usuarios, mascotas, servicios, horarios, bloqueos, configuración y citas.
- **CI/CD**: pensado para Vercel conectado a GitHub (ver sección 4).

## 2. Configurar Firebase (autenticación)

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. En **Authentication → Sign-in method**, activa el proveedor **Correo/contraseña**.
   (El proveedor de teléfono se puede activar después; requiere configurar reCAPTCHA y,
   en algunos planes, facturación habilitada — se dejó el correo como método inicial por
   ser el más simple de poner en marcha).
3. En **Configuración del proyecto → Tus apps**, crea una app web y copia el `firebaseConfig`
   a `client/.env` (basado en `client/.env.example`).
4. En **Configuración del proyecto → Cuentas de servicio**, genera una clave privada nueva.
   Copia el JSON completo (en una sola línea) a `FIREBASE_SERVICE_ACCOUNT` en `server/.env`.

## 3. Configurar TomTom (tiempo de traslado con tráfico)

1. Crea una cuenta gratuita en [developer.tomtom.com](https://developer.tomtom.com) (no pide tarjeta).
2. Crea una app desde el dashboard y copia su **API Key**.
3. Pégala en `server/.env` como `TOMTOM_API_KEY`.
4. Con el plan gratuito tienes 2,500 solicitudes/día entre geocodificación y cálculo de rutas —
   de sobra para un negocio pequeño. Puedes monitorear el consumo desde el mismo dashboard.

## 4. Poner el proyecto a correr en local

### Backend

```bash
cd server
cp .env.example .env      # completa DATABASE_URL, FIREBASE_SERVICE_ACCOUNT y TOMTOM_API_KEY
npm install
npm run migrate           # crea las tablas y datos iniciales (servicios, horarios)
npm run dev                # http://localhost:4000
```

Para convertir a un usuario en administrador (debe haber iniciado sesión al menos una
vez desde el módulo cliente para que exista su fila en la base de datos):

```bash
npm run make-admin -- correo@ejemplo.com
```

### Frontend

```bash
cd client
cp .env.example .env      # completa las claves de Firebase y VITE_API_URL
npm install
npm run dev                # http://localhost:5173
```

- Módulo del cliente: `http://localhost:5173/`
- Panel de administración: `http://localhost:5173/admin` (requiere que el usuario tenga rol `admin`)

## 5. Despliegue

**Frontend (client/):** ideal para Vercel. Importa el repo, selecciona la carpeta `client`
como raíz del proyecto, define las variables de entorno (`VITE_FIREBASE_*`, `VITE_API_URL`)
y Vercel hará despliegue continuo con cada `git push`.

**Backend (server/):** al ser un servidor Express con conexión persistente a PostgreSQL,
funciona mejor en un proveedor de servidor "siempre encendido" como **Render** o **Railway**
(ambos con despliegue automático conectado a GitHub, igual que Vercel). Recuerda agregar
`TOMTOM_API_KEY` también en las variables de entorno de ese proveedor. Si prefieres tener
todo en Vercel, la alternativa es adaptar las rutas de `server/src/routes` a funciones
serverless de Vercel y usar una base de datos Postgres con pooler para serverless, como
**Neon** o **Vercel Postgres** — avísame si quieres que prepare esa variante.

Para la base de datos en la nube, cualquiera de estas opciones funciona bien con este
esquema: **Neon**, **Supabase**, **Render Postgres** o **Railway Postgres**.


