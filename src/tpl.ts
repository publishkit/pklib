
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
<link rel="apple-touch-icon" sizes="180x180" href="assets/favicons/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="32x32" href="assets/favicons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="assets/favicons/favicon-16x16.png" />
<script type="text/javascript" src="http://localhost:1337/sdk.js"></script>
`
}

// // <script type="text/javascript" src="https://cdn.jsdelivr.net/gh/publishkit/sdk@latest/sdk.js"></script>

export const body = (data: any = {}) => `
<template id="frontmatter">\n${JSON.stringify(data.frontmatter)}\n</template>
<template id="tags">\n${JSON.stringify(data.tags)}\n</template>
<template id="content">\n${data.body}\n</template>`

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
  cdnfonts: true
  darkmode: true
  navbar: true
  toc: true
  search: true
  social: true
  highlightjs: true


# ⚙️  Plugins settings

highlightjs:
  theme: arta

cdnfonts:
  font: Marcher

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