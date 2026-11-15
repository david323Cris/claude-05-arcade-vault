import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

// Captura `module` = nombre del módulo (games | scores | auth | play).
const m = { captured: { module: "{{ from.captured.module }}" } };

const boundariesConfig = {
  files: ["modules/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}", "app/api/**/*.ts"],
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "domain", pattern: "modules/*/domain", capture: ["module"], partialMatch: false },
      { type: "application", pattern: "modules/*/application", capture: ["module"], partialMatch: false },
      { type: "infra-server", pattern: "modules/*/infrastructure/server", capture: ["module"], partialMatch: false },
      { type: "infra-client", pattern: "modules/*/infrastructure/client", capture: ["module"], partialMatch: false },
      { type: "presentation", pattern: "modules/*/presentation", capture: ["module"], partialMatch: false },
      { type: "testing", pattern: "modules/*/testing", capture: ["module"], partialMatch: false },
      { type: "module-root", pattern: "modules/*", capture: ["module"], partialMatch: false },
      { type: "shared-kernel", pattern: "shared/kernel", partialMatch: false },
      { type: "shared-config", pattern: "shared/config", partialMatch: false },
      { type: "shared-infra", pattern: "shared/infrastructure", partialMatch: false },
      { type: "shared-http", pattern: "shared/infrastructure/http", partialMatch: false },
      { type: "api", pattern: "app/api", partialMatch: false },
    ],
    "boundaries/files": [
      { pattern: "modules/*/composition.server.ts", category: "composition-server", capture: ["module"] },
      { pattern: "modules/*/composition.client.ts", category: "composition-client", capture: ["module"] },
      { pattern: "modules/*/index.ts", category: "public-index", capture: ["module"] },
      { pattern: "modules/*/server.ts", category: "public-server", capture: ["module"] },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "disallow",
        policies: [
          // domain
          { from: { element: { type: "domain" } }, allow: { to: [{ element: { type: "domain", captured: m.captured } }, { element: { type: "shared-kernel" } }] } },
          // application
          { from: { element: { type: "application" } }, allow: { to: [{ element: { type: ["domain", "application"], captured: m.captured } }, { element: { type: "shared-kernel" } }] } },
          // infrastructure (server y client); la arista entre módulos va por server.ts
          { from: { element: { type: ["infra-server", "infra-client"] } }, allow: { to: [{ element: { type: ["domain", "application", "infra-server", "infra-client"], captured: m.captured } }, { element: { type: ["shared-kernel", "shared-config", "shared-infra", "shared-http"] } }, { file: { categories: "public-server" } }] } },
          // presentation (SPEC 02)
          { from: { element: { type: "presentation" } }, allow: { to: [{ element: { type: ["domain", "application", "presentation"], captured: m.captured } }, { file: { categories: "composition-client", captured: m.captured } }, { element: { type: "shared-kernel" } }, { file: { categories: "public-index" } }] } },
          // composition roots
          { from: { file: { categories: ["composition-server", "composition-client"] } }, allow: { to: [{ element: { type: ["domain", "application", "infra-server", "infra-client", "testing"], captured: { module: "{{ from.file.captured.module }}" } } }, { element: { type: ["shared-kernel", "shared-config", "shared-infra", "shared-http"] } }, { file: { categories: ["public-index", "public-server"] } }] } },
          // API pública de cada módulo
          { from: { file: { categories: ["public-index", "public-server"] } }, allow: { to: [{ element: { type: ["domain", "application", "presentation"], captured: { module: "{{ from.file.captured.module }}" } } }, { file: { categories: ["composition-client", "composition-server"], captured: { module: "{{ from.file.captured.module }}" } } }, { element: { type: "shared-kernel" } }] } },
          // testing
          { from: { element: { type: "testing" } }, allow: { to: [{ element: { type: ["domain", "application", "testing"], captured: m.captured } }, { element: { type: "shared-kernel" } }] } },
          // shared
          { from: { element: { type: "shared-kernel" } }, allow: { to: { element: { type: "shared-kernel" } } } },
          { from: { element: { type: "shared-config" } }, allow: { to: { element: { type: ["shared-config", "shared-kernel"] } } } },
          { from: { element: { type: ["shared-infra", "shared-http"] } }, allow: { to: { element: { type: ["shared-kernel", "shared-config", "shared-infra", "shared-http"] } } } },
          // app/api: solo server.ts de módulos y shared/infrastructure/http
          { from: { element: { type: "api" } }, allow: { to: [{ file: { categories: "public-server" } }, { element: { type: "shared-http" } }, { element: { type: "shared-kernel" } }] } },
        ],
      },
    ],
  },
};

// Prohibidos en domain y application: frameworks y APIs de I/O.
const pureLayers = {
  files: ["modules/*/domain/**/*.ts", "modules/*/application/**/*.ts"],
  ignores: ["**/*.test.ts"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*"], message: "domain/application no pueden depender de frameworks." },
          { group: ["fs", "fs/*", "node:fs", "node:fs/*", "server-only"], message: "domain/application no pueden acceder al sistema de archivos." },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  boundariesConfig,
  pureLayers,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plantillas de referencia (no son código de la app).
    "references/**",
  ]),
]);

export default eslintConfig;
