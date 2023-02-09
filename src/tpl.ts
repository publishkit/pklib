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

// tpl.navbar = () => `
// - [ ] welcome
// 	- [[index|PublishKit]] || paper-plane
// 	- [[settings|Settings]] || cog
// 	- [[themes/index|Themes]] || palette
// 	- [[plugins/index|Plugins]] || package
// 	- [[showcase|Showcase]] ||  category
// 	- [[pricing|Pricing]] || dollar-circle
// 	- [[contact|Contact]] || envelope
// `

export const pkrc = (data: any = {}) => `---

# 📂 Vault

vault:
    export_folder: ${data.vault.export_folder}
    include: 
      - '^pkrc.md'
      - '^(index|navbar).md$'
      - '^blog/'
    exclude: 
      - '^kit/'
      - '^templates/'
      - '^blog/draft'

# 🚀 PublishKit

pk:
  version: latest
  dirs: true


# 🔱 Site

site:
  id: ${data.site.id}
  name: ${data.site.name}
  description: Welcome to ${data.site.name}
  url: https://your-site-domain.com


# 📦 Plugins

plugins: 
  theme: "@default"
  header: true
  modal: true
  darkmode: true
  navbar: true
  toc: true
  search: true
  social: true


# ⚙️  Plugins settings

header:
  fluid: true
  contrast: true

social:
  github: https://publishkit.dev
  discord: https://publishkit.dev

search:
  chars: 3
  fuzzy: 0.2
  padding: 40
  max_results: 5

---

# PublishKit Global Settings


To change some settings, just edit the frontmatter variables on top of this file and export it.

You can find more about settings [here](https://publishkit.dev/settings).`;

export const navbar = () => `
- [ ] welcome
	- [[index|PublishKit]] || paper-plane
	- [[settings|Settings]] || cog
	- [[themes/index|Themes]] || palette
	- [[plugins/index|Plugins]] || package
	- [[showcase|Showcase]] ||  category
	- [[pricing|Pricing]] || dollar-circle
	- [[contact|Contact]] || envelope
`;
