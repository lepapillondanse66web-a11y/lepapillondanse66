import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Trans, useTranslation } from 'react-i18next'
import { SITE } from '../config/site'
import InPerson from '../components/InPerson'
import OrnateButton from '../components/OrnateButton'
import BookLink from '../components/BookLink'
import SafeImg from '../components/SafeImg'

// Página pensada para la búsqueda "cours de danse orientale Perpignan".
// Está con noindex hasta que Zulgey la apruebe. Lo que está entre [corchetes]
// en las traducciones (clave "lp") falta confirmarlo con ella.

const SLUG = 'cours-danse-orientale-perpignan'
const isTodo = (s) => s.includes('[')

export default function DanseOrientale() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const url = `${SITE.url}/${lang}/${SLUG}`
  const faq = t('lp.faq', { returnObjects: true })
  const points = t('lp.points', { returnObjects: true })
  const place = { '@type': 'Place', name: SITE.studio.name, address: `${SITE.studio.street}, ${SITE.studio.city}` }
  const slot = (day, startTime, endTime) => ({
    '@type': 'CourseInstance', courseMode: 'onsite', location: place,
    courseSchedule: { '@type': 'Schedule', byDay: `https://schema.org/${day}`, startTime, endTime, repeatFrequency: 'P1W' },
  })
  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'Course', inLanguage: lang, url,
      name: t('lp.title'), description: t('lp.metaDescription'),
      provider: { '@type': 'DanceSchool', name: 'Le Papillon Danse 66', url: `${SITE.url}/${lang}` },
      hasCourseInstance: [slot('Monday', '18:00', '19:15'), slot('Wednesday', '11:00', '12:00')],
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.filter(([, a]) => !isTodo(a)).map(([q, a]) => ({
        '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]

  return (
    <section className="block sky lp">
      <Helmet>
        <title>{t('lp.metaTitle')}</title>
        <meta name="description" content={t('lp.metaDescription')} />
        <meta property="og:title" content={t('lp.metaTitle')} />
        <meta property="og:description" content={t('lp.metaDescription')} />
        <link rel="canonical" href={url} />
        <meta name="robots" content="noindex" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <p className="lp__eyebrow">{t('lp.eyebrow')}</p>
      <h1 className="block__title">{t('lp.title')}</h1>
      <p className="info">
        <Trans i18nKey="lp.intro" components={{ b: <strong /> }} />
      </p>

      <div className="lp__intro">
        <SafeImg className="lp__img" src="/images/course-orientale.jpg" alt={t('lp.imgAlt')} loading="lazy" />
        <div className="lp__text">
          <h2 className="lp__h2">{t('lp.h2')}</h2>
          <p>{t('lp.text')}</p>
          <ul className="lp__list">
            {points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>

      <InPerson />

      <div className="lp__faq">
        <h2 className="lp__h2">{t('lp.faqTitle')}</h2>
        {faq.map(([q, a]) => (
          <details key={q} className="lp__q">
            <summary>{q}</summary>
            <p className={isTodo(a) ? 'lp__todo' : undefined}>{a}</p>
          </details>
        ))}
      </div>

      <p className="center">
        <BookLink>{t('lp.book')}</BookLink>
      </p>
      <p className="center">
        <OrnateButton as={Link} size="sm" to={`/${lang}/cours`}>{t('lp.all')}</OrnateButton>
      </p>
      <p className="lp__note" dir="ltr">{SITE.studio.name} — {SITE.studio.street}, {SITE.studio.city}</p>
    </section>
  )
}
