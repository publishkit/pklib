interface Window {
  [key: string]: any;
}

interface ObjectAny {
  [key: string]: any;
}

interface Asset {
  type: string;
  path: string;
  filename: string;
  url: string;
  ext: string;
  hash: string;
  eat?: string;
  title?: string;
  tags?: string[];
  content?: string;
  text?: string;
  src?: string;
  err?: string;
  html?: string;
}

interface IndexCache {
  md: ObjectAny;
  image: ObjectAny;
  pdf: ObjectAny;
  note: ObjectAny;
  json: ObjectAny;
  error: ObjectAny;
}

interface ExportOptions {
  follow?: boolean;
  dry?: boolean;
  inspect?: boolean;
}

interface ParserRemovers {
  el?: string;
  class?: string;
  attr?: string;
  emptyAttr?: string;
}
