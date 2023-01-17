const JQ = require("jquery");

export const asArray = (
  input: string | string[] | undefined,
  { delim = ",", trim = true, uniq = true, compact = true } = {}
): any[] => {
  if (!input) return [];
  let output = typeof input == "string" ? input.split(delim) : input || [];

  if (trim) output = output.map((v) => v?.trim?.() || v);
  if (compact) output = output.filter(Boolean);
  if (uniq) output = [...new Set(output)];

  return output;
};

export const unique = (array: any[]): any[] => {
  var a = array.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1);
    }
  }
  return a;
};

// flaten, truthy, unique
export const clean = (array: any[]) => unique(array.flat().filter(Boolean));