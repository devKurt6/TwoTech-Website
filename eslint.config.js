import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
export default [
  { ignores: ["dist/**", "node_modules/**", "reference/**"] },
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
