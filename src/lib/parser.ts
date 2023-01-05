import Lib from "../pklib";
import fs from "../utils/fs";
import { isNode, isElectron } from "../utils/node";
import { parseFrontmatter } from "../utils/markdown";
import { get, put } from "../utils/object";
// @ts-ignore
import MDLib from "markdown-it";

export default class Parser {
  pklib: Lib;
  md: MDLib;
  domParser: any;
  cache: IndexCache;
  transformer: Function;
  removers: ObjectAny;
  customParseMD: Function;

  constructor(pklib: Lib) {
    this.pklib = pklib;
    this.md = new MDLib();
    this.removers = {};

    try {
      this.domParser = window.DOMParser;
    } catch (e) {}
  }

  resetIndex = () => {
    this.cache = {
      md: {},
      image: {},
      pdf: {},
      current: {},
      error: {},
    } as IndexCache;
  };

  index = (asset: Asset) => {
    const { cache } = this;
    const { hash, type } = asset;
    const key = `${type}.${hash}`;
    if (get(cache, key)) return;
    put(cache, key, asset);
  };

  parseMD = async (file: string) => {
    if (this.customParseMD) return this.customParseMD(file);

    const content = await fs.readFile(file, { encoding: "utf-8" });
    const { frontmatter, body } = parseFrontmatter(content);
    const tags: string[] = [];
    const html = this.md.render(body);
    return { frontmatter, html, tags };
  };

  processHtml = async (s: string): Promise<Document> => {
    const { utils } = this.pklib;
    const doc = await this.getHtmlDocFromString(s);
    const txs: any[] = [];

    if (this.transformer) {
      await this.transformer(doc, txs);
      await processTxs(txs, doc);
    }

    const removers = Object.keys(this.removers);
    removers.forEach((key) => {
      const fn = (utils.dom.remove as any)[key];
      fn((this.removers as any)[key], doc.body);
    });

    return doc;
  };

  getHtmlDocFromString = async (s: string): Promise<Document> => {
    const DP = this.domParser;
    const parser = new DP();
    const doc = parser.parseFromString(s, "text/html");
    return doc;
  };
}

const processTxs = async (txs: any[], doc: Document) => {
  const result = {};
  for (const el of txs) {
    // @ts-ignore
    result[el[0]] = await processTx(el[0], el[1] as Function, doc);
  }
  return result;
};

const processTx = async (selector: string, fn: Function, doc: Document) => {
  const els = [...doc.querySelectorAll(selector)];
  await Promise.allSettled(els.map((el) => fn(el)));
  return els.length;
};

// const tpl = `---
// foo: bar
// ---

// # yipeah`;
