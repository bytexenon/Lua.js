import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";

export default {
  input: "dist/src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "es",
  },
  plugins: [
    resolve(),
    commonjs(),
    json(),
    terser({
      ecma: 2020,
      format: { comments: false },
      mangle: { toplevel: true },
      compress: {
        defaults: true,
        comparisons: true,
        inline: 2,
        loops: true,
        booleans_as_integers: true,
        passes: 7,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: false,
        keep_classnames: false,
        dead_code: true,
      },
    }),
  ],
};
