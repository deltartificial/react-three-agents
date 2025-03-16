import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isCodeSandbox =
  "SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env;

const dev = defineConfig({
  plugins: [react()],
  root: "example/client/",
  publicDir: "../../public/",
  base: "./",
  server: {
    host: true,
    open: !isCodeSandbox,
  },
});

export default process.argv[2] ? build : dev;
