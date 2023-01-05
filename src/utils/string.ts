// @ts-nocheck
import * as Beautify from "js-beautify";

export const capitalize = (s: string = "") =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const beautify = (str, type? = "html", options?) =>
  Beautify[type](str, { ...{ indent_size: 2 }, ...options });
