import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/*.js"],
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
        },
      ],
    },
  },
  ...tseslint.configs.recommended,
];
