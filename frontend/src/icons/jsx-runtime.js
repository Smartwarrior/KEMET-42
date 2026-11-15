import * as R from "react/jsx-runtime";
import { fixProps } from "./iconize.js";
export const Fragment = R.Fragment;
export const jsx = (t, p, k) => R.jsx(t, fixProps(p), k);
export const jsxs = (t, p, k) => R.jsxs(t, fixProps(p), k);
