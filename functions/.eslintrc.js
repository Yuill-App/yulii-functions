module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
   // "indent": ["error", 2],
    "linebreak-style": 0,
    "no-tabs": "off", //["error", { "allowIndentationTabs": true }],
    "arraysInObjects": 0,
    "object-curly-spacing": ["error", "always"],
    "indent": "off",
    "require-jsdoc": 0,
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
     "operator-linebreak": ["error", "after"],
     "no-mixed-spaces-and-tabs": "off",
     "space-before-function-paren": ["error", {
      "anonymous": "ignore",
      "named": "ignore",
      "asyncArrow": "ignore"
  }],
  "operator-linebreak": "off",
  "max-len": ["error", { "code": 500 }],
  "arrow-parens": "off",
  "no-trailing-spaces": "off",
  "semi": "off",
  "eol-last": "off",
  "keyword-spacing": "off",
  "semi-spacing": "off",
  "no-useless-catch": "off",
  "no-dupe-keys": "off",
  "comma-dangle": "off",
  "key-spacing": "off",
  "spaced-comment": "off",
  "padded-blocks": "off"
  },
};
