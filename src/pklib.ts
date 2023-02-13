import utils from "./utils/index";
import Folder from "./lib/folder";
import Parser from "./lib/parser";
import DB from "./lib/db";
import * as TPL from "./tpl";

export default class PKLib {
  utils;
  env: ObjectAny;
  kitrc: ObjectAny;
  kitrcfly: ObjectAny;
  vault: Folder;
  kit: Folder;
  db: DB;
  cfg: Function;
  preExport: Function;
  postExport: Function;
  version: string;
  verbose: boolean;
  parser: Parser;
  isProcessing: boolean;
  error: any;

  constructor(options: ObjectAny = {}) {
    this.utils = utils;
    this.vault = new Folder(this, "vault");
    this.kit = new Folder(this, "kit");
    this.parser = new Parser(this);
    this.db = new DB("kitdb");
    if (options.verbose) this.verbose = true;
    this.guessEnv();
    // this.init();

    this.cfg = (key: string, fallback?: any) =>
      utils.o.get(this.kitrcfly, key) || utils.o.get(this.kitrc, key) || fallback;
    (this.cfg as any).set = (key: string, value: any) =>
      utils.o.put(this.kitrcfly, key, value);
  }

  #log = (...args: any[]) => {
    this.verbose && console.log(`pklib ➔`, ...args);
  };

  init = async () => {
    this.#log("init");
  };

  loadDirsConfig = async (asset: Asset) => {
    const { vault, utils, kitrc } = this;
    if (!kitrc.pk?.dirs) return [];

    const dirs = asset.path.split("/").slice(0, -1).filter(Boolean);

    const paths = dirs.map((dir, i) => {
      if (i == 0) return dir;
      const prev = dirs[i - 1];
      return [prev, dir].join("/");
    });

    const files = await Promise.allSettled(
      paths.map(async (path) => {
        try {
          const file = await vault.read(`${path}/dirrc.md`, {
            encoding: "utf-8",
          });
          // @ts-ignore
          const { frontmatter } = utils.md.parseFrontmatter(file);
          return Object.keys(frontmatter).length ? frontmatter : false;
        } catch (e) {
          return false;
        }
      })
    );

    // @ts-ignore
    return files.map((r) => r.value).filter(Boolean);
  };

  exportFile = async (files: string | string[], options?: ExportOptions) => {
    this.isProcessing = true;
    const { parser, utils, cfg } = this;
    options = options || {};
    files = utils.a.asArray(files);
    parser.resetIndex();

    const preExport = await (this.preExport || (() => {}))();

    const run = async (notes: string[]) => {
      for (const file of notes) {
        if (!file) continue;
        if (file.split(".").pop() != "md") continue;

        const asset = await this.fileToAsset(file);

        try {
          const md = await parser.parseMD(file);

          // kitrc file
          if (asset.path == "kitrc.md") {
            const content = utils.o.clone(
              md.frontmatter,
              "obsidian,vault,password"
            );
            asset.content = JSON.stringify(content, null, 2);
            asset.url = "kitrc.json";
            asset.type = "json";
            parser.index(asset);
            continue;
          }

          // dirrc files
          if (asset.path.split("/").pop() == "dirrc.md") {
            const content = utils.o.clone(
              md.frontmatter,
              "obsidian,vault,password"
            );
            asset.content = JSON.stringify(content, null, 2);
            asset.url = asset.path.replace(".md", ".json");
            asset.type = "json";
            parser.index(asset);
            continue;
          }

          // process html
          let win = await parser.processHtml(md.html);
          let doc = win.document;

          // navbar file
          if (asset.path == "navbar.md") {
            const content = this.utils.dom.parseUl(
              win,
              doc.querySelector("ul")
            );
            asset.content = JSON.stringify(content, null, 2);
            asset.url = "navbar.json";
            asset.type = "json";
            parser.index(asset);
            continue;
          }

          // set note file kitrc
          const dirs = await this.loadDirsConfig(asset);
          this.kitrcfly = utils.o.merge({}, this.kitrc, ...dirs, md.frontmatter);

          const title =
            cfg("title") ||
            cfg("og.title") ||
            asset.filename.replace(".md", "");
          // @ts-ignore
          cfg.set("title", title);

          // encrypt if needed
          await this.encryptFile(doc);
          const html = await this.buildHTML(doc.body.innerHTML, md);
          // get new win
          win = html.window;
          doc = win.document;

          asset.type = "note";
          asset.content = html.html;
          asset.title = doc.title;
          asset.tags = md.tags;
          asset.text = await parser.getTextFromElement(
            doc,
            doc.getElementById("content")
          );
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

    if (!options.dry) await this.dumpFiles();
    if (!options.dry) await this.dbSave();
    if (options.inspect) console.log("cache", parser.cache);

    const summary = parser.print();

    const postExport = await (this.postExport || (() => {}))({
      files,
      preExport,
    });

    this.isProcessing = false;
    return { cache: parser.cache, summary };
  };

  dbSave = async () => {
    const { db, parser, utils } = this;
    await db.load();

    const saveNS = async (ns: string) => {
      const col = `${ns}s`;
      // @ts-ignore
      const index = parser.cache[ns];
      const items = Object.keys(index);

      items.forEach((item: string | Asset) => {
        item = utils.o.clone(index[item as string], "content") as Asset;
        db.set(col, item.hash, item);
      });

      // delete missing files
      if (col == "notes") {
        const kitFiles = await this.kit.lsFiles("html");
        const dbHashes = db.get(col);
        const kitHashes = await Promise.all(
          kitFiles.map(async (f) => utils.c.getHash(f))
        );
        const diff = Object.keys(dbHashes).filter(
          (x) => !kitHashes.includes(x)
        );
        diff.map((key) => {
          db.unset(col, key);
        });
      }
    };

    await saveNS("note");
    await saveNS("image");
    await saveNS("pdf");

    await db.save();
  };

  dumpFiles = async () => {
    const { cache } = this.parser;
    return await Promise.all([
      this.kit.dumpNotes(cache.json),
      this.kit.dumpNotes(cache.note),
      this.kit.dumpAssets(cache.image, "base64"),
      this.kit.dumpAssets(cache.pdf),
    ]);
  };

  buildHTML = async (bodyText: string, md: ObjectAny = {}) => {
    const { utils } = this;
    const head = TPL.header({ cfg: this.cfg });
    const tags = md.tags;
    const frontmatter = utils.o.clone(md.frontmatter, "password");
    const body = utils.s.beautify(
      TPL.body({ tags, frontmatter, body: bodyText })
    );
    const html = utils.s.beautify(TPL.html({ head, body }));
    const win = await this.parser.getWindowFromString(html);
    return { html, body, window: win };
  };

  encryptFile = async (dom: Document) => {
    const pwd = this.cfg("password");
    if (!pwd) return;
    const encrypted = await this.utils.c.encrypt(dom.body.innerHTML, pwd);
    dom.body.innerHTML = `_crypted_` + encrypted;
  };

  fileToAsset = async (file: string): Promise<Asset> => {
    const filename = file.split("/").pop() || "";
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    let url = "";
    let type = "";

    if (ext == "md") {
      url = file.replace(".md", `.html`);
      type = "md";
    }
    if ("jpg,jpeg,gif,png,pdf".split(",").includes(ext)) {
      // url = `${this.getAssetsFolder()}/${hash}.${ext}`;
      url = file;
      type = ext == "pdf" ? "pdf" : "image";
    }

    const hash = await this.utils.c.getHash(url);
    return { path: file, filename, ext, hash, url, type };
  };

  setKitrc = (kitrc: ObjectAny) => {
    kitrc = kitrc || {};
    if (!Object.keys(kitrc).length) throw new Error("inavalid kitrc data");
    this.#log("set:kitrc");
    this.kitrc = kitrc;
    this.kitrcfly = {};
    const kitBase = kitrc.vault?.kit_folder || this.env.kit;
    this.kit.setBase(kitBase);
    this.db.setBase(kitBase);
    this.version = kitrc.pk?.version || "latest";
  };

  getKitrc = (cwd?: string, ext: string = "md") => {
    const file = `${cwd || this.env.cwd}/kitrc.${ext}`;
    if (!utils.fs.existsSync(file)) return false;

    const content = utils.fs.readFileSync(file, "utf8");

    return ext == "md"
      ? utils.md.parseFrontmatter(content).frontmatter
      : JSON.parse(content);
  };

  reloadKitrc = () => {
    const kitrc = this.getKitrc();
    this.setKitrc(kitrc);
  };

  async createKitrc(data: ObjectAny = {}) {
    if (this.env.type == "kit") throw new Error(`cannot init a "kit" folder`);

    if (await this.vault?.fileExist("kitrc.md"))
      throw new Error("kitrc.md already exist");
    data.vault = data.vault || {};
    data.vault.kit_folder =
      data.vault.kit_folder ||
      this.kitrc?.vault?.kit_folder ||
      `${this.env.vault}/kit`;

    data.site = data.site || {};
    data.site.name =
      data.site.name ||
      this.utils.s.capitalize(
        this.env.vault.split("/").pop()?.replace(/-/g, " ")
      );
    data.site.id = data.site.id || "";
    const content = TPL.kitrc(data);
    return this.vault.write("kitrc.md", content);
  }

  guessEnv = () => {
    let cwd,
      type = "",
      vault,
      kit,
      kitrc,
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
        utils.fs.existsSync(`${cwd}/kitrc.md`)
      ) {
        type = "vault";
      }
    }

    try {
      if (type == "vault") {
        vault = cwd;
        kitrc = this.getKitrc(cwd);
        kit = kitrc.vault?.kit_folder || `${cwd}/kit`;
      } else {
        if (utils.fs.existsSync(`${cwd}/kitrc.json`)) {
          type = "kit";
          kitrc = this.getKitrc(cwd, "json");
          kit = cwd;
        }else{
          vault = cwd;
          type = "vault"
        }
      }

      
      this.env = { cwd, type, vault, kit, isObsidian };

      if (vault) this.vault.setBase(vault);
      if (kitrc) this.setKitrc(kitrc);
    } catch (e) {
      this.error = this.betterError(e);
      this.#log("error", this.error);
    }

    // this.#log("env", this.env);
  };

  betterError = (e: any) => {
    let err;
    if (e.name == "YAMLException")
      err = `Invalid Yaml in kitrc.md file. Fix & restart !\n\n${e.message}`;
    else err = e;
    return err;
  };
}
