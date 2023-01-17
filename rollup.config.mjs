import * as dotenv from "dotenv-flow";
dotenv.config();
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import externals from "rollup-plugin-node-externals";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import cleanup from "rollup-plugin-cleanup";
import { terser } from "rollup-plugin-terser";
// import execute from "rollup-plugin-execute";

const { NODE_ENV = "dev" } = process.env;
const isProd = NODE_ENV == "prod";
const rollup = [];

rollup.push({
  input: "src/pklib.ts",
  output: { file: `dist/pklib.js`, format: "cjs" },
  plugins: [
    typescript({ include: ["src/**/*.ts"] }),
    json(),
    externals(),
    commonjs(),
    nodeResolve(),
    cleanup(),
    isProd && terser()
  ],
});

export default rollup;
