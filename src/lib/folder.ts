import fs from "../utils/fs";
import PKLib from "../pklib";

class Folder {
  type: string;
  pklib: PKLib;
  base: string;
  customWrite: Function;

  constructor(pklib: PKLib, type: string) {
    this.pklib = pklib;
    this.type = type;
  }

  setBase(path: string) {
    this.base = path || this.base;
  }

  toPath(path: string) {
    if (!this.base) throw new Error("folder has no base");
    path = `${this.base}/${path[0] == "/" ? path.slice(1) : path}`;
    return path;
  }

  async write(path: string, data: any, options?: object) {
    if (this.customWrite) return this.customWrite(path, data, options);
    await fs.outputFile(this.toPath(path), data, options);
    return path;
  }

  async read(path: string, options?: object) {
    // @ts-ignore
    return fs.readFile(this.toPath(path), options);
  }

  async fileExist(path: string) {
    return await fs.existsSync(this.toPath(path));
  }

  lsFiles = async (ext: string = "md") => {
    const { utils, cfg } = this.pklib;
    const regex = `${this.base}/**/*.${ext}`;
    let list = await utils.file.glob(regex);
    list = list.map((f: string) => f.replace(`${this.base}/`, ""));

    const includesExps = utils.a.asArray(cfg(`${this.type}.include`) || []);
    const excludeExps = utils.a.asArray(cfg(`${this.type}.exclude`) || []);

    const files = list.filter((k: string) => {
      const include = !includesExps.length
        ? true
        : includesExps.find((exp: string) => {
            return k.search(new RegExp(exp)) >= 0 ? exp : false;
          });
      const exclude = excludeExps.find((exp: string) => {
        return k.search(new RegExp(exp)) >= 0 ? exp : false;
      });
      return include && !exclude;
    });

    console.log("lsFiles", files);
    return files;
  };

  async dumpAssets(index: any, encoding?: any) {
    const assets = Object.values(index);
    return Promise.all(
      assets.map(async (asset: Asset) => {
        try {
          const source = this.pklib.vault.toPath(asset.path);
          const destination = asset.url;
          if (!asset.url) throw new Error("asset is missing an url");
          // return if file already exist, but dont throw
          if (await this.fileExist(asset.url)) return;

          const img = fs.readFileSync(source, { encoding });
          await this.write(asset.url, img, { encoding });
          return asset.url;
        } catch (e) {
          asset.type = "error";
          asset.err = e.message || e;
          this.pklib.parser.index(asset);
        }
      })
    );
  }

  async dumpNotes(index: any, encoding?: any) {
    const notes = Object.values(index);
    return Promise.all(
      notes.map(async (asset: Asset) => {
        try {
          const { content, url } = asset;
          if (!url || !content) throw new Error("asset has no url or content");
          await this.write(url, content);
          return url;
        } catch (e) {
          asset.type = "error";
          asset.err = e.message || e;
          this.pklib.parser.index(asset);
        }
      })
    );
  }

  // buildReport = async () => {
  //   const reportDateFormat = "YYYY-MM-DD@HH:mm"; //"**/*.+(html|png|jpg|jpeg|pdf)"
  //   const index = await fs.buildIndex("**/*.+(html)", { cwd: this.base });
  //   const report = index.reduce(
  //     (acc: any, v: any) => {
  //       const e = [window.moment(v[1]).format(reportDateFormat), v[0], v[3]];
  //       acc.rows.push(e);
  //       acc.size += v[2];
  //       return acc;
  //     },
  //     { rows: [], size: 0 }
  //   );

  //   return report;
  // };
}

export default Folder;
