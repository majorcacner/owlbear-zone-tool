import { default as eslint } from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import prettier from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["build/*", "public/*"]),
    eslint.configs.recommended,
    tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        files: ["**/*.js", "**/*.ts"],

        plugins: {
            prettier,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 5,
            sourceType: "script",

            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },

        rules: {
            // NO
            "no-var": "warn",
            "no-param-reassign": "off",
            "no-shadow": "off",
            "no-unused-vars": "off",
            "no-underscore-dangle": "off",

            // GENERAL
            "prefer-const": "warn",
            "object-curly-spacing": ["warn", "always"],
            "consistent-return": "off",
            "max-len": [
                "warn",
                {
                    code: 120,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreComments: true,
                },
            ],

            // TYPESCRIPT
            "@typescript-eslint/no-shadow": ["warn"],
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    args: "none",
                },
            ],
            "@typescript-eslint/quotes": "off",
            "@typescript-eslint/indent": "off",
            "@typescript-eslint/camelcase": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "warn",

            // IMPORT
            "import/prefer-default-export": "off",
        },
    },
]);
