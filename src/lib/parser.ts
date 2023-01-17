import PKLib from "../pklib";
import { parseFrontmatter } from "../utils/markdown";
import { get, put } from "../utils/object";
import { isBrowser } from "../utils/node";
// @ts-ignore
import MDLib from "markdown-it";
// @ts-ignore
import MDCheckbox from "markdown-it-checkbox";
// @ts-ignore
import ExternalLinks from "markdown-it-external-links"
import jquery from "jquery";

export default class Parser {
  pklib: PKLib;
  mdParser: MDLib;
  mdParserOptions: ObjectAny;
  jsdom: any;
  cache: IndexCache;
  transformer: Function;
  removers: ObjectAny;
  customParseMD: Function;

  constructor(pklib: PKLib) {
    this.pklib = pklib;
    this.setMDParserOptions({ html: true });
    this.setTransformer(defaultTransformer);
    this.setRemovers({});
    this.mdParserOptions = { linkify: true };
  }

  resetIndex = () => {
    this.cache = {
      md: {},
      image: {},
      pdf: {},
      note: {},
      json: {},
      error: {},
    } as IndexCache;
  };

  index = (asset: Asset) => {
    const { cache } = this;
    const { hash, type } = asset;
    const key = `${type}.${hash}`;
    if (get(cache, key)) return;
    asset.eat = new Date().toISOString();
    put(cache, key, asset);
  };

  setTransformer = (fn: Function) => {
    this.transformer = fn;
  };

  setRemovers = (removers: ParserRemovers) => {
    this.removers = removers;
  };

  getMDParser = () => {
    if (this.mdParser) return this.mdParser;
    const parser = new MDLib(this.mdParserOptions);
    parser.use(MDCheckbox);
    parser.use(ExternalLinks);
    this.mdParser = parser;
    return parser;
  };

  setMDParserOptions = (options: any = {}) => {
    this.mdParser = false; // reset parser
    return (this.mdParserOptions = options);
  };

  setCustomParseMD = (fn: Function) => {
    this.customParseMD = fn;
  };

  parseMD = async (file: string) => {
    if (this.customParseMD) return this.customParseMD(file);

    const content = await this.pklib.vault.read(file, { encoding: "utf-8" });
    // @ts-ignore
    const { frontmatter, body } = parseFrontmatter(content);
    const tags: string[] = this.pklib.utils.a.asArray(frontmatter.tags);
    const html: string = this.getMDParser().render(body);
    return { frontmatter, html, tags };
  };

  processHtml = async (s: string): Promise<Window> => {
    const { utils } = this.pklib;
    const win = await this.getWindowFromString(s);
    const { document: doc } = win;
    const txs: any[] = [];

    if (this.transformer) {
      await this.transformer(win, txs, this.pklib);
      await processTxs(txs, win);
    }

    const removers = Object.keys(this.removers);
    removers.forEach((key) => {
      const fn = (utils.dom.remove as any)[key];
      fn((this.removers as any)[key], doc.body);
    });

    return win;
  };

  getWindowFromString = async (s: string): Promise<Window> => {
    if (this.jsdom) {
      const dom = new this.jsdom.JSDOM(s);
      jquery(dom.window, true);
      return dom.window;
    } else {
      // @ts-ignore
      const win: Window = {};
      // @ts-ignore
      win.document = new window.DOMParser().parseFromString(s, "text/html");
      win.$ = jquery;
      return win;
    }

    // const win = this.getWindow();
    // const parser = new win.DOMParser();
    // const doc = parser.parseFromString(s, "text/html");
    // if(!isBrowser()) win.doc = doc
    // const $ = isBrowser() ? jquery : jquery(win, true);
    // return { win, doc, $ };
  };

  getTextFromElement = async (doc: Document, el: HTMLElement | null) => {
    if (!el || !el.innerHTML) return "";

    const div = doc.createElement("div");
    div.insertAdjacentHTML("beforeend", el.innerHTML);

    const text = Array.from(div.querySelectorAll("h1,h2,h3,p"))
      .map((x) => (x.textContent || "").replace(/\s\s+/g, " "))
      .filter((x) => !!x)
      .join(" ");

    return text;
  };

  print = (cache?: any): string => {
    cache = cache || this.cache;
    const string = [
      { key: "note", icon: "📄" },
      { key: "image", icon: "🏞️" },
      { key: "pdf", icon: "🔗" },
      { key: "json", icon: "📁" },
      { key: "error", icon: "💥" },
    ].map((category) => {
      return this.printCategory(category, cache);
    });

    return string.filter(Boolean).join("\n\n");
  };

  private printCategory = (category: ObjectAny, cache: IndexCache) => {
    const values = Object.values((cache as any)[category.key]);
    const nbValues = values.length;

    if (nbValues <= 0) return false;
    return `${category.icon}  ${nbValues} ${category.key}${
      nbValues > 1 ? "s" : ""
    } \n-------------------\n${values
      .map((a: Asset) => {
        const err = category.key == "error" ? ` [${a.err}]` : "";
        return `➔ ${a.url} ${err}`;
      })
      .join("\n")}`;
  };
}

const processTxs = async (txs: any[], win: Window) => {
  const result = {};
  for (const el of txs) {
    // @ts-ignore
    result[el[0]] = await processTx(el[0], el[1] as Function, win);
  }
  return result;
};

const processTx = async (selector: string, fn: Function, win: Window) => {
  const { document: doc } = win;
  const els = [...doc.querySelectorAll(selector)];
  await Promise.allSettled(els.map((el) => fn(el)));
  return els.length;
};

const defaultTransformer = async (win: Window, txs: any[], pklib: PKLib) => {
  const { document: doc, $ } = win;
  const body = doc.querySelector("body");
  if (!body) return;

  const { fileToAsset, parser } = pklib;

  const isInternal = (path: string): string | undefined => {
    if (!path) return;
    if (path.includes("//")) return;
    if (path.startsWith("/")) return path.slice(1);
    return path;
  };

  txs.push([
    "img",
    async (el: any) => {
      const path = isInternal(el.getAttribute("src"));
      const asset = path && (await fileToAsset(path));
      if (!asset) return;
      el.setAttribute("src", asset.url);
      parser.index(asset);
    },
  ]);

  // txs.push([
  //   ".pdf-embed iframe",
  //   async (el: any) => {
  //     const path = this.getLocalPath(el.getAttribute("src"));
  //     const asset = await fileToAsset(path);
  //     if (!asset) return;
  //     el.setAttribute("src", asset.url);
  //     el.setAttribute("frameBorder", "no");
  //     el.removeAttribute("style");
  //     parser.index(asset);
  //   },
  // ]);
};

// const tpl = `---
// foo: bar
// ---

// # yipeah`;
