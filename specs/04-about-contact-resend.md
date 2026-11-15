# SPEC 04 — Página "Acerca de" y formulario de contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-11-15
> **Objective:** Implementar la página `/about` exactamente como `references/templates/home-about/about.jsx` (con su CSS) y hacer que su formulario de contacto envíe de verdad un correo al equipo mediante Resend, a través de un módulo `contact` con arquitectura limpia, un puerto `EmailSender` y `POST /api/contact`.

---

## Por qué existe esta spec

La SPEC 03 dejó "Acerca de" y el formulario de contacto fuera de alcance y omitió el enlace del Nav para no tener enlaces rotos, indicando que esta spec lo añadiría. La plantilla (`about.jsx`) solo valida en cliente y muestra una terminal de éxito falsa; aquí el envío es real. El proveedor es Resend (decisión del usuario). Para mantener los límites de la SPEC 01, el envío vive en un módulo propio: el dominio y el caso de uso no conocen Resend, y solo el adaptador de infraestructura lo importa. La UI sigue la plantilla al pie de la letra; `/frontend-design` solo se usa para ajustes de fidelidad/responsive, no para rediseñar.

---

## Scope

**In:**

- Nueva ruta `/about` (en inglés, como el resto de rutas) con las secciones de `about.jsx`, sin cambios de diseño ni de copy:
  - Hero "ACERCA DE ARCADE VAULT": kicker, título, misión y 3 highlights con icono (`HEART`, `BROWSER`, `PLANT`).
  - Divisor decorativo (barras + 24 píxeles animados).
  - Sección "CONTÁCTANOS": intro con 3 tips (RESPUESTA EN 24-48H, SUGERENCIAS BIENVENIDAS, SIN SPAM, JAMÁS) y formulario (NOMBRE, CORREO ELECTRÓNICO, MENSAJE, botón "▶ ENVIAR MENSAJE").
  - Animación `.reveal` → `.in` con `IntersectionObserver`, reutilizando `useReveal` de la SPEC 03 (con su fallback sin `IntersectionObserver`).
  - Animación `shake` del formulario cuando falla la validación del cliente.
  - Terminal de éxito "VAULT-OS // TERMINAL" con `GRACIAS, {NOMBRE EN MAYÚSCULAS}` y botón "ENVIAR OTRO MENSAJE" (limpia el formulario).
- Estado nuevo no presente en la plantilla (necesario por el envío real), con el mismo estilo visual: botón deshabilitado con texto "ENVIANDO…" mientras se envía, y mensaje de error dentro del formulario (línea con estilo de terminal/error) con el botón activo para reintentar sin perder lo escrito.
- Nav (escritorio y panel móvil): añadir "Acerca de" → `/about` según `references/templates/home-about/nav.jsx`; enlace activo en `/about`.
- Módulo nuevo `modules/contact` con capas de la SPEC 01:
  - Dominio: validación y normalización del mensaje de contacto (`validateContactMessage`).
  - Aplicación: caso de uso `SendContactMessage` y puerto `EmailSender`.
  - Infraestructura: `ResendEmailSender` (dependencia `resend`).
  - Presentación: `ContactForm` (cliente) y gateway HTTP cliente `ContactGateway` (puerto + `HttpContactGateway`) hacia `/api/contact`.
- `POST /api/contact` (route handler delgado): valida, envía el correo al equipo, responde `201`/`400`/`500`.
- Un único correo: al equipo (`CONTACT_TO_EMAIL`), con `reply-to` = correo del visitante. **No** hay correo de confirmación al visitante.
- Protección anti-abuso: validación en servidor + campo honeypot oculto (si viene relleno, el servidor responde éxito sin enviar nada). Sin rate limit.
- Variables de entorno documentadas en `.env.example`: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (por defecto `onboarding@resend.dev`, sandbox de Resend).
- Portar a `app/globals.css` las reglas de About/contacto de `references/templates/home-about/styles.css` (bloque `/* ===== ABOUT PAGE ===== */` y sus keyframes `pxblink`, `shake`, etc.; diff contra el CSS actual, sin duplicar).
- Metadato `title` de `/about`.
- Tests unitarios y de componente (Vitest + Testing Library), con Resend siempre simulado.

**Out of scope (para futuras specs):**

- Correo de confirmación/autorrespuesta al visitante.
- Verificación de dominio propio en Resend (se documenta como paso opcional, no es requisito).
- Rate limiting, CAPTCHA o almacenamiento de mensajes en `data/`.
- Panel o bandeja para leer los mensajes; plantilla HTML elaborada del correo (se envía texto plano + HTML mínimo).
- Cambios en los módulos `games`, `scores`, `auth`, `play` o en los JSON de `data/`.
- Tests E2E con Playwright.
- Rediseñar el look & feel de la plantilla; cambiar estilos de las pantallas existentes.
- i18n del correo o de la página.

---

## Data model

Esta spec no persiste datos (el mensaje solo se envía por correo). Introduce los tipos de dominio del mensaje de contacto.

### Estructura nueva o ampliada

```
app/
  about/page.tsx                    # compone <AboutView/> (+ metadata)
  api/contact/route.ts              # POST delgado → SendContactMessage
  api/contact/route.test.ts
  _components/
    about/
      about-view.tsx                # "use client": hero, divisor, contacto; usa useReveal
      highlight-icon.tsx            # HEART | BROWSER | PLANT
      about-content.ts              # constantes estáticas: highlights, tips
    nav.tsx                         # + "Acerca de" → /about
modules/
  contact/
    domain/contact-message.ts       # tipos + validateContactMessage()
    application/
      ports/email-sender.ts         # interface EmailSender
      send-contact-message.ts       # caso de uso
    infrastructure/
      resend-email-sender.ts        # adaptador Resend (único archivo que importa "resend")
    presentation/
      contact-form.tsx              # formulario + estados (idle | sending | sent | error)
      contact-gateway.ts            # puerto ContactGateway (cliente)
      http-contact-gateway.ts       # fetch POST /api/contact
    composition.client.ts           # contactGateway
    composition.server.ts           # sendContactMessage con ResendEmailSender y env vars
    index.ts                        # API pública (ContactForm)
    server.ts                       # API pública server (sendContactMessage)
    testing/                        # InMemoryEmailSender para tests
```

(La estructura de `index.ts`/`server.ts`/`composition.*` replica la de los módulos existentes; verificar al implementar y alinear nombres con `modules/scores`.)

```ts
// modules/contact/domain/contact-message.ts
interface ContactMessageInput { name: string; email: string; message: string; website?: string } // website = honeypot
interface ContactMessage { name: string; email: string; message: string }                        // ya validado y normalizado (trim)
type ContactValidationError = { field: "name" | "email" | "message"; reason: "required" | "invalid" | "too_long" };
// validateContactMessage(input) → { ok: true, value: ContactMessage } | { ok: false, errors: ContactValidationError[] }
// Límites: name ≤ 80, email ≤ 254 y formato válido, message ≤ 2000 (rechaza si, tras trim, queda vacío)

// modules/contact/application/ports/email-sender.ts
interface EmailSender { send(email: { to: string; from: string; replyTo: string; subject: string; text: string; html: string }): Promise<void> }

// POST /api/contact
// Request:  { name, email, message, website? }
// 201: { ok: true }             (también cuando el honeypot está relleno, sin enviar)
// 400: { error: "invalid", fields: ContactValidationError[] }
// 500: { error: "send_failed" } (Resend falló o faltan variables de entorno)
```

### Convenciones

- Se cumplen las reglas de dependencia de la SPEC 01/02: `app/**/page.tsx` solo compone; el handler solo traduce HTTP ↔ caso de uso; `domain` y `application` no importan `resend` ni `next`; solo `infrastructure/resend-email-sender.ts` importa `resend`. Módulo `contact` no se importa con otros módulos; `AboutView` (en `app/_components/about/`) puede importar la API pública de `contact` (`ContactForm`).
- La clave `RESEND_API_KEY` nunca llega al cliente: se lee solo en `composition.server.ts` (sin prefijo `NEXT_PUBLIC_`). Si falta una variable requerida, el caso de uso falla y el handler responde `500 { error: "send_failed" }` sin filtrar detalles; el error real se registra en servidor con `console.error`.
- Asunto: `Arcade Vault · Contacto de {name}`. Cuerpo en texto plano y HTML mínimo con nombre, correo y mensaje; **todos los valores del visitante se escapan** en el HTML.
- Validación de cliente (misma que la plantilla): si falta nombre, correo o mensaje tras `trim()`, se activa `shake` (400 ms) y no se envía. La validación de servidor es la fuente de verdad; ante `400` se muestra el error en el formulario.
- El campo honeypot (`website`) se renderiza fuera de pantalla (`aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`), no se muestra a usuarios y no altera el diseño.
- Textos de error visibles al usuario en español: `400` → "REVISA LOS CAMPOS E INTÉNTALO DE NUEVO."; `500`/red → "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO."
- `ContactForm` crea el gateway con `composition.client.ts` dentro del cliente (las clases no se pasan por props); en tests se sustituye con `vi.mock`.
- Los tests nunca llaman a Resend real ni requieren `RESEND_API_KEY`; usan `InMemoryEmailSender` o `vi.mock("resend")`.
- Ruta en inglés `/about`, coherente con SPEC 03; el texto visible sigue en español.

---

## Implementation plan

1. **Dependencias y entorno.** Instalar `resend`. Añadir a `.env.example` `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` (con comentario: por defecto `onboarding@resend.dev`; el sandbox solo entrega a la cuenta dueña de Resend; para otros destinatarios hay que verificar un dominio). Verificación: `npm run build` sigue pasando; `.env.local` (no versionado) con claves propias para pruebas manuales.
2. **Dominio.** `modules/contact/domain/contact-message.ts` con `validateContactMessage`. Tests: campos vacíos o solo espacios → `required`; correo sin formato válido → `invalid`; límites → `too_long`; valores válidos quedan con `trim`.
3. **Caso de uso y puerto.** `ports/email-sender.ts`, `send-contact-message.ts` (valida, ignora honeypot, arma asunto/cuerpo con escape HTML y llama a `EmailSender`) y `testing/in-memory-email-sender.ts`. Tests con el sender en memoria: éxito arma `to/from/replyTo/subject` correctos; honeypot relleno no envía y devuelve éxito; entrada inválida devuelve errores y no envía; si el sender lanza, el error se propaga; el HTML escapa `<script>`.
4. **Adaptador Resend y composición.** `resend-email-sender.ts` (usa `resend.emails.send`, lanza si la respuesta trae `error`) y `composition.server.ts` (lee env vars; defecto de `from` = `onboarding@resend.dev`; error claro si faltan `RESEND_API_KEY` o `CONTACT_TO_EMAIL`). Test del adaptador con `resend` simulado: pasa los campos tal cual y propaga el error de Resend.
5. **Route handler.** `app/api/contact/route.ts` (`POST`): parsea JSON, llama al caso de uso y responde `201` / `400` / `500` según el contrato. Tests: éxito, cuerpo inválido, JSON malformado → `400`, sender que falla → `500` sin detalles internos.
6. **Gateway y `ContactForm`.** `contact-gateway.ts`, `http-contact-gateway.ts`, `composition.client.ts`, `contact-form.tsx` e `index.ts`. El formulario replica los campos y clases de la plantilla, añade el honeypot, y gestiona `idle | sending | sent | error`. Tests de componente: validación de cliente con campos vacíos (no llama al gateway y aplica `shake`); envío válido llama al gateway con `{ name, email, message, website: "" }` y muestra la terminal con `GRACIAS, {NOMBRE}` en mayúsculas; fallo del gateway muestra el error y conserva lo escrito; "ENVIAR OTRO MENSAJE" limpia el formulario; el botón queda deshabilitado mientras envía.
7. **Estilos.** Diff del bloque About/contacto de `references/templates/home-about/styles.css` contra `app/globals.css` y portar solo lo que falte (`.about*`, `.highlight*`, `.hl-*`, `.about-divider`, `.div-*`, `.contact-*`, `.tip*`, `.terminal-success`, `.term-*`, `.dot`, `.line`, `.caret`, keyframes `pxblink` y `shake`), más estilos mínimos para el estado de error y el honeypot. Verificación: `npm run dev`, las pantallas existentes (Home, Biblioteca, Detalle, Reproductor, Auth, Salón) se ven igual.
8. **Página y contenido.** `about-content.ts`, `highlight-icon.tsx`, `about-view.tsx` (usando `useReveal` de la SPEC 03) y `app/about/page.tsx` con `metadata.title` "Acerca de · Arcade Vault". Test de componente: renderiza los 3 highlights, los 3 tips y el formulario.
9. **Nav.** Añadir "Acerca de" (`/about`) en escritorio y panel móvil en `app/_components/nav.tsx` y actualizar el cálculo de enlace activo. Actualizar `nav.test.tsx`: aparece "Acerca de" y está activo solo en `/about`.
10. **Ajuste visual y verificación real.** Comparar `/about` contra la plantilla en 1440 px y 375 px (apoyo en `/frontend-design` solo para fidelidad). Con credenciales reales de Resend en `.env.local`: enviar un mensaje desde el formulario y confirmar que llega al correo de `CONTACT_TO_EMAIL` con `reply-to` correcto; probar también sin `RESEND_API_KEY` (error visible, sin pantalla en blanco).

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores ni errores de tipos.
- [ ] `npm run lint` termina sin errores, incluidas las reglas de límites de las SPEC 01/02.
- [ ] `npm run test` pasa todos los tests, incluidos los nuevos y `nav.test.tsx` actualizado.
- [ ] `/about` renderiza el hero, los 3 highlights (con iconos HEART, BROWSER, PLANT), el divisor y la sección "CONTÁCTANOS" con 3 tips y el formulario, con el mismo copy y estructura que `about.jsx`.
- [ ] El Nav (escritorio y panel móvil) muestra Inicio, Biblioteca, Salón de la Fama y Acerca de; "Acerca de" navega a `/about` y está activo solo en `/about`.
- [ ] Al hacer scroll, las secciones `.reveal` reciben `in`; sin `IntersectionObserver` el contenido es visible.
- [ ] Enviar el formulario con algún campo vacío (o solo espacios) no hace ninguna petición y aplica la animación `shake`.
- [ ] Con datos válidos, el formulario muestra "ENVIANDO…" con el botón deshabilitado y, al terminar, la terminal "VAULT-OS // TERMINAL" con `GRACIAS, {NOMBRE}` en mayúsculas.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con todos los campos vacíos.
- [ ] `POST /api/contact` con datos válidos responde `201 { ok: true }` y llama una vez a `EmailSender.send` con `to = CONTACT_TO_EMAIL`, `from = CONTACT_FROM_EMAIL` (o `onboarding@resend.dev` si no está definida), `replyTo` = correo del visitante y asunto `Arcade Vault · Contacto de {name}`.
- [ ] `POST /api/contact` con campos vacíos, correo inválido o textos que exceden los límites responde `400` con `fields` y no envía correo.
- [ ] `POST /api/contact` con JSON malformado responde `400`.
- [ ] Con el honeypot (`website`) relleno, la API responde `201` y no se envía ningún correo.
- [ ] Si Resend falla o faltan `RESEND_API_KEY`/`CONTACT_TO_EMAIL`, la API responde `500 { error: "send_failed" }` sin exponer detalles internos, y el formulario muestra "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO." conservando lo escrito.
- [ ] El HTML del correo escapa el contenido del visitante (un mensaje con `<script>` no se inserta sin escapar).
- [ ] Solo `modules/contact/infrastructure/resend-email-sender.ts` importa `resend`; `domain`, `application`, `presentation` y `app/` no lo importan.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en ningún archivo versionado; `.env.example` documenta las 3 variables.
- [ ] Ningún test llama a Resend real ni necesita `RESEND_API_KEY`; los tests no modifican los archivos versionados de `data/`.
- [ ] Prueba manual con credenciales reales: un mensaje enviado desde `/about` llega a la bandeja de `CONTACT_TO_EMAIL` con nombre, correo y mensaje, y responder al correo apunta al visitante.
- [ ] En 375 px `/about` no tiene scroll horizontal y los highlights y el formulario se apilan según la plantilla.
- [ ] Las pantallas existentes (Home, Biblioteca, Detalle, Reproductor, Auth, Salón) conservan su aspecto tras portar los estilos.
- [ ] La consola del navegador no muestra errores de hidratación en `/about`.

---

## Decisions

- **Sí:** módulo `contact` con puerto `EmailSender` y adaptador Resend (decisión del usuario). Mantiene la regla "solo infraestructura importa librerías externas" y permite testear sin red. **No:** Server Action o lógica dentro del handler: mezclan HTTP, negocio y proveedor.
- **Sí:** Resend como proveedor (decisión del usuario), con remitente de sandbox `onboarding@resend.dev` por defecto y configuración por variables de entorno. **No:** requerir dominio verificado: bloquearía el desarrollo; queda documentado como paso opcional para producción.
- **Sí:** un único correo al equipo con `reply-to` al visitante. **No:** autorrespuesta al visitante: el sandbox de Resend no entrega a terceros y la plantilla no la contempla.
- **Sí:** validación en servidor como fuente de verdad más honeypot (decisión del usuario). **No:** rate limit en memoria: se pierde al reiniciar o en serverless y añade código con poco beneficio ahora; si hay abuso real, va en otra spec.
- **Sí:** `/about` en inglés, coherente con SPEC 03, y el enlace "Acerca de" vuelve al Nav como dejó previsto la SPEC 03.
- **Sí:** la UI sigue `about.jsx` y `nav.jsx` exactamente (indicado por el usuario). Las únicas adiciones son las necesarias por el envío real: estado "ENVIANDO…", mensaje de error y honeypot.
- **Sí:** el mensaje no se persiste en `data/`; el correo es el único destino. **No:** guardar en JSON: obligaría a tocar el backend simulado (SPEC 01).
- **Sí:** reutilizar `useReveal` de la SPEC 03 en vez de duplicar el `IntersectionObserver` inline de la plantilla.
- **Sí:** `AboutView` vive en `app/_components/about/` por ser contenido de la aplicación (igual que la home); solo `ContactForm` pertenece al módulo `contact`.
- **Sí:** la clave de Resend solo en el servidor, nunca `NEXT_PUBLIC_`.
- **Sí:** tests con Resend simulado; la entrega real se verifica manualmente en el paso 10.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El sandbox de Resend (`onboarding@resend.dev`) solo entrega a la dirección de la cuenta dueña. | `CONTACT_TO_EMAIL` debe ser ese correo en desarrollo; documentado en `.env.example` y en el paso 1. |
| Faltan o están mal las variables de entorno en despliegue. | El handler devuelve `500` genérico, el error real se registra en servidor y el formulario permite reintentar; criterio de aceptación explícito. |
| Inyección de HTML en el correo a través de nombre o mensaje. | Escape de todos los valores en el HTML y test dedicado; `reply-to` y `subject` solo con valores validados (sin saltos de línea en `name`). |
| Spam o abuso del endpoint sin rate limit. | Honeypot + límites de longitud; si aparece abuso se abre una spec de rate limit/CAPTCHA. |
| La API de `resend` cambia entre versiones (no coincide con lo que se recuerda). | Fijar la versión instalada y comprobar su documentación al implementar el paso 4; el adaptador aísla el cambio. |
| El CSS de About duplica o pisa reglas existentes y rompe pantallas actuales. | Diff previo (paso 7) y comparación visual de las pantallas existentes. |
| Desajuste de hidratación por `.reveal` o por el estado del formulario. | `useReveal` solo actúa en `useEffect`; el HTML inicial es idéntico en servidor y cliente. |
| Doble envío por doble clic. | Botón deshabilitado en estado `sending`; cubierto por test. |
| `cacheComponents: true` cambia la semántica de rutas y handlers en Next 16.4. | Leer `node_modules/next/dist/docs/` antes de los pasos 5 y 8; `/about` es estática y el handler es dinámico por naturaleza (`POST`). |

---

## What is **not** in this spec

- Correo de confirmación al visitante.
- Dominio verificado en Resend como requisito.
- Rate limiting, CAPTCHA o persistencia de mensajes.
- Bandeja/panel para leer mensajes y plantilla de correo elaborada.
- Cambios en `games`, `scores`, `auth`, `play` o la API de la SPEC 01.
- Tests E2E con Playwright.
- Rediseño del look & feel de la plantilla.

Cada uno de esos puntos, si se aborda, va en su propia spec.
