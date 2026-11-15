# SPEC 01 — API simulada de Arcade Vault respaldada por JSON (arquitectura modular y limpia)

> **Status:** aprobado
> **Depends on:** Ninguna
> **Date:** 2026-11-14
> **Objective:** Crear un backend simulado con Route Handlers `/api/*` de Next.js, respaldado por archivos JSON y organizado en módulos por feature con arquitectura limpia, que sirva juegos, categorías, puntuaciones y autenticación para que las pantallas solo hagan peticiones HTTP.

---

## Por qué existe esta spec

Las plantillas de `references/templates/` usan datos y sesión en memoria. Para que las pantallas (SPEC 02) se comporten como contra un backend real, los datos viven en `data/*.json` y se exponen solo por HTTP. Cuando exista un backend real, solo se sustituyen los adaptadores de infraestructura (repositorios JSON → base de datos) y la URL base; dominio, casos de uso y pantallas no se tocan.

Esta spec también fija la **estructura de carpetas modular y las reglas de arquitectura limpia (principios SOLID)** que usará todo el proyecto, incluida la SPEC 02. Se separó de las pantallas para poder verificar la API con tests y `curl` antes de construir la UI.

---

## Scope

**In:**

- Estructura modular por feature con capas de arquitectura limpia (ver Data model › Estructura de carpetas).
- Módulos de backend: `games` (juegos y categorías), `scores` (puntuaciones) y `auth` (usuarios y sesión).
- Archivos JSON en `data/`: `games.json`, `categories.json`, `scores.json`, `users.json`.
- Route Handlers delgados en `app/api/**` que solo traducen HTTP ↔ casos de uso.
- Sesión con cookie `httpOnly`; credenciales validadas contra `users.json`.
- Gateways HTTP del lado cliente/servidor-de-páginas (puertos + adaptadores) y variable `API_BASE_URL` documentada en `.env.example`.
- Reglas de ESLint que hacen cumplir los límites de capas y de módulos.
- Tooling de pruebas unitarias: Vitest (entorno node) con tests de dominio, casos de uso (con repositorios en memoria), repositorios JSON, handlers y gateways.

**Out of scope (para futuras specs):**

- Pantallas, componentes y estilos (SPEC 02), incluida la capa `presentation` de cada módulo y el módulo `play`.
- Tests E2E con Playwright (spec futura).
- Contenedor de inyección de dependencias (se usa composición manual).
- Backend real, base de datos real, hash de contraseñas, verificación de correo, recuperación de contraseña, OAuth.
- Actualizar `best` y `plays` de `games.json` al guardar puntuaciones (son datos estáticos del catálogo).
- Despliegue en hosting serverless (la escritura en JSON requiere sistema de archivos persistente).
- Rate limiting, paginación, cacheo de respuestas.

---

## Data model

### Estructura de carpetas

Raíz del proyecto, sin `src/`; alias `@/*` apunta a la raíz.

```
app/
  api/**/route.ts            # adaptadores HTTP delgados (sin lógica de negocio)
modules/
  games/                     # igual para scores/ y auth/ (y play/ en la SPEC 02)
    domain/                  # entidades, reglas y errores puros (TypeScript sin frameworks)
    application/
      ports/                 # interfaces: repositorios (servidor) y gateways (cliente)
      use-cases/             # un archivo por caso de uso, clase con execute()
    infrastructure/
      server/                # adaptadores de servidor: repositorios JSON, cookies
      client/                # adaptadores HTTP: gateways que llaman a /api/*
    presentation/            # componentes y hooks React (SPEC 02)
    testing/                 # repositorios en memoria y fixtures para tests
    composition.server.ts    # composition root del backend (arma casos de uso)
    composition.client.ts    # composition root del frontend (arma gateways HTTP)
    index.ts                 # API pública isomórfica: tipos de dominio, componentes, hooks
    server.ts                # API pública solo servidor: re-exporta composition.server
shared/
  kernel/                    # errors.ts (AppError y subclases), clock.ts, id-generator.ts (interfaces)
  config/                    # env.ts (DATA_DIR, API_BASE_URL)
  infrastructure/            # json-store.ts, system-clock.ts, uuid-id-generator.ts,
                             # http/http-client.ts (cliente fetch), http/error-response.ts (AppError → Response)
data/                        # games.json, categories.json, scores.json, users.json
```

### Reglas de dependencia (las hace cumplir ESLint)

| Desde | Puede importar | No puede importar |
| --- | --- | --- |
| `domain` | `domain` propio, `shared/kernel` | `application`, `infrastructure`, `presentation`, `next`, `react`, `fs` |
| `application` | `domain` propio, `shared/kernel` | `infrastructure`, `presentation`, `next`, `react`, `fs` |
| `infrastructure` | `application`, `domain` propios, `shared/**` | `presentation`, `app` |
| `presentation` (SPEC 02) | `application`, `domain` y `composition.client` propios, `shared/kernel` | `infrastructure`, `composition.server` |
| `composition.*` | todo el módulo y `shared/**` | otros módulos salvo por su API pública |
| `app/api/**` | `server.ts` de módulos, `shared/infrastructure/http` | `domain`, `application`, `infrastructure` directamente |

- Entre módulos solo se importa por la API pública (`index.ts` o `server.ts`), nunca por rutas internas.
- Aristas permitidas entre módulos: `scores → games` (vía `server.ts`, para saber si un juego existe) y `play → auth` (vía `index.ts`, SPEC 02). Cualquier otra arista nueva requiere cambiar la spec.
- La orquestación entre módulos ocurre en `app/` (por ejemplo, el handler de `GET /api/games/[id]/scores` pide el usuario actual a `auth` y pasa solo su nombre a `scores`).
- Los archivos de `infrastructure/server` y `composition.server.ts` empiezan con `import "server-only"`.

### Principios SOLID aplicados

- **S:** un caso de uso por archivo; los handlers solo traducen HTTP.
- **O:** nuevas fuentes de datos se añaden como nuevos adaptadores de los puertos, sin editar casos de uso.
- **L:** `JsonXRepository` y `InMemoryXRepository` son intercambiables; sus tests comparten el mismo conjunto de pruebas de contrato.
- **I:** puertos pequeños y específicos (`GameRepository` y `CategoryRepository` separados).
- **D:** los casos de uso dependen de puertos (interfaces), nunca de `fs`, `fetch` ni `next/headers`; las implementaciones se inyectan por constructor desde `composition.server.ts`.

### Archivos JSON

```jsonc
// data/games.json — 8 juegos (contenido de GAMES en references/templates/data.jsx)
[
  { "id": "bloque-buster", "title": "BLOQUE BUSTER", "short": "…", "long": "…",
    "cat": "ARCADE",          // ARCADE | PUZZLE | SHOOTER | VERSUS
    "cover": "cover-bricks",  // clase CSS
    "color": "cyan",          // cyan | magenta | green | yellow
    "best": 28450, "plays": "12.4K" }
]

// data/categories.json
["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]

// data/scores.json — 12 filas semilla por juego; el rango NO se guarda, se calcula al leer
{ "bloque-buster": [ { "name": "PX_KAI", "score": 182340, "date": "14/03/2026" } ] }

// data/users.json — contraseñas en texto plano: solo válido para el mock
[ { "id": "u1", "username": "PX_KAI", "email": "px@vault.gg", "password": "vault123" } ]
```

Usuarios semilla de demostración: `PX_KAI` y `PLAYER1`, ambos con contraseña `vault123`.

### Endpoints

| Método y ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /api/games` | — | `200 Game[]` |
| `GET /api/games/[id]` | — | `200 Game` · `404` |
| `GET /api/categories` | — | `200 string[]` |
| `GET /api/games/[id]/scores?limit=N` | `limit` opcional | `200 { entries: ScoreEntry[], you: YourBest \| null }` · `404`. `entries` va ordenado desc con `rank` 1..n; `you` solo si hay sesión y el usuario tiene al menos una puntuación en ese juego |
| `POST /api/games/[id]/scores` | `{ name, score }` | `201 ScoreEntry` (con su `rank`) · `400` · `404`. Permite invitados |
| `POST /api/auth/login` | `{ username, password }` | `200 { user }` + cookie · `401` |
| `POST /api/auth/register` | `{ username, email, password }` | `201 { user }` + cookie · `400` · `409` usuario existente |
| `POST /api/auth/logout` | — | `204` y borra la cookie |
| `GET /api/auth/me` | — | `200 { user }` · `401` |

Todos los errores responden `{ "error": "mensaje en español" }`.

### Dominio, puertos y casos de uso

```ts
// modules/games/domain/game.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "green" | "yellow";
export interface Game { id: string; title: string; short: string; long: string;
  cat: GameCategory; cover: string; color: GameColor; best: number; plays: string }

// modules/scores/domain/score.ts   (reglas puras: rankScores, bestOf)
export interface StoredScore { name: string; score: number; date: string }          // "DD/MM/YYYY"
export interface ScoreEntry extends StoredScore { rank: number }
export interface YourBest { rank: number; score: number; date: string }

// modules/auth/domain/user.ts      (validaciones: username, email, password; toSessionUser)
export interface User { id: string; username: string; email: string; password: string }
export interface SessionUser { id: string; name: string }                           // name = username en MAYÚSCULAS

// shared/kernel/errors.ts
// AppError → NotFoundError | ValidationError | UnauthorizedError | ConflictError (mensaje en español)
// shared/kernel/clock.ts → interface Clock { today(): string }   // "DD/MM/YYYY"
// shared/kernel/id-generator.ts → interface IdGenerator { next(): string }
```

```ts
// Puertos de servidor (modules/*/application/ports)
interface GameRepository     { findAll(): Promise<Game[]>; findById(id: string): Promise<Game | null> }
interface CategoryRepository { findAll(): Promise<string[]> }
interface ScoreRepository    { listByGame(gameId: string): Promise<StoredScore[]>; add(gameId: string, s: StoredScore): Promise<void> }
interface GameCatalog        { exists(gameId: string): Promise<boolean> }          // scores; adaptado desde games/server.ts
interface UserRepository     { findById(id: string): Promise<User | null>; findByUsername(u: string): Promise<User | null>; add(u: User): Promise<void> }
interface SessionStore       { getUserId(): Promise<string | null>; start(userId: string): Promise<void>; end(): Promise<void> }

// Puertos de cliente (gateways HTTP, mismos módulos)
interface GamesGateway  { list(): Promise<Game[]>; get(id: string): Promise<Game>; categories(): Promise<string[]> }
interface ScoresGateway { list(gameId: string, limit?: number): Promise<{ entries: ScoreEntry[]; you: YourBest | null }>;
                          submit(gameId: string, input: { name: string; score: number }): Promise<ScoreEntry> }
interface AuthGateway   { me(): Promise<SessionUser | null>; login(u: string, p: string): Promise<SessionUser>;
                          register(u: string, e: string, p: string): Promise<SessionUser>; logout(): Promise<void> }
```

Casos de uso (clases con `execute()`, dependencias por constructor): `ListGames`, `GetGame`, `ListCategories` (games); `GetGameScores` (entrada: `gameId`, `limit?`, `playerName?`), `SubmitScore` (scores; usa `GameCatalog` y `Clock`); `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser` (auth; usan `UserRepository`, `SessionStore`, `IdGenerator`).

### Convenciones

- Los JSON se leen y escriben con `fs` en tiempo de ejecución (no con `import`), solo desde `shared/infrastructure/json-store.ts`, que usan los repositorios JSON. Las escrituras se serializan (una a la vez) y son atómicas (archivo temporal + rename).
- La carpeta de datos es `data/` por defecto y se puede sobrescribir con `DATA_DIR` (leída solo en `shared/config/env.ts`); los tests la usan para no ensuciar los JSON versionados.
- Los casos de uso lanzan errores de dominio (`AppError`); el único lugar que los traduce a HTTP es `shared/infrastructure/http/error-response.ts` (`NotFoundError`→404, `ValidationError`→400, `UnauthorizedError`→401, `ConflictError`→409, otro→500 genérico).
- Cada Route Handler tiene la forma: leer entrada → ejecutar un caso de uso obtenido de `server.ts` → responder; sin reglas de negocio.
- Quien consume la API lo hace solo mediante los gateways HTTP de `infrastructure/client`, que usan `shared/infrastructure/http/http-client.ts`: en servidor usa la base `API_BASE_URL` (por defecto `http://localhost:3000`); en cliente, rutas relativas. Los errores `{ error }` se convierten en `ApiError` con ese mensaje.
- Validaciones (en `domain`): `username` 3–10 caracteres `[A-Za-z0-9_]`, único sin distinguir mayúsculas; `password` mínimo 6; `email` con formato válido; `name` de puntuación 1–10 caracteres, se normaliza a mayúsculas; `score` entero ≥ 0.
- Cookie de sesión: `av_session`, `httpOnly`, `SameSite=Lax`, `path=/`; su valor es el `id` del usuario; implementada por `CookieSessionStore` (adaptador de `SessionStore`).
- Fechas de puntuaciones nuevas: `DD/MM/YYYY`, generadas con `Clock` en el servidor.
- Los tests viven junto al archivo que prueban (`*.test.ts`); los repositorios en memoria están en `modules/*/testing/`.

---

## Implementation plan

1. **Tooling y esqueleto.** Instalar Vitest (entorno node), `server-only` y `eslint-plugin-boundaries`; añadir el script `test`, `vitest.config.ts` con el alias `@/*` y un alias de `server-only` a un módulo vacío para los tests. Crear las carpetas `modules/{games,scores,auth}` (con sus subcarpetas vacías), `shared/{kernel,config,infrastructure}`. Configurar en `eslint.config.mjs` las reglas de la tabla de dependencias. Verificación: `npm run lint` y `npm run test` corren sin error; añadir temporalmente un import prohibido (p. ej. `domain` importando `fs`) hace fallar el lint y se revierte.
2. **Kernel, configuración y JSON store.** Crear `shared/kernel` (errores, `Clock`, `IdGenerator`), `shared/config/env.ts`, `shared/infrastructure/json-store.ts`, `system-clock.ts`, `uuid-id-generator.ts` y `http/error-response.ts`; crear `data/*.json` (`scores.json` generado una sola vez ejecutando el algoritmo `seededScores` de `data.jsx` con semilla `id.length * 23 + 7`, 12 filas; script temporal que no se commitea). Tests: lectura, escritura atómica, escrituras concurrentes sin corromper el archivo y mapeo de errores a códigos HTTP.
3. **Módulo `games` (backend).** `domain/game.ts`, puertos `GameRepository` y `CategoryRepository`, casos de uso `ListGames`, `GetGame`, `ListCategories`, adaptadores `JsonGameRepository` y `JsonCategoryRepository`, repositorios en memoria, `composition.server.ts`, `server.ts` y handlers `GET /api/games`, `/api/games/[id]`, `/api/categories`. Antes de empezar, leer `node_modules/next/dist/docs/` sobre Route Handlers con `cacheComponents`. Tests: casos de uso con repositorios en memoria, repositorios JSON con `DATA_DIR` temporal y handlers (8 juegos, 404 con id inexistente).
4. **Módulo `scores` (lectura).** `domain/score.ts` (`rankScores`, `bestOf`), puertos `ScoreRepository` y `GameCatalog`, caso de uso `GetGameScores`, `JsonScoreRepository`, adaptador `GamesModuleCatalog` (usa `@/modules/games/server`), `composition.server.ts`, `server.ts` y handler `GET /api/games/[id]/scores` (sin `you`). Tests: orden descendente y rangos 1..n, `limit` respetado, 404 con juego inexistente.
5. **Módulo `auth` (backend).** `domain/user.ts` (validaciones), puertos `UserRepository` y `SessionStore`, casos de uso `RegisterUser`, `LoginUser`, `LogoutUser`, `GetCurrentUser`, `JsonUserRepository`, `CookieSessionStore` (con `next/headers`), `composition.server.ts`, `server.ts` y handlers `POST /api/auth/login`, `/register`, `/logout` y `GET /api/auth/me`. Tests: login correcto e incorrecto, registro duplicado (409), validaciones (400), `me` con y sin cookie; la respuesta nunca incluye `password`.
6. **Módulo `scores` (escritura y `you`).** Caso de uso `SubmitScore`, `JsonScoreRepository.add`, handler `POST /api/games/[id]/scores` (invitados permitidos) y `you` en el GET: el handler obtiene el usuario actual desde `@/modules/auth/server` y pasa solo `playerName` a `GetGameScores`. Tests: la puntuación nueva aparece en el GET con su rango correcto, entradas inválidas dan 400, `you` es `null` sin sesión, dos POST simultáneos conservan ambas entradas.
7. **Gateways HTTP del cliente.** `shared/infrastructure/http/http-client.ts` (base de servidor/cliente, `ApiError`), puertos `GamesGateway`, `ScoresGateway`, `AuthGateway` (en `application/ports`), adaptadores `HttpGamesGateway`, `HttpScoresGateway`, `HttpAuthGateway` (en `infrastructure/client`), `composition.client.ts` de cada módulo y `.env.example`. Tests con `fetch` simulado: URLs y métodos correctos, errores convertidos en `ApiError` con el mensaje de la API.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores ni errores de tipos.
- [ ] `npm run lint` termina sin errores e incluye las reglas de límites de capas y de módulos.
- [ ] Un import prohibido (p. ej. `domain` → `infrastructure`, o un módulo importando la ruta interna de otro) hace fallar `npm run lint`.
- [ ] `npm run test` pasa todos los tests.
- [ ] Existen `modules/games`, `modules/scores` y `modules/auth`, cada uno con `domain/`, `application/{ports,use-cases}/`, `infrastructure/{server,client}/`, `testing/`, `composition.server.ts`, `composition.client.ts`, `index.ts` y `server.ts`.
- [ ] Ningún archivo de `domain/` ni `application/` importa `next`, `react`, `fs` ni `fetch`; los casos de uso se prueban solo con repositorios en memoria.
- [ ] Cada Route Handler de `app/api/**` importa solo `server.ts` de módulos y `shared/infrastructure/http`; ninguno contiene reglas de negocio.
- [ ] Solo `shared/infrastructure/json-store.ts` lee o escribe `data/*.json`, y `DATA_DIR` solo se lee en `shared/config/env.ts`.
- [ ] Los repositorios JSON y los en memoria pasan el mismo conjunto de pruebas de contrato.
- [ ] Existen `data/games.json`, `data/categories.json`, `data/scores.json` y `data/users.json`.
- [ ] `GET /api/games` devuelve 8 juegos con ids únicos y `GET /api/categories` devuelve 5 categorías.
- [ ] `GET /api/games/xyz` y `GET /api/games/xyz/scores` devuelven 404 con `{ "error": … }`.
- [ ] `GET /api/games/bloque-buster/scores` devuelve 12 entradas ordenadas de mayor a menor con `rank` 1..12; con `?limit=10` devuelve 10.
- [ ] `POST /api/auth/login` con `PX_KAI` / `vault123` devuelve 200 y una cookie `av_session` con atributo `HttpOnly`; con contraseña incorrecta devuelve 401.
- [ ] `POST /api/auth/register` con un usuario nuevo válido devuelve 201, añade el usuario a `users.json` y establece la cookie; repetirlo con otra capitalización devuelve 409; datos inválidos devuelven 400.
- [ ] `GET /api/auth/me` devuelve 200 con la cookie y 401 sin ella; `POST /api/auth/logout` devuelve 204 y borra la cookie.
- [ ] `POST /api/games/bloque-buster/scores` con `{ name: "ana", score: 999999 }` devuelve 201 con `name: "ANA"` y `rank: 1`, y la entrada aparece en `scores.json` y en el GET posterior.
- [ ] `POST` de puntuación con `score` negativo, decimal o con `name` vacío devuelve 400.
- [ ] `you` es `null` sin sesión y, con sesión y una puntuación guardada con ese nombre, devuelve su mejor marca y rango.
- [ ] Dos `POST` de puntuación simultáneos conservan ambas entradas.
- [ ] Un error inesperado devuelve 500 con mensaje genérico, sin detalles internos.
- [ ] Los gateways HTTP solicitan las URLs y métodos de la tabla de endpoints y convierten `{ error }` en `ApiError`.
- [ ] Los tests no modifican los archivos de `data/` versionados.
- [ ] Ninguna respuesta de la API incluye el campo `password`.

---

## Decisions

- **Sí:** JSON como backend simulado detrás de Route Handlers `/api/*` (decisión del usuario). **No:** importar los JSON directamente en componentes ni usar Server Actions: no simulan un backend externo.
- **Sí:** dividir el MVP en esta spec (API) y SPEC 02 (pantallas), decisión del usuario, para verificar la API de forma aislada.
- **Sí:** módulos por feature, cada uno con capas `domain / application / infrastructure / presentation` (decisión del usuario). **No:** capas globales en la raíz; mezclan features y bajan la cohesión.
- **Sí:** arquitectura limpia en backend y frontend (decisión del usuario): puertos como interfaces, adaptadores intercambiables y casos de uso en el servidor; gateways como puertos en el cliente.
- **Sí:** composition root manual por módulo con inyección por constructor (decisión del usuario). **No:** contenedor DI (`tsyringe`/`inversify`): ceremonia y dependencias de más para un MVP.
- **Sí:** límites de capas verificados por ESLint (decisión del usuario), con `eslint-plugin-boundaries`. **No:** solo convención; se degrada sin que nadie lo note.
- **Sí:** los módulos solo se conocen por `index.ts` / `server.ts`, con las aristas `scores → games` y `play → auth`. La orquestación entre módulos va en `app/`.
- **Sí:** `scores` define su propio puerto `GameCatalog` en vez de importar el repositorio de `games`. Mantiene el dominio de `scores` aislado.
- **Sí:** errores de dominio traducidos a HTTP en un único lugar (`error-response.ts`). Los casos de uso no conocen códigos de estado.
- **Sí:** `Clock` e `IdGenerator` como puertos del kernel. Hacen deterministas los tests de fechas e ids.
- **Sí:** repositorios en memoria en `testing/` y pruebas de contrato compartidas. Los casos de uso se prueban sin disco.
- **Sí:** login validado contra `users.json` con cookie `httpOnly`. **No:** aceptar cualquier credencial como en la plantilla.
- **Sí:** el valor de la cookie es el `id` del usuario, sin firmar. Suficiente para un mock; un backend real debe usar sesiones firmadas o JWT.
- **Sí:** contraseñas en texto plano en `users.json`. Solo para el mock; el hash va con el backend real.
- **Sí:** escribir en los JSON (puntuaciones y registros). **No:** memoria del servidor ni `localStorage`: los datos sobreviven a reinicios y el ranking refleja lo jugado.
- **Sí:** el rango no se guarda en `scores.json` y se calcula al leer (regla de dominio), para no reescribir rangos al insertar.
- **Sí:** scores semilla precalculados con el algoritmo de la plantilla; **No:** portar `seededScores` al código de la app.
- **Sí:** `DATA_DIR` para aislar datos en tests.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Sobreingeniería para un MVP (demasiadas capas y archivos). | Un archivo por caso de uso, sin clases base ni genéricos; solo los puertos listados; no se añaden abstracciones fuera de la spec. |
| `eslint-plugin-boundaries` puede no ser compatible con ESLint 9 flat config o `eslint-config-next` 16. | Probarlo en el paso 1; si falla, usar `no-restricted-imports` por glob y rutas explícitas por módulo. |
| `import "server-only"` lanza error al correr tests de servidor en Vitest. | Alias de `server-only` a un módulo vacío en `vitest.config.ts` (paso 1). |
| `cacheComponents: true` cambia la semántica de Route Handlers y `fetch` en Next 16. | Leer `node_modules/next/dist/docs/` antes del paso 3; marcar los handlers como dinámicos donde corresponda. |
| Escrituras concurrentes a un mismo JSON corrompen datos. | Cola de escrituras y escritura atómica en `json-store.ts`, con test de concurrencia. |
| Escribir en `data/` durante el desarrollo ensucia git. | Leer con `fs` (no `import`) para evitar HMR; `DATA_DIR` aislado en tests; aceptar que los datos de desarrollo cambian. |
| Cookie sin firmar y contraseñas en texto plano. | Documentado como solo-mock; endurecerlo queda fuera de alcance. |
| Un usuario registrado con el nombre de un jugador semilla heredaría su marca en `you`. | `username` único contra `users.json`; los usuarios semilla coinciden con jugadores semilla solo por diseño (`PX_KAI`); aceptado en el MVP. |
| Páginas de servidor que se llaman a sí mismas por HTTP no funcionan en `next build` (servidor apagado). | La SPEC 02 no prerenderiza contenido dependiente de la API; aquí se documenta `API_BASE_URL`. |

---

## What is **not** in this spec

- Pantallas, estilos, `presentation/` de los módulos ni el módulo `play` (SPEC 02).
- Tests E2E con Playwright (spec futura).
- Contenedor de inyección de dependencias.
- Backend o base de datos reales, hash de contraseñas, recuperación de cuenta, OAuth.
- Actualizar `best` / `plays` del catálogo con las puntuaciones guardadas.
- Despliegue serverless, rate limiting, paginación.

Cada uno de esos puntos, si se aborda, va en su propia spec.
