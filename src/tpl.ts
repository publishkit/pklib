// const tpl: { [key: string]: any; } = {}

// export default tpl

export const header = (data: any = {}) => {
  const { cfg: cfg } = data;

  const double2singleQuote = (s: any) =>
    typeof s == "string" ? s.replace(/"/g, "'") : s;
  const escaped = (k: any) => double2singleQuote(cfg(k));

  const getValue = (v: string) =>
    escaped(v) || escaped(`og.${v}`) || escaped(`site.${v}`) || "";

  const og = cfg("og", {});
  const meta = "url,title,description,image,name,keyswords"
    .split(",")
    .reduce((acc: ObjectAny, key) => {
      acc[key] = getValue(key);
      if ("url,title,description,image".includes(key)) og[key] = acc[key]; // og keys
      if (key == "name") og["site_name"] = acc[key]; // og remap
      return acc;
    }, {});

  const buildMeta = (index: ObjectAny, og?: boolean) =>
    Object.keys(index).reduce((acc, key: string) => {
      const prop = og ? "property" : "name";
      const value = og ? `og:${key}` : key;
      const content = index[key];
      return (acc +=
        (index[key] && `<meta ${prop}="${value}" content="${content}" />`) ||
        "");
    }, "");

  meta.viewport = "width=device-width, initial-scale=1, maximum-scale=1";
  const metaTags = buildMeta(meta);
  const ogTags = buildMeta(og, true);

  return `
<title>${cfg("title")}</title>
<meta charset="utf-8" />
${metaTags}
${ogTags}
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/publishkit/kit@latest/init.js"></script>
`;
};

export const body = (data: any = {}) => `
<template id="frontmatter">\n${JSON.stringify(data.frontmatter)}\n</template>
<template id="content">\n${data.body}\n</template>`;
// <template id="tags">\n${JSON.stringify(data.tags)}\n</template>

export const html = (data: any = {}) => `<!DOCTYPE html>
<html>
    <head>${data.head}</head>
    <body>\n${data.body}\n</body>
</html>`;


export const kitrc = (data: any = {}) => `---

# 📂 Vault

vault:
  kit_folder: ${data.vault.kit_folder}
  include: 
    - '^(kitrc|index|navbar).md$'
    - '^blog/'
    - '^notes/'
  exclude: 
    - '^kit/'
    - '^templates/'
    - '^blog/draft'


# 🧰 Kit

kit:
  version: latest
  dirs: false


# 🖥️ Site

site:
  id: ${data.site.id}
  name: ${data.site.name}
  description: Welcome to ${data.site.name}
  url: https://your-site-domain.com
  keyswords: publishkit, blogging, markdown

og:
  image: https://publishkit.dev/attachements/og-image.png


# 🔌 Plugins

plugins: 
  theme: "@default"
  header: true
  darkmode: true
  navbar: true
  toc: true
  search: true
  social: true


# ⚙️  Plugins settings

social:
  github: https://publishkit.dev
  discord: https://publishkit.dev

---

# KITRC

KITRC stands for Kit **R**un **C**ommands
It holds your site global configuration. 

To change settings or add plugins, simply edit the frontmatter variables on top of the file. When you are done, export the file in your kit by running the export command.

If your \`kitrc.md\` file is valid frontmatter wise, you should see a \`kitrc.json\` at the root of your kit folder after export.


Check out documentation at https://publishkit.dev`;








export const navbar = () => ``;
