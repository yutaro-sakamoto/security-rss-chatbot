import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/*.js"] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
