import react from "@vitejs/plugin-react";

const isCodeSandbox =
  "SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env;

export default {
  plugins: [react()],
  root: "example/client/",
  publicDir: "../../public/",
  base: "./",
  server: {
    host: true,
    open: !isCodeSandbox, // Open if it's not a CodeSandbox
  },
  resolve: {
    alias: {
      src: "/packages/react-three-agents/src",
    },
  },
  build: {
    outDir: "./exampleDist",
    emptyOutDir: true,
    sourcemap: true,
  },
};
