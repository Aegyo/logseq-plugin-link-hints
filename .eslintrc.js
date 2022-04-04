module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["airbnb-base", "airbnb-typescript/base", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["vite.config.ts"],
        peerDependencies: true,
      },
    ],
    "import/prefer-default-export": "off",
    "no-restricted-syntax": [
      "error",
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
    ],
    "no-console": "off",
    "@typescript-eslint/no-use-before-define": "off",
  },
  globals: {
    logseq: "readonly",
    parent: "readonly",
  },
  ignorePatterns: ["dist", ""],
};
