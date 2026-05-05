import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import tsdoc from "eslint-plugin-tsdoc";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js, tsdoc },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "prefer-const": "off",
      "tsdoc/syntax": "warn"
    },
  },
  { ignores: ["dist/*", "docs/*"] },
]);
