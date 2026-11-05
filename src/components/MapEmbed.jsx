import { SITE } from '../config/site'

// Los navegadores internos de Instagram, Facebook y otras apps bloquean el mapa
// de Google insertado (ERR_BLOCKED_BY_RESPONSE). Ahí mostramos una tarjeta que
// abre Google Maps aparte.
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|MicroMessenger|TikTok|Snapchat|; wv\)/i

export function isInAppBrowser() {
  return typeof navigator !== 'undefined' && IN_APP.test(navigator.userAgent)
}

export default function MapEmbed({ className }) {
  const { studio } = SITE

  if (isInAppBrowser()) {
    return (
      <a
        className={`${className} map-card`}
        href={studio.directions}
        target="_blank"
        rel="noopener"
      >
        <svg className="map-card__pin" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        <span className="map-card__name">{studio.name}</span>
        <span className="map-card__addr" dir="ltr">{studio.street}, {studio.city}</span>
        <span className="map-card__cta">Google Maps →</span>
      </a>
    )
  }

  return (
    <iframe
      className={className}
      title={studio.name}
      src={studio.mapEmbed}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}
