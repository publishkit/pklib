import fs from "../utils/fs";
import PKLib from "../pklib";

class DB {
  name: string;
  data: ObjectAny;
  base: string;

  constructor(name: string) {
    this.name = name;
    this.data = {};
  }

  setBase(path: string) {
    this.base = path || this.base;
  }

  toPath() {
    if (!this.base) throw new Error("db has no base");
    return `${this.base}/${this.name}.json`;
  }

  get(col: string, key?: string) {
    const data = this.data[col] || {};
    const value = key ? data[key] : data;
    return data;
  }

  set(col: string, key: string, value: any) {
    const data = this.data[col] || {};
    data[key] = value;
    this.data[col] = data;
  }

  unset(col: string, key: string) {
    const data = this.data[col] || {};
    delete data[key];
    this.data[col] = data;
  }

  async save() {
    const data = JSON.stringify(this.data);
    await fs.outputFile(this.toPath(), data);
  }

  async load() {
    const path = this.toPath();

    if (!(await fs.existsSync(path))) await fs.outputFile(path, "{}");
    try {
      this.data = JSON.parse(await fs.readFile(path, "utf8"));
    } catch (error) {
      throw new Error("db.load failed");
    }
  }
}

export default DB;
