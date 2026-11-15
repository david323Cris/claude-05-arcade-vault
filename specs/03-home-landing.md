# SPEC 03 — Home (landing) de Arcade Vault

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-14
> **Objective:** Implementar la home de `references/templates/home-about/home.jsx` (con el Nav de `nav.jsx`) como nueva página de entrada en `/`, poner las rutas en inglés, mover la Biblioteca a `/games` y actualizar Nav, enlaces internos y estilos para que ambas convivan sin regresiones.

---

## Por qué existe esta spec

La SPEC 02 dejó la Biblioteca en `/`. La plantilla nueva (`references/templates/home-about/`) añade una landing con hero, características, vista previa de juegos, estadísticas, actividad, precios y CTA final, y separa "Inicio" de "Biblioteca" en el Nav. Esta spec porta solo la home; hace de `/` la entrada del sitio y reubica la Biblioteca en `/games`. La UI sigue la plantilla; `/frontend-design` se usa solo para ajustes de fidelidad/responsive, no para rediseñar.

---

## Scope

**In:**

- Nueva home en `/` con las secciones de la plantilla: hero (siluetas flotantes, título, CTAs, "DESLIZA"), "¿POR QUÉ ARCADE VAULT?" (4 tarjetas con icono), "JUEGOS DISPONIBLES AHORA" (6 mini-tarjetas), estadísticas, "ACTIVIDAD EN VIVO" (últimas puntuaciones + top de hoy), "PRECIOS" (plan único + FAQ) y CTA final.
- Animación de aparición al hacer scroll (`.reveal` → `.in` con `IntersectionObserver`).
- **Rutas en inglés** (decisión del usuario), sin redirecciones desde las viejas: `/juegos` → `/games`, `/juegos/[id]` → `/games/[id]`, `/juegos/[id]/jugar` → `/games/[id]/play`, `/salon` → `/hall-of-fame`; `/auth` y `/` no cambian. Se renombran los directorios `app/juegos` → `app/games` y `app/salon` → `app/hall-of-fame`.
- Mover la Biblioteca de `/` a `/games` (nueva `app/games/page.tsx`) conservando su comportamiento.
- Nav (escritorio y panel móvil) según `references/templates/home-about/nav.jsx`: añadir "Inicio" (`/`) y apuntar "Biblioteca" a `/games`; lógica de enlace activo equivalente a `isActive` de la plantilla (Biblioteca activa también en Detalle y Reproductor). Se mantiene el resto del Nav tal cual (logo, contador de créditos, botón de sesión, hamburguesa, panel móvil con backdrop). **Única desviación de la plantilla:** se omite el enlace "Acerca de" (ver Out of scope).
- Actualizar enlaces y redirecciones internas que apuntaban a la Biblioteca en `/` (ver Convenciones).
- Portar a `app/globals.css` solo las reglas nuevas/modificadas de `references/templates/home-about/styles.css` necesarias para la home (diff contra el CSS actual).
- Las mini-tarjetas muestran los 6 primeros juegos reales vía `GamesGateway`, y navegan a `/games/<id>`.
- Metadatos `title` de `/` y `/games`.
- Tests unitarios y de componente (Vitest + Testing Library) para lo nuevo y para los cambios de ruta.

**Out of scope (para futuras specs):**

- Página "Acerca de" y formulario de contacto (`about.jsx`); el Nav **no** muestra "Acerca de".
- Cambios en la API, los JSON, casos de uso o gateways (SPEC 01).
- Datos reales para "Últimas puntuaciones", "Top jugadores · hoy" y las estadísticas (son contenido estático decorativo).
- Funcionalidad real de precios o créditos (el plan "$0" es informativo; el contador de créditos sigue siendo decorativo).
- Tests E2E con Playwright.
- Rediseñar el look & feel de la plantilla; cambiar estilos de las pantallas existentes.

---

## Data model

Esta spec no introduce datos persistentes ni cambios en los tipos de la SPEC 01; reutiliza `Game` y `GamesGateway`.

### Estructura nueva o ampliada

```
app/
  page.tsx                          # Home (reemplaza a la Biblioteca)
  games/page.tsx                    # Biblioteca (movida desde app/page.tsx)
  games/[id]/page.tsx               # Detalle (antes app/juegos/[id])
  games/[id]/play/page.tsx          # Reproductor (antes app/juegos/[id]/jugar)
  hall-of-fame/page.tsx             # Salón de la Fama (antes app/salon)
  _components/
    home/
      home-view.tsx                 # "use client": secciones de la home; recibe { games, error }
      floating-silhouettes.tsx      # 8 SVG decorativos (s1..s8)
      feature-icon.tsx              # iconos GAMEPAD | FREE | TROPHY | ROCKET
      use-reveal.ts                 # hook IntersectionObserver
      home-content.ts               # constantes estáticas: features, stats, recentScores, topPlayers, faq, pricing
    nav.tsx                         # + "Inicio", Biblioteca → /games
```

```ts
// app/_components/home/home-content.ts — contenido estático (copiado de la plantilla)
type Tone = "cyan" | "magenta" | "yellow" | "green";
interface FeatureItem { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; tone: Tone }
interface StatItem { n: string; unit: string; sub: string }
interface RecentScore { player: string; game: string; score: number; when: string; tone: Tone }
interface TopPlayer { rank: number; player: string; score: number }

// home-view.tsx
interface HomeViewProps { games: Game[]; error: string | null }   // games: ya recortado a 6 o completo; la vista aplica slice(0, 6)
```

### Convenciones

- Se cumplen las reglas de la SPEC 01/02: `app/**/page.tsx` solo compone y obtiene datos por gateways; no importa `infrastructure`, JSON ni `fs`. La home vive en `app/_components/home/` y no importa otros módulos salvo por su API pública (`@/modules/games` para el tipo `Game`).
- La página `/` obtiene los juegos con `gamesGateway.list()` (de `composition.client`, ejecutado en servidor) dentro de `Suspense`; pasa datos serializables a `HomeView`. Si la API falla, el resto de la home se renderiza igual y la sección de mini-tarjetas muestra un mensaje de error con enlace a `/games` (sin pantalla en blanco).
- Navegación con `next/link` (`<Link>`) y no con `onClick` de estado de ruta de la plantilla:
  - "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" → `/games`.
  - "CREAR CUENTA" y "EMPEZAR GRATIS →" → `/auth`.
  - "VER SALÓN →" → `/hall-of-fame`.
  - Mini-tarjeta → `/games/<id>`.
- Enlaces internos que pasan de `/` a `/games` (apuntaban a la Biblioteca): "VOLVER AL VAULT" del Detalle, "VOLVER AL VAULT" del modal del Reproductor, "VOLVER A LA BIBLIOTECA" del Salón. La redirección tras login/registro exitoso del `AuthForm` va a `/games` (mantiene el comportamiento anterior: el usuario aterrizaba en la Biblioteca). El logo del Nav sigue apuntando a `/`.
- Enlace activo del Nav: `/` → "Inicio" (solo coincidencia exacta); `/games` y `/games/**` → "Biblioteca"; `/hall-of-fame` → "Salón de la Fama"; `/auth` → "Cuenta/Iniciar Sesión".
- Las marcas de tiempo y puntuaciones de "Actividad en vivo" son literales de la plantilla; las puntuaciones se formatean con `toLocaleString("es-ES")`. Los nombres de juego del contenido estático coinciden con los de `data/games.json` (a verificar al implementar).
- El hook `useReveal` solo activa las clases en cliente; sin JS o sin `IntersectionObserver` el contenido debe seguir visible (la regla `.reveal` oculta solo si la clase `in` puede añadirse; en caso contrario se añade `in` de inmediato).
- Estilos: se hace diff de `references/templates/home-about/styles.css` contra `app/globals.css` y se portan solo reglas nuevas o modificadas relevantes para la home (`home-*`, `.reveal`, `.silo`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.ticker`, `.top-*`, `.pricing-*`, `.price-card`, `.faq-*`, `.final-*`, y utilidades como `.btn.xl`, `.pulse`, `.blink`, `.neon-*` si faltan). Las reglas exclusivas de About/contacto no se portan.

---

## Implementation plan

1. **Rutas en inglés y reubicar la Biblioteca.** Renombrar `app/juegos` → `app/games` (con `[id]/jugar` → `[id]/play`) y `app/salon` → `app/hall-of-fame`, y actualizar todo enlace, `startsWith`, redirección y test que use las rutas viejas (`grep` de `juegos`, `jugar`, `salon` en `app/` y `modules/`). Luego mover el contenido actual de `app/page.tsx` a `app/games/page.tsx` (metadata "Biblioteca · Arcade Vault" intacta) y dejar en `app/page.tsx` un placeholder temporal. Actualizar los enlaces de "volver" (Detalle, modal del Reproductor, Salón), la redirección del `AuthForm` y los tests asociados (`game-detail-view.test.tsx`, `hall-of-fame-view.test.tsx`, `auth-form.test.tsx`) a `/games`. Verificación: `npm run test` pasa; `/games` muestra la Biblioteca y el flujo Detalle → volver vuelve a `/games`.
2. **Nav.** Alinear `app/_components/nav.tsx` con `references/templates/home-about/nav.jsx`: añadir "Inicio" (`/`) en escritorio y panel móvil, apuntar "Biblioteca" a `/games` y actualizar `sectionOf` con coincidencia exacta para `/`; omitir "Acerca de". Verificación: enlace activo correcto en `/`, `/games`, `/games/<id>`, `/hall-of-fame`, `/auth`.
3. **Estilos.** Diff de `references/templates/home-about/styles.css` contra `app/globals.css`; portar solo las reglas de la home (ver Convenciones) respetando variables `--pixel`/`--mono` y el orden de capas existente. Verificación: `npm run dev`, las 5 pantallas existentes se ven igual que antes.
4. **Piezas de la home.** Crear `home-content.ts`, `floating-silhouettes.tsx`, `feature-icon.tsx` y `use-reveal.ts` (portados de `home.jsx`). Test del hook: con `IntersectionObserver` simulado, el elemento recibe la clase `in` al intersectar y se desuscribe.
5. **`HomeView` y `/`.** Implementar `home-view.tsx` con todas las secciones y reemplazar el placeholder de `app/page.tsx` (obtiene juegos con `gamesGateway.list()` dentro de `Suspense`, con estado de error en la sección de mini-tarjetas). Metadata `title` para `/`. Tests de componente: renderiza las 6 mini-tarjetas con enlace a `/games/<id>`, los CTAs apuntan a `/games` y `/auth`, y con `error` aparece el mensaje y el enlace a `/games`.
6. **Ajuste visual y responsive.** Comparar la home contra la plantilla en desktop (1440 px) y móvil (375 px), incluido el hero y las animaciones (aquí se puede apoyar en `/frontend-design`). Verificación manual de: scroll-reveal, hamburguesa, flujo Inicio → Explorar → Detalle → volver, y login → `/games`.

---

## Acceptance criteria

- [x] `npm run build` termina sin errores ni errores de tipos.
- [x] `npm run lint` termina sin errores, incluidas las reglas de límites de las SPEC 01/02.
- [x] `npm run test` pasa todos los tests, incluidos los modificados por el cambio de ruta.
- [x] `/` muestra la home con las secciones: hero, "¿POR QUÉ ARCADE VAULT?" (4 tarjetas), "JUEGOS DISPONIBLES AHORA", estadísticas, "ACTIVIDAD EN VIVO", "PRECIOS" y CTA final "¿LISTO PARA JUGAR?".
- [x] Las rutas existen en inglés (`/games`, `/games/[id]`, `/games/[id]/play`, `/hall-of-fame`, `/auth`) y `/juegos`, `/juegos/<id>`, `/juegos/<id>/jugar` y `/salon` devuelven 404 (sin redirecciones).
- [x] No quedan referencias a las rutas viejas (`/juegos`, `/jugar`, `/salon`) en `app/`, `modules/` ni en los tests.
- [x] `/games/xyz` y `/games/xyz/play` muestran 404.
- [x] `/games` muestra la Biblioteca con el mismo comportamiento de la SPEC 02 (8 juegos, filtro, "NO HAY RESULTADOS", error con reintento).
- [x] La sección "JUEGOS DISPONIBLES AHORA" muestra 6 mini-tarjetas con los primeros 6 juegos de la API y cada una navega a `/games/<id>`.
- [x] Si la API de juegos falla, la home sigue renderizando el resto de las secciones y la de mini-tarjetas muestra un mensaje de error con enlace a `/games`.
- [x] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/games`; "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`; "VER SALÓN →" navega a `/hall-of-fame`.
- [x] El Nav (escritorio y panel móvil) muestra Inicio, Biblioteca y Salón de la Fama, y **no** muestra "Acerca de".
- [x] El enlace activo del Nav es "Inicio" solo en `/`, y "Biblioteca" en `/games` y `/games/<id>` (incluido `/games/<id>/play`).
- [x] Los botones "VOLVER AL VAULT" (Detalle y modal del Reproductor) y "VOLVER A LA BIBLIOTECA" (Salón) enlazan a `/games`.
- [x] Tras iniciar sesión o registrarse con éxito, se redirige a `/games`.
- [x] Al hacer scroll, las secciones con `.reveal` reciben la clase `in` y se animan; sin `IntersectionObserver` el contenido es visible.
- [x] La home no importa `infrastructure`, archivos `.json` ni `fs`, y `app/page.tsx` solo compone y obtiene datos por gateway.
- [x] En ancho de 375 px la home no tiene scroll horizontal y el hero, las rejillas y el pricing se apilan según la plantilla.
- [x] Las pantallas existentes (Detalle, Reproductor, Auth, Salón, Biblioteca) conservan su aspecto tras portar los estilos.
- [x] La consola del navegador no muestra errores de hidratación en `/` ni en `/games`.
- [x] Los tests no modifican los archivos versionados de `data/`.
- [x] No existe la ruta `/acerca` ni código de la página About.

---

## Decisions

- **Sí:** todas las rutas en inglés (`/games`, `/games/[id]/play`, `/hall-of-fame`; decisión del usuario), sin redirecciones desde las URL en español porque el proyecto no se ha publicado. **No:** `next.config.ts` con redirects: config extra sin beneficio. El texto visible de la UI sigue en español.
- **Sí:** Home en `/` y Biblioteca en `/games` (decisión del usuario). La landing es la entrada natural del sitio y `/games` es coherente con `/games/[id]`. **No:** home en `/home`: dejaría la entrada del sitio como Biblioteca.
- **Sí:** el post-login redirige a `/games` para conservar el comportamiento previo (antes `/` era la Biblioteca). **No:** redirigir a la home, que el usuario ya conoce al venir de ella.
- **Sí:** "Acerca de" fuera de esta spec y sin enlace (decisión del usuario), aunque `nav.jsx` lo incluye: evita enlaces rotos y deja About para su propia spec, que añadirá el enlace al Nav.
- **Sí:** `nav.jsx` de `home-about` es la referencia del Nav (indicado por el usuario); se adapta a `next/link` y `usePathname` como en la SPEC 02.
- **Sí:** portar solo las reglas de la home a `globals.css` (decisión del usuario). **No:** reemplazar el archivo completo: riesgo de regresión en las 5 pantallas y se traería CSS de About.
- **Sí:** mini-tarjetas con juegos reales vía `GamesGateway`; "Actividad en vivo", "Top hoy" y estadísticas como contenido estático (decisión del usuario). **No:** endpoint nuevo de actividad: obligaría a cambiar la SPEC 01.
- **Sí:** la home vive en `app/_components/home/` por ser contenido de la aplicación y no de una feature; evita crear un módulo nuevo o aristas entre módulos.
- **Sí:** navegación con `next/link`; se descarta el estado de ruta (`navigate({ name })`) de la plantilla, igual que en la SPEC 02.
- **Sí:** mantener el texto de la plantilla, incluido "12+ JUEGOS" aunque el catálogo actual tiene 8 juegos (es copy de marketing estático). Puede ajustarse en una revisión de contenido.
- **Sí:** los enlaces a rutas se hacen con `Link` y no se usa `localStorage`.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El `styles.css` nuevo duplica o modifica reglas existentes y rompe pantallas actuales. | Diff previo (paso 3) y comparación visual de las 5 pantallas antes de continuar. |
| Renombrar rutas y mover la Biblioteca deja enlaces o tests apuntando a `/`, `/juegos` o `/salon`. | `grep` de `href="/"` y `push("/")` en el paso 1 y tests actualizados; criterios de aceptación específicos. |
| Desajuste de hidratación por `IntersectionObserver` o animaciones (`.reveal`, `.blink`). | `useReveal` solo actúa en `useEffect`; el HTML inicial es idéntico en servidor y cliente. |
| `.reveal` oculta contenido si el observador no se ejecuta (JS desactivado, navegador antiguo). | Fallback que añade `in` de inmediato si no existe `IntersectionObserver`; verificado en test. |
| La home depende de la API por HTTP y `next build` no tiene servidor levantado (`cacheComponents`). | Renderizar la parte dependiente de la API dentro de `Suspense` y tratar el error sin romper la página, como en la SPEC 02. |
| Las 8 siluetas SVG animadas pueden afectar rendimiento en móvil. | Animaciones solo con `transform`/`opacity` y `prefers-reduced-motion` respetado si la plantilla lo define; revisar en el paso 6. |
| El contenido estático (puntuaciones, nombres de juego) queda desincronizado con `games.json`. | Verificar los nombres de juego contra el catálogo al implementar; documentado como decorativo. |

---

## What is **not** in this spec

- Página "Acerca de" y formulario de contacto.
- Cambios en la API, los JSON o los gateways.
- Datos reales para actividad, top de jugadores y estadísticas.
- Créditos o planes de pago funcionales.
- Tests E2E con Playwright.
- Rediseño del look & feel de la plantilla.

Cada uno de esos puntos, si se aborda, va en su propia spec.
