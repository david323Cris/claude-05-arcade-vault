# SPEC 02 — Pantallas del MVP de Arcade Vault

> **Status:** aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-11-14
> **Objective:** Portar a Next.js (App Router, TypeScript) las 5 pantallas de `references/templates/` — Biblioteca, Detalle, Reproductor, Auth y Salón de la Fama — organizadas en la capa `presentation` de los módulos de la SPEC 01 y consumiendo la API simulada solo a través de gateways, sin implementar ningún juego real.

---

## Por qué existe esta spec

El diseño ya existe como prototipo en `references/templates/` (React 18 UMD + Babel, estado de ruta por hash). Esta spec lo convierte en la interfaz real sobre Next 16 / React 19 respetando la arquitectura de la SPEC 01: los componentes viven en `modules/*/presentation`, no conocen los JSON ni `fetch`, y dependen de gateways (puertos) cuya implementación HTTP se inyecta desde `composition.client.ts`. La UI se diseña según la plantilla; la skill `/frontend-design` se usa solo para ajustes de fidelidad o responsive, no para rediseñar.

---

## Scope

**In:**

- Rutas de páginas (App Router): `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`; las páginas solo componen módulos.
- Capa `presentation` de `games`, `scores` y `auth`, y el nuevo módulo `play` (Reproductor) con la estructura de la SPEC 01.
- App shell en `app/_components/`: `Nav` (con menú móvil) y footer.
- Estilos de `references/templates/styles.css` portados a `app/globals.css` conservando clases y variables CSS (`--pixel`, `--mono`, `--cyan`, etc.).
- Provider de sesión en cliente apoyado en `AuthGateway`.
- Estados de carga, error (con reintento) y 404 (juego inexistente).
- Reglas de dominio puras del frontend: `filterGames`, `buildPodium` y el estado de la partida simulada (`play-session`).
- Reproductor "como la plantilla": HUD, marco CRT con arena decorativa, puntaje simulado por timer, pausa, fin de partida y modal que guarda la puntuación vía API.
- Responsive (desktop y móvil) según la plantilla.
- Tests unitarios y de componentes con Vitest + Testing Library.

**Out of scope (para futuras specs):**

- Cualquier juego real jugable (Bloque Buster, Caída, etc.).
- Cambios en la API, los JSON, los casos de uso o los repositorios del servidor (SPEC 01).
- Tests E2E con Playwright (se implementarán en una spec posterior; no se instala ni configura en esta).
- Sistema real de créditos (el contador "CRÉDITOS · 03" es decorativo).
- Sonido, multijugador, modo táctil real, i18n, SEO avanzado.
- Rediseñar el look & feel respecto a la plantilla.

---

## Data model

Esta spec no introduce estructuras de datos persistentes; reutiliza los tipos de dominio y los gateways de la SPEC 01 (`Game`, `ScoreEntry`, `YourBest`, `SessionUser`, `GamesGateway`, `ScoresGateway`, `AuthGateway`).

### Estructura nueva o ampliada

```
app/
  _components/nav.tsx, footer.tsx        # app shell; puede importar auth/index.ts
  page.tsx                               # Biblioteca
  juegos/[id]/page.tsx                   # Detalle
  juegos/[id]/jugar/page.tsx             # Reproductor
  auth/page.tsx
  salon/page.tsx
modules/
  games/
    domain/filter-games.ts               # filterGames(games, query, category)
    presentation/                        # LibraryView, GameCard, GameDetailView
  scores/
    domain/build-podium.ts               # buildPodium(entries) → { gold, silver, bronze }
    presentation/                        # Leaderboard, HallOfFameView
  auth/
    presentation/                        # SessionProvider, useSession, AuthForm
  play/                                  # módulo nuevo (domain, application, infrastructure, presentation, composition.client.ts, index.ts)
    domain/play-session.ts               # estado y transiciones de la partida simulada
    application/ports/score-submitter.ts # interface ScoreSubmitter { submit(gameId, {name, score}): Promise<void> }
    infrastructure/client/http-score-submitter.ts  # adaptador HTTP propio (no importa scores)
    presentation/                        # PlayerScreen, Hud, CrtFrame, GameOverModal
```

```ts
// modules/play/domain/play-session.ts — funciones puras
interface PlaySession { score: number; lives: number; level: number; paused: boolean; over: boolean }
// newSession(), tick(s, points), togglePause(s), end(s); regla de nivel: sube cuando score % 2500 < 100 (igual que la plantilla)

// modules/auth/presentation/session-provider.tsx
interface SessionContext {
  user: SessionUser | null;
  loading: boolean;                                     // true hasta resolver AuthGateway.me()
  login(username: string, password: string): Promise<void>;                // lanza ApiError con el mensaje de la API
  register(username: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
```

### Convenciones

- Se cumplen las reglas de dependencia de la SPEC 01. Aristas entre módulos: `play → auth` (`useSession`, vía `index.ts`); ninguna más. `scores`, `games` y `auth` no se importan entre sí.
- Las páginas de `app/` obtienen datos con los gateways (`composition.client.ts` ejecutado en servidor, con `API_BASE_URL`) y pasan **datos serializables** a los componentes de cada módulo; la composición entre módulos ocurre en la página (p. ej. el Detalle pasa `<Leaderboard>` como `children` de `GameDetailView`; el Salón recibe la lista `{ id, title }` de juegos como props).
- Los componentes cliente que necesitan datos propios (sesión, Salón al cambiar de pestaña, guardado de puntuación) crean su gateway con `composition.client.ts` dentro del cliente: las clases no se pasan como props desde el servidor.
- `presentation` puede importar `composition.client.ts` de su propio módulo (compromiso pragmático); en tests se sustituye con `vi.mock`.
- El filtro de la Biblioteca se aplica en el cliente con `filterGames` sobre la lista ya obtenida.
- Puntuaciones formateadas con `toLocaleString("es-ES")`.
- El Nav inicia en estado "sin sesión" y se actualiza tras `AuthGateway.me()` para evitar desajuste de hidratación.
- No se usa `localStorage` para sesión ni puntuaciones.

---

## Implementation plan

1. **Tooling de pruebas de UI.** Instalar `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` y `jsdom` (Vitest ya viene de la SPEC 01) y configurar el entorno `jsdom` solo para los tests de componentes (`*.test.tsx`); los de la SPEC 01 siguen en node. Verificación: `npm run test` sigue pasando los tests de la SPEC 01.
2. **Estilos globales.** Portar `references/templates/styles.css` a `app/globals.css` (junto a las directivas de Tailwind existentes), mapeando `--pixel` y `--mono` a `--font-press-start` y `--font-jetbrains-mono` de `next/font`. Verificación: `npm run dev` y la home sigue cargando con fondo y fuentes.
3. **Sesión (`auth/presentation`).** `SessionProvider`, `useSession` y export en `modules/auth/index.ts`, apoyados en `AuthGateway`. Tests: estado inicial sin sesión, `login` actualiza `user`, un `ApiError` 401 se expone como error.
4. **App shell.** Añadir al `app/layout.tsx` existente (sin rehacerlo) el `SessionProvider`, `app/_components/nav.tsx` (enlaces, contador de créditos, botón de sesión, panel móvil con backdrop), `<main className="av-main">` y `footer.tsx`. Verificación: Nav visible en todas las rutas con el enlace activo correcto.
5. **Biblioteca (`/`).** `games/domain/filter-games.ts` con tests; `LibraryView` y `GameCard` en `games/presentation`; `app/page.tsx` reemplaza el scaffold: obtiene juegos y categorías con los gateways y los pasa al componente (hero, búsqueda, chips, grilla, "NO HAY RESULTADOS", error con reintento) dentro de `Suspense`. Tests: filtrar por texto y por categoría.
6. **Detalle (`/juegos/[id]`).** `GameDetailView` en `games/presentation` y `Leaderboard` en `scores/presentation`; la página obtiene el juego y 10 puntuaciones y compone ambos; portada, tags, descripción, stat strip, botones "JUGAR AHORA" y "VOLVER AL VAULT". `notFound()` si el gateway responde 404.
7. **Auth (`/auth`).** `AuthForm` en `auth/presentation`: pestañas INICIAR SESIÓN / CREAR CUENTA (correo solo en registro), usa `useSession`, muestra el mensaje de error de la API (401/400/409) y, con éxito, redirige a `/`. Tests: ambas pestañas, error de credenciales, éxito.
8. **Salón de la Fama (`/salon`).** `scores/domain/build-podium.ts` con tests; `HallOfFameView` en `scores/presentation` con pestañas por juego (la página le pasa los juegos); cada pestaña pide `ScoresGateway.list(id, 12)` con estados de carga y error, podio top 3, tabla con animación escalonada, bloque "TU MEJOR MARCA" con `you` (o "AÚN SIN MARCA" si hay sesión pero `you` es `null`) y botón de volver. Test: cambiar de pestaña dispara la petición y cambia las filas.
9. **Reproductor (`/juegos/[id]/jugar`).** Módulo `play`: `play-session.ts` con tests unitarios, puerto `ScoreSubmitter` y `HttpScoreSubmitter`, `PlayerScreen`, `Hud`, `CrtFrame` y `GameOverModal`; HUD (jugador desde `useSession` o `INVITADO`, puntuación, vidas, nivel), marco CRT con arena decorativa, puntaje simulado cada 220 ms, pausa/reanudar, FIN, SALIR y modal de fin con estados guardando / guardada / error con reintento. `notFound()` si el juego no existe. Tests: pausa detiene el puntaje, FIN abre el modal, guardar llama a `ScoreSubmitter` con `{ name, score }`.
10. **Ajuste visual y responsive.** Comparar cada pantalla contra `references/templates/` en desktop y móvil; corregir diferencias (aquí se puede apoyar en `/frontend-design`). Metadatos `title` por ruta. Verificación manual con `npm run dev` del flujo completo: Biblioteca → Detalle → Jugar → Fin → guardar → Salón, y login/registro.

---

## Acceptance criteria

- [x] `npm run build` termina sin errores ni errores de tipos.
- [x] `npm run lint` termina sin errores, incluidas las reglas de límites de la SPEC 01.
- [x] `npm run test` (Vitest) pasa todos los tests, incluidos los de la SPEC 01.
- [x] Hay tests de dominio para `filterGames`, `buildPodium` y `play-session`.
- [x] Hay tests de componente para: provider de sesión, Biblioteca, formulario de Auth, pestañas del Salón y Reproductor (pausa, fin y guardado).
- [x] No hay dependencia, config ni script de Playwright en el proyecto.
- [x] Existen las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth` y `/salon`, y cada una renderiza la pantalla equivalente de la plantilla.
- [x] Los componentes viven en `modules/*/presentation` o `app/_components`; `app/**/page.tsx` solo compone módulos y no contiene lógica de negocio ni estado de UI propio.
- [x] Ningún archivo de `presentation/` ni `app/` importa `infrastructure`, archivos `.json` o `fs`; los datos llegan solo por gateways.
- [x] El módulo `play` no importa `scores`; la única arista entre módulos nueva es `play → auth`.
- [x] `/juegos/xyz` y `/juegos/xyz/jugar` muestran 404.
- [x] La Biblioteca muestra 8 juegos; escribir "caí" deja 1 y una combinación sin coincidencias muestra "NO HAY RESULTADOS".
- [x] Si la API de juegos falla, la Biblioteca muestra un mensaje de error con botón de reintento (no pantalla en blanco).
- [x] Hacer clic en una tarjeta navega a `/juegos/<id>` y "JUGAR AHORA" navega a `/juegos/<id>/jugar`.
- [x] El Detalle muestra 10 filas de leaderboard ordenadas de mayor a menor, con rangos `#01`…`#10`.
- [x] El Salón muestra podio, 12 filas y una pestaña por cada uno de los 8 juegos; cambiar de pestaña hace una petición nueva.
- [x] Iniciar sesión con `PX_KAI` / `vault123` redirige a `/` y el Nav muestra `PX_KAI`; con contraseña incorrecta se muestra el error de la API y no se redirige.
- [x] Registrar un usuario nuevo inicia sesión; repetir el mismo usuario muestra el error de conflicto.
- [x] La sesión persiste al recargar la página y "cerrar sesión" vuelve a mostrar "Iniciar Sesión" en el Nav.
- [x] Sin sesión, el Reproductor muestra jugador `INVITADO` y permite guardar puntuación; con sesión, muestra el nombre del usuario.
- [x] En el Reproductor la puntuación crece sola; con PAUSA deja de crecer y aparece "EN PAUSA"; REANUDAR la retoma.
- [x] FIN abre el modal con la puntuación final; GUARDAR PUNTUACIÓN llama a la API y muestra "PUNTUACIÓN GUARDADA"; JUGAR DE NUEVO reinicia a 0 puntos, 3 vidas, nivel 01.
- [x] Si el guardado falla, el modal muestra un error y permite reintentar sin perder la puntuación.
- [x] Una puntuación guardada aparece en el Detalle y en el Salón del mismo juego con el rango correcto.
- [x] Los tests no modifican los archivos de `data/` versionados (los tests de componente simulan los gateways).
- [x] En ancho de 375 px no hay scroll horizontal, la hamburguesa abre y cierra el panel móvil y el Nav de escritorio no se muestra.
- [x] La consola del navegador no muestra errores de hidratación en ninguna ruta.
- [x] No existe ningún código de juego real (solo la arena decorativa).

---

## Decisions

- **Sí:** rutas reales de App Router en lugar del SPA con hash de la plantilla. URLs compartibles y encaja con Next.
- **Sí:** la UI vive en `modules/*/presentation` (arquitectura limpia en el frontend, decisión del usuario). **No:** una carpeta `components/` global: mezcla features y rompe los límites de módulo.
- **Sí:** la lógica no visual (`filterGames`, `buildPodium`, `play-session`) va en `domain` como funciones puras testeables sin React.
- **Sí:** módulo `play` separado con su propio puerto `ScoreSubmitter`, aunque duplica la llamada HTTP de `scores`. Evita acoplar `play` a `scores`; se acepta la duplicación a cambio de límites limpios.
- **Sí:** `Nav` y footer en `app/_components`, porque son shell de la aplicación y necesitan `auth`; los módulos no pueden depender de `app/`.
- **Sí:** las páginas componen módulos y pasan datos serializables; **No:** que un módulo importe a otro para armar una pantalla (p. ej. `games` importando `scores`).
- **Sí:** `presentation` puede importar `composition.client.ts` de su módulo (compromiso pragmático: las clases no se pueden pasar como props desde servidor). **No:** un contexto de inyección global de gateways por ahora.
- **Sí:** portar `styles.css` tal cual a `app/globals.css`. Máxima fidelidad y rapidez. **No:** reescribir en Tailwind v4: más trabajo y riesgo de desviarse del diseño.
- **Sí:** mantener `app/layout.tsx` y su carga de fuentes con `next/font/google` ya existente; solo se añaden provider, Nav y footer.
- **Sí:** sesión opcional; se puede jugar como `INVITADO`, igual que la plantilla. **No:** exigir login para jugar.
- **Sí:** filtro de la Biblioteca en el cliente. **No:** una petición por pulsación de tecla.
- **Sí:** el Salón pide los datos desde el cliente al cambiar de pestaña para reutilizar la cookie de sesión y obtener `you` sin reenviar cabeceras desde el servidor.
- **Sí:** el Reproductor conserva el puntaje simulado de la plantilla para ver el flujo completo HUD → fin → guardado.
- **Sí:** Vitest + Testing Library para tests unitarios y de componente (decisión del usuario).
- **No:** Playwright / E2E por ahora; el usuario lo implementará más adelante en otra spec.
- **Sí:** mostrar errores de la API tal cual en los formularios (es la UI la que decide la presentación, no la API).

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents: true` y `partialPrefetching: true` cambian la semántica de `fetch` y `params` asíncronos en Next 16. | Leer `node_modules/next/dist/docs/` antes del paso 5; renderizar las páginas dependientes de la API dentro de `Suspense`. |
| Las páginas de servidor llaman a la API por HTTP; en `next build` el servidor no está levantado. | No prerenderizar contenido que dependa de la API (dinámico bajo `Suspense`); `API_BASE_URL` configurable. |
| Componentes de servidor no pueden pasar instancias de clases (gateways) a componentes cliente. | Los componentes cliente crean sus gateways con `composition.client.ts`; por props solo viajan datos serializables. |
| Las reglas de límites pueden resultar demasiado estrictas con componentes que combinan varias features. | Resolver componiendo en `app/` (páginas); si aparece una arista nueva, cambiar la spec antes que relajar la regla. |
| Desajuste de hidratación al mostrar el estado de sesión en el Nav. | Renderizar "sin sesión" en el primer render y actualizar tras `AuthGateway.me()`. |
| Portar 950 líneas de CSS global puede chocar con los resets de Tailwind v4 o el `globals.css` actual. | Revisar el orden de capas en el paso 2 y comparar visualmente la home antes de continuar. |
| El intervalo del Reproductor puede dejar timers vivos al desmontar. | Limpiar en el `return` del efecto; cubierto por tests de pausa/fin. |
| Sin E2E, los flujos entre pantallas solo se verifican manualmente. | Checklist manual en el paso 10; los flujos E2E quedan para la spec de Playwright. |

---

## What is **not** in this spec

- Ningún juego real jugable.
- Cambios en la API, los JSON, los casos de uso o la persistencia (SPEC 01).
- Tests E2E con Playwright.
- Créditos funcionales, sonido, multijugador, i18n.
- Rediseño del look & feel de la plantilla.

Cada uno de esos puntos, si se aborda, va en su propia spec.
