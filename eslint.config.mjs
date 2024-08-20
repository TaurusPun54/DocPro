import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
    "no-underscore-dangle": "off",
    "max-len": "warn",
    "func-names": "off",
    "camelcase": "warn",
    "no-console": ["warn", { allow: ["error", "warn", "info"] }],
    "eol-last": "warn"
    }
  }
];
