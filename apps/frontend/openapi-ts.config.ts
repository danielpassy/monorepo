import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../apps/web/openapi.json",
  output: {
    path: "src/api/generated",
    format: "prettier",
    lint: "eslint",
  },
  plugins: ["@hey-api/client-fetch"],
});
