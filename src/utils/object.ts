import { asArray } from "./array";

export const isObject = (item: any): boolean => {
  return item && typeof item === "object" && !Array.isArray(item);
};

export const merge = (
  target: ObjectAny,
  ...sources: ObjectAny[]
): ObjectAny => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
};

// dot notation object get
export const get = (obj: ObjectAny, path: string) =>
  path.split(".").reduce((acc, part) => acc && acc[part], obj);

// let lunch = {};
// put(lunch, 'sandwich.toppings[]', 'mayo');
// put(lunch, 'sandwich.toppings[]', 'tomato');
// put(lunch, 'sides.chips', 'Cape Cod');
// put(lunch, 'sides.cookie', true);
// put(lunch, 'sides.drink', 'soda');
export const put = (obj: ObjectAny, path: any, val: any) => {
  function stringToPath(path: any) {
    if (typeof path !== "string") return path;

    let output: any[] = [];

    path.split(".").forEach(function (item) {
      item.split(/\[([^}]+)\]/g).forEach(function (key) {
        if (key.length > 0) output.push(key);
      });
    });

    return output;
  }

  path = stringToPath(path);

  let length = path.length;
  let current = obj;

  // @ts-ignore
  path.forEach(function (key, index) {
    let isArray = key.slice(-2) === "[]";
    key = isArray ? key.slice(0, -2) : key;

    if (isArray && !Array.isArray(current[key])) current[key] = [];
    if (index === length - 1) {
      if (isArray) current[key].push(val);
      else current[key] = val;
    } else {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
  });
};


export const clone = (o: ObjectAny, del?: string) => {
    const remove = del ? asArray(del) : []
    const copy = JSON.parse(JSON.stringify(o))
    remove.forEach(k => (delete copy[k]))
    return copy
}