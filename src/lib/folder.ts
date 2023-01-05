import fs from "../utils/fs";
import Lib from "../pklib";

class Folder {
  lib: Lib;
  base: string;
  customWrite: Function;

  constructor(lib: Lib) {
    this.lib = lib;
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
    if(this.customWrite) return this.customWrite(path, data, options)
    await fs.outputFile(this.toPath(path), data, options)
    return path;
  }

  async read(path: string, options?: object) {
    return await fs.readFileSync(this.toPath(path), options);
  }

  async fileExist(path: string) {
    return await fs.existsSync(this.toPath(path));
  }

  lsFiles = async (ext: string = "md") => {
    const { utils, cfg } = this.lib;
    const regex = `${this.base}/**/*.${ext}`;
    let list =  await utils.file.glob(regex);
    list = list.map((f: string) => f.replace(`${this.base}/`, ""));

    const includesExps = utils.a.asArray(cfg("vault.include") || []);
    const excludeExps = utils.a.asArray(cfg("vault.exclude") || []);

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

    return files;
  };

  async dumpAssets(index: any, encoding?: any) {
    const assets = Object.values(index);
    return Promise.all(
      assets.map(async (asset: any) => {
        const source = `${"foobar"}/${asset.path}`;
        const destination = asset.url;
        if (!destination || (await this.fileExist(destination))) return;

        const img = fs.readFileSync(source, { encoding });
        if (!img) return;
        await this.write(destination, img, { encoding });
        return destination;
      })
    );
  }

  async dumpNotes(index: any, encoding?: any) {
    const notes = Object.values(index);
    return Promise.all(
      notes.map(async (note: any) => {
        const { content, url } = note;
        if (!url || !content) return;
        await this.write(url, content);
        return url;
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
