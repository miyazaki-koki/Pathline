import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Pathline must not perform network I/O." },
        { name: "XMLHttpRequest", message: "Pathline must not perform network I/O." },
        { name: "WebSocket", message: "Pathline must not perform network I/O." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "Use textContent to avoid XSS.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  { ignores: ["dist/**", "node_modules/**"] },
];
