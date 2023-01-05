import utils from "./utils/index";
import Folder from "./lib/folder";
import Parser from "./lib/parser";
import * as TPL from "./tpl";

export default class Lib {
  utils;
  env: ObjectAny;
  pkrc: ObjectAny;
  pkrcfly: ObjectAny;
  vault;
  kit;
  cfg: Function;
  version: string;
  verbose: boolean;
  parser: Parser;

  constructor(options: ObjectAny = {}) {
    this.utils = utils;
    this.vault = new Folder(this);
    this.kit = new Folder(this);
    this.parser = new Parser(this);
    if (options.verbose) this.verbose = true;
    this.guessEnv();
    // this.init();

    this.cfg = (key: string, fallback?: any) =>
      utils.o.get(this.pkrcfly, key) || utils.o.get(this.pkrc, key) || fallback;
    (this.cfg as any).set = (key: string, value: any) =>
      utils.o.put(this.pkrcfly, key, value);
  }

  #log = (...args: any[]) => {
    this.verbose && console.log(`pklib ➔`, ...args);
  };

  init = async () => {
    this.#log("init");
  };

  exportFile = async (files: string | string[], follow?: boolean) => {
    const { parser, utils, cfg } = this;
    files = utils.a.asArray(files);
    parser.resetIndex();

    const [firstFile] = files;
    let [lastFile] = files;

    const run = async (notes: string[]) => {
      for (const file of notes) {
        if (file.split(".").pop() != "md") continue;
        if (!file) continue;
        lastFile = file;

        const asset = await this.fileToAsset(file);

        try {
          const md = await parser.parseMD(file);
          const dom = await parser.processHtml(md.html);

          // set current file pkrc
          this.pkrcfly = utils.o.merge({}, this.pkrc, md.frontmatter);
          const title =
            cfg("title") ||
            cfg("og.title") ||
            asset.filename.replace(".md", "");
          // @ts-ignore
          cfg.set("title", title);

          // encrypt if needed
          await this.encryptFile(dom);
          const { body, doc } = this.buildHTML(dom.body.innerHTML, md);

          asset.type = "current";
        } catch (e) {
          asset.type = "error";
          asset.err = e.message || e;
        }

        parser.index(asset);
      }

      // if (follow) {
      // 	const followNotes = await this.followNotes();
      // 	if (followNotes.length) await run(followNotes);
      // }
    };

    await run(files);

    return parser.cache;
  };

  buildHTML = (bodyText: string, md: ObjectAny = {}) => {
    const { utils } = this;
    const head = TPL.header({ cfg: this.cfg });
    const tags = md.tags;
    const frontmatter = utils.o.clone(md.frontmatter, "password");
    const body = utils.s.beautify(
      TPL.body({ tags, frontmatter, body: bodyText })
    );
    const doc = utils.s.beautify(TPL.html({ head, body }));
    return { body, doc };
  };

  encryptFile = async (dom: Document) => {
    const pwd = this.cfg("password");
    if (!pwd) return;
    const encrypted = await this.utils.c.encrypt(dom.body.innerHTML, pwd);
    dom.body.innerHTML = `_crypted_` + encrypted;
  };

  getAssetsFolder = () => {
    let f = this.cfg("site.assets", "assets");
    if (f.startsWith("http")) return f;
    if (f.startsWith("/")) f = f.slice(1);
    if (f.endsWith("/")) f = f.slice(0, -1);
    return f;
  };

  fileToAsset = async (file: string): Promise<Asset> => {
    const filename = file.split("/").pop() || "";
    const subpath = file.replace(filename, "");
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const hash = await this.utils.c.getHash(file);

    let url,
      type = "";

    if (ext == "md") {
      url = file.replace(".md", `.html`);
      type = "md";
    }
    if ("jpg,jpeg,gif,png,pdf".split(",").includes(ext)) {
      url = `${this.getAssetsFolder()}/${hash}.${ext}`;
      type = ext == "pdf" ? "pdf" : "image";
    }

    return { path: file, filename, ext, subpath, hash, url, type };
  };

  setPkrc = (pkrc: ObjectAny) => {
    pkrc = pkrc || {};
    if (!Object.keys(pkrc).length) throw new Error("inavalid pkrc data");
    this.#log("set:pkrc");
    this.pkrc = pkrc;
    this.kit.setBase(pkrc.vault?.export_folder || `${this.env.cwd}/kit`);
    this.version = pkrc.pk?.version || "latest";
  };

  getPkrc = (cwd?: string, ext: string = "md") => {
    const content = utils.fs.readFileSync(
      `${cwd || this.env.cwd}/pkrc.${ext}`,
      {
        encoding: "utf8",
      }
    );
    return ext == "md"
      ? utils.md.parseFrontmatter(content).frontmatter
      : JSON.parse(content);
  };

  reloadPkrc = () => {
    const pkrc = this.getPkrc();
    this.setPkrc(pkrc);
  };

  async createPkrc(data: ObjectAny = {}) {
    if (this.env.type == "kit") throw new Error(`cannot init a "kit" folder`);
    if (await this.vault?.fileExist("pkrc.md"))
      throw new Error("pkrc.md already exist");
    data.vault = data.vault || {};
    data.vault.export_folder =
      data.vault.export_folder ||
      this.pkrc?.vault?.export_folder ||
      `${this.env.vault}/kit`;

    data.site = data.site || {};
    data.site.name =
      data.site.name ||
      this.utils.s.capitalize(
        this.env.vault.split("/").pop()?.replace(/-/g, " ")
      );
    data.site.id = data.site.id || "";
    const content = TPL.pkrc(data);
    return this.vault.write("pkrc.md", content);
  }

  guessEnv = () => {
    let cwd,
      type = "",
      vault,
      kit,
      pkrc,
      isObsidian = false;
    try {
      //@ts-ignore
      cwd = app?.vault.adapter.basePath;
      type = "vault";
      isObsidian = true;
    } catch (e) {
      cwd = process.cwd();
      if (
        utils.fs.existsSync(`${cwd}/.obsidian`) ||
        utils.fs.existsSync(`${cwd}/pkrc.md`) ||
        !utils.fs.existsSync(`${cwd}/pkrc.json`)
      ) {
        type = "vault";
      }
    }

    if (type == "vault") {
      try {
        vault = cwd;
        pkrc = this.getPkrc(cwd);
        kit = pkrc.vault?.export_folder || `${cwd}/kit`;
      } catch (e) {}
    } else {
      try {
        type = "kit";
        pkrc = this.getPkrc(cwd, "json");
        kit = cwd;
      } catch (e) {
        // not found
      }
    }

    if (vault) this.vault.setBase(vault);
    if (pkrc) this.setPkrc(pkrc);
    this.env = { cwd, type, vault, kit, isObsidian };
    // this.#log("env", this.env);
  };
}
