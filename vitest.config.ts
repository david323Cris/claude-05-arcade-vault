import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

const alias = [
  { find: /^server-only$/, replacement: `${root}test-support/server-only.ts` },
  { find: /^@\//, replacement: `${root}` },
];

const exclude = ["node_modules/**", ".next/**"];

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude,
        },
      },
      {
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          exclude,
          setupFiles: ["./test-support/setup-dom.ts"],
        },
      },
    ],
  },
});
