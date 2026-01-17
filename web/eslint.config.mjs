import next from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "src/app/__site/**"],
  },
  ...tseslint.configs.recommended,
  next.configs["core-web-vitals"],
];
