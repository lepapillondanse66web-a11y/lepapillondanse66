// Después de `vite build`:
//  1. Crea un .html por ruta (/fr/soins.html, etc.) para que los links
//     directos funcionen en cualquier hosting estático, cada uno con su título,
//     descripción, idioma y enlaces a las otras versiones (lo que lee Google).
//  2. Escribe robots.txt y sitemap.xml.
//
// Variables de entorno (en Render → Environment):
//   SITE_URL   dominio público (por defecto https://www.lepapillondanse66.com)
//   SEO_INDEX  "false" para sacar el sitio de Google (por ejemplo en una copia de prueba)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { NOINDEX, SERVICES, pageTitle } from '../src/config/seo.js'

const SITE_URL = (process.env.SITE_URL || 'https://www.lepapillondanse66.com').replace(/\/$/, '')
const INDEX = process.env.SEO_INDEX !== 'false'
const LANGS = ['fr', 'es', 'en', 'ar']
const DEFAULT_LANG = 'fr'
const PAGES = ['', 'sully', 'cours', 'cours-danse-orientale-perpignan', 'soins', 'evenements', 'en-ligne', 'contact', 'inscription',
  'reserver', 'reserver/annuler', ...SERVICES.map((s) => `reserver/${s}`)]
const dist = 'dist'

const base = (await readFile(join(dist, 'index.html'), 'utf8')).replace(/__SITE__/g, SITE_URL)
const locales = Object.fromEntries(await Promise.all(LANGS.map(async (l) =>
  [l, JSON.parse(await readFile(`src/i18n/locales/${l}.json`, 'utf8'))])))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const urlFor = (lang, page) => `${SITE_URL}/${lang}${page ? `/${page}` : ''}`
const translator = (lang) => (key) => key.split('.').reduce((o, k) => o?.[k], locales[lang]) ?? key

function render(lang, page) {
  const t = translator(lang)
  const title = esc(pageTitle(page, t))
  const desc = esc(t('meta.description'))
  const noindex = !INDEX || NOINDEX.includes(page)
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}" />`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${urlFor(DEFAULT_LANG, page)}" />`)
    .join('\n    ')
  return base
    .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`)
    .replace(/https:\/\/lepapillondanse66-5lye\.onrender\.com|__SITE__/g, SITE_URL)
    .replace('</head>', `    <link rel="canonical" href="${urlFor(lang, page)}" />
    <meta property="og:url" content="${urlFor(lang, page)}" />
    ${alternates}${noindex ? '\n    <meta name="robots" content="noindex" />' : ''}
  </head>`)
}

for (const lang of LANGS) {
  for (const page of PAGES) {
    // /es/sully → dist/es/sully.html. Cloudflare Pages lo sirve en /es/sully;
    // con una carpeta /es/sully/index.html redirigiría a /es/sully/ (con barra)
    const file = `${join(dist, lang, page)}.html`.replace(/\/\.html$/, '.html')
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, render(lang, page))
  }
}

// Raíz, panel y 404: nunca en Google
const hidden = base.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>')
await writeFile(join(dist, 'admin.html'), hidden)
await writeFile(join(dist, '404.html'), hidden)
await writeFile(join(dist, 'index.html'), INDEX ? render(DEFAULT_LANG, '') : hidden)

// robots.txt: en prueba solo entran los robots de vista previa de links
await writeFile(join(dist, 'robots.txt'), INDEX
  ? `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  : `# Versión de prueba: los buscadores no entran (activar con SEO_INDEX=true)
User-agent: LinkedInBot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: *
Disallow: /
`)

// sitemap.xml con las 4 versiones de cada página
const today = new Date().toISOString().slice(0, 10)
const urls = PAGES.filter((p) => !NOINDEX.includes(p)).flatMap((page) => LANGS.map((lang) => `  <url>
    <loc>${urlFor(lang, page)}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}" />`).join('\n')}
  </url>`))
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`)

console.log(`Rutas SPA generadas · Google: ${INDEX ? 'abierto' : 'cerrado (prueba)'} · ${SITE_URL}`)
