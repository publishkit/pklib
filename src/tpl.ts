
// const tpl: { [key: string]: any; } = {}

// export default tpl


export const header = (data: any = {}) => {
  const { cfg: rawCfg } = data

  const double2singleQuote = (s: any) => (typeof s == 'string' ? s.replace(/"/g, "'") : s)
  const cfg = (k: any) => double2singleQuote(rawCfg(k))

  return `
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${rawCfg('title')}</title>
<meta name="description" content="${cfg('description') || cfg('site.description') || cfg('og.description') || ''}" />
<meta property="og:title" content="${cfg('og.title') || cfg('title')}" />
<meta property="og:description" content="${ cfg('og.description') || cfg('description') || cfg('site.description') || ''}" />${Object.entries(rawCfg('og', {})).reduce((acc, [key, value]) => {
    if(['title', 'description'].includes(key)) return acc
    return acc += `
<meta property="og:${key}" content="${double2singleQuote(value)}" />`
}, '')}
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/publishkit/sdk@latest/sdk.js"></script>
`
}
// <script type="text/javascript" src="http://localhost:1337/sdk.js"></script>


export const body = (data: any = {}) => `
<template id="frontmatter">\n${JSON.stringify(data.frontmatter)}\n</template>
<template id="content">\n${data.body}\n</template>`
// <template id="tags">\n${JSON.stringify(data.tags)}\n</template>

export const html = (data: any = {}) => `<!DOCTYPE html>
<html>
    <head>${data.head}</head>
    <body>\n${data.body}\n</body>
</html>`





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
    exclude: 
      - '^kit/'
      - '^templates/'
      - '^test/'

# 🚀 PublishKit

pk:
  version: latest
  dirs: true


# 🔱 Site

site:
  id: ${data.site.id}
  name: ${data.site.name}
  description: Welcome to ${data.site.name}
  url: https://publishkit.dev
  theme: default


# 📦 Plugins

plugins: 
  header: true
  modal: true
  fonts: true
  darkmode: true
  navbar: true
  toc: true
  search: true
  social: true
  highlight: true


# ⚙️  Plugins settings

header:
  fluid: true
  contrast: true

fonts:
  font: Marcher
  headings: Marcher

highlight:
  theme: arta

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

You can find more about settings [here](https://publishkit.dev/settings).`



export const navbar = () => `
- [ ] welcome
	- [[index|PublishKit]] || paper-plane
	- [[settings|Settings]] || cog
	- [[themes/index|Themes]] || palette
	- [[plugins/index|Plugins]] || package
	- [[showcase|Showcase]] ||  category
	- [[pricing|Pricing]] || dollar-circle
	- [[contact|Contact]] || envelope
`