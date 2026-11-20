# API de Turnos Médicos

API REST para gestionar turnos médicos, desarrollada con **Node.js, TypeScript, Express y MongoDB Atlas (Mongoose)**. Incluye registro y login con **bcrypt y JWT**, roles de usuario y arquitectura en capas organizada por componentes.

Autor: Raul Ariel Alderete

## Tecnologías

Node.js · TypeScript · Express · MongoDB Atlas · Mongoose · bcrypt · jsonwebtoken · dotenv

## Requisitos

- Node.js 20 o superior
- Una base de datos en [MongoDB Atlas](https://www.mongodb.com/atlas) (plan gratuito) con:
  - un usuario de base de datos (_Database Access_)
  - tu IP habilitada (_Network Access_)

## Instalación

```bash
git clone https://github.com/arielal79/api-turnos.git
cd api-turnos
npm install
```

Creá el archivo `.env` a partir de la plantilla y completá los valores:

```bash
cp .env.example .env        # Git Bash / Linux / macOS
copy .env.example .env      # PowerShell / CMD
```

### Variables de entorno

| Variable             | Descripción                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| `PORT`               | Puerto del servidor (por defecto 3000)                                         |
| `MONGO_URI`          | Cadena de conexión de Atlas, **incluyendo el nombre de la base** (ver abajo)   |
| `JWT_SECRET`         | Secreto para firmar los tokens (texto largo y aleatorio, mínimo 32 caracteres) |
| `JWT_EXPIRES_IN`     | Duración del token (ej: `1d`)                                                  |
| `BCRYPT_SALT_ROUNDS` | Rondas de bcrypt (ej: `10`)                                                    |

Formato de `MONGO_URI`. El nombre de la base va **antes** del `?`:

```
mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/api_turnos?retryWrites=true&w=majority
```

> El archivo `.env` contiene secretos y está en el `.gitignore`: no se sube al repositorio.

## Ejecución

```bash
npm run dev                  # desarrollo (recarga automática)
npm run build && npm start   # producción (compila a dist/ y ejecuta)
```

El servidor queda disponible en `http://localhost:3000`. Para verificarlo: `GET /api/health`.

## Estructura del proyecto

```
src/
├── server.ts            # conecta la base y levanta el servidor
├── app.ts               # configura Express, middlewares y rutas
├── config/              # variables de entorno y conexión a MongoDB
├── middlewares/         # logger, autenticación JWT / roles, manejo de errores
├── utils/               # AppError
├── types/               # extensión de tipos de Express (req.user)
└── components/
    ├── user/            # modelo y repositorio de usuarios
    ├── auth/            # registro y login
    └── turno/           # entidad principal
```

Cada componente respeta la arquitectura en capas:
**rutas → controlador → servicio → repositorio (acceso a datos)**.

## Modelos

**User**

| Campo    | Detalle                                              |
| -------- | ---------------------------------------------------- |
| nombre   | texto, mínimo 2 caracteres                           |
| email    | único, en minúsculas                                 |
| password | hash de bcrypt (nunca se devuelve en las respuestas) |
| rol      | `paciente` (por defecto) o `admin`                   |

**Turno**

| Campo        | Detalle                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| paciente     | referencia al usuario que lo creó                                                                                          |
| especialidad | `clinica-medica`, `pediatria`, `cardiologia`, `dermatologia`, `ginecologia`, `traumatologia`, `oftalmologia`, `neurologia` |
| fecha        | fecha y hora en formato ISO 8601                                                                                           |
| estado       | `pendiente` (por defecto), `confirmado`, `cancelado`, `atendido`                                                           |

## Endpoints

| Método | Ruta                 | Acceso      | Descripción                                      |
| ------ | -------------------- | ----------- | ------------------------------------------------ |
| GET    | `/api/health`        | Público     | Estado del servidor                              |
| POST   | `/api/auth/registro` | Público     | Registra un usuario (siempre con rol `paciente`) |
| POST   | `/api/auth/login`    | Público     | Inicia sesión y devuelve un token JWT            |
| GET    | `/api/turnos`        | Autenticado | Lista turnos (paciente: los suyos, admin: todos) |
| GET    | `/api/turnos/:id`    | Autenticado | Obtiene un turno (dueño o admin)                 |
| POST   | `/api/turnos`        | Paciente    | Crea un turno                                    |
| PUT    | `/api/turnos/:id`    | Autenticado | Modifica un turno (dueño o admin)                |
| DELETE | `/api/turnos/:id`    | Solo admin  | Elimina un turno                                 |

### Autenticación

Las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene en `POST /api/auth/login` (o en el registro).

### Filtros en `GET /api/turnos`

| Parámetro         | Ejemplo                              |
| ----------------- | ------------------------------------ |
| `estado`          | `?estado=pendiente`                  |
| `especialidad`    | `?especialidad=cardiologia`          |
| `desde` / `hasta` | `?desde=2026-12-01&hasta=2026-12-31` |
| `pacienteId`      | `?pacienteId=<id>` (solo admin)      |

Los filtros se pueden combinar: `GET /api/turnos?estado=pendiente&especialidad=cardiologia`

### Ejemplos

**Registro**

```json
POST /api/auth/registro
{ "nombre": "Ana Pérez", "email": "ana@test.com", "password": "Clave1234" }
```

**Login**

```json
POST /api/auth/login
{ "email": "ana@test.com", "password": "Clave1234" }
```

**Crear turno**

```json
POST /api/turnos
{ "especialidad": "cardiologia", "fecha": "2026-12-15T10:00:00-03:00" }
```

**Modificar turno** (`especialidad` y `fecha` son obligatorias; `estado` es opcional)

```json
PUT /api/turnos/<id>
{ "especialidad": "cardiologia", "fecha": "2026-12-16T11:00:00-03:00", "estado": "confirmado" }
```

**Formato de las respuestas**

```json
{ "status": "success", "data": { "turno": { "...": "..." } } }
```

```json
{ "status": "error", "message": "La fecha del turno debe ser futura" }
```

## Reglas de negocio

- La fecha debe ser futura y coincidir con bloques de 30 minutos (10:00, 10:30, ...).
- Solo puede haber un turno activo por especialidad y horario.
- Un paciente no puede tener dos turnos activos a la misma hora.
- Estados: `pendiente` → `confirmado` → `atendido`; se puede pasar a `cancelado` desde `pendiente` o `confirmado`.
- `atendido` solo se puede marcar cuando la fecha del turno ya pasó.
- Los pacientes solo pueden cancelar sus turnos, con al menos 2 horas de anticipación.
- Solo se pueden modificar la fecha y la especialidad de turnos `pendientes`.
- Un paciente solo ve y modifica sus propios turnos.

## Roles

- **paciente:** todos los usuarios se registran con este rol. Crea turnos, ve y modifica los suyos, y puede cancelarlos.
- **admin:** ve todos los turnos, confirma, marca como atendidos y es el único que puede eliminar.

Por seguridad, el registro no permite elegir el rol. Para crear un administrador: registrar un usuario y cambiar su campo `rol` a `admin` directamente en la base de datos (MongoDB Atlas → _Browse Collections_ → `users`). Después hay que volver a iniciar sesión para obtener un token con el rol nuevo.

## Códigos de estado

| Código | Cuándo                                                          |
| ------ | --------------------------------------------------------------- |
| 200    | Operación exitosa (consultas, login, modificación, eliminación) |
| 201    | Recurso creado (registro, turno)                                |
| 400    | Datos inválidos o regla de negocio incumplida, ID mal formado   |
| 401    | Token ausente, inválido o vencido; credenciales incorrectas     |
| 403    | El usuario no tiene permiso para la acción                      |
| 404    | Turno o ruta inexistente                                        |
| 409    | Conflicto: email ya registrado u horario ocupado                |
| 500    | Error interno del servidor                                      |

## Pruebas con Thunder Client

- La colección está en `docs/api-turnos.json`. Para usarla: Thunder Client → _Collections_ → `⋯` → _Import_.
- Antes de ejecutarla, crear en la pestaña _Env_ las variables `baseUrl` (`http://localhost:3000`), `tokenAna`, `tokenLuis`, `tokenAdmin` y `turnoId`, y completar los tokens con los que devuelve el login de cada usuario.
- Las capturas de cada endpoint, incluidos los casos de error (400, 401, 404), están en `docs/capturas/`.
