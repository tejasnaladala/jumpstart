import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Existing client-only hydration patterns predate this opt-in React
      // compiler rule. Migrate them separately with focused UI regressions.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "dist/**",
    "external/**",
    "out/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
