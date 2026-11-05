// Título de cada página (clave de traducción). Lo usan la app (LangLayout)
// y el build (scripts/spa-routes.mjs) para que Google vea títulos distintos.
export const SERVICES = ['call', 'intuitiveDance', 'orientalIntuitive', 'pilatesOnline', 'tarot', 'pendulum',
  'akashic', 'spiritualCoaching', 'empowerment']

const BRAND = 'Le Papillon Danse 66'

// ruta sin idioma → [clave, ¿agregar la marca al final?]
export const PAGE_TITLES = {
  '': ['meta.title', false],
  sully: ['sully.title', true],
  cours: ['courses.title', true],
  soins: ['services.metaTitle', false],
  evenements: ['events.metaTitle', false],
  'en-ligne': ['online.title', true],
  contact: ['contact.title', true],
  inscription: ['signup.title', true],
  reserver: ['booking.metaTitle', false],
  'reserver/annuler': ['booking.cancel.metaTitle', false],
}

// Páginas que no tienen sentido en Google
export const NOINDEX = ['reserver/annuler']

export function pageTitle(rest, t) {
  const key = rest.startsWith('reserver/') && rest !== 'reserver/annuler' ? 'reserver' : rest
  const [k, brand] = PAGE_TITLES[key] ?? PAGE_TITLES['']
  return brand ? `${t(k)} | ${BRAND}` : t(k)
}
