import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../config/site'
import InPerson from '../components/InPerson'
import OrnateButton from '../components/OrnateButton'
import BookLink from '../components/BookLink'
import SafeImg from '../components/SafeImg'

// EJEMPLO (solo en francés): página pensada para la búsqueda
// "cours de danse orientale Perpignan". Está con noindex hasta que Zulgey la apruebe.
// Lo marcado como À CONFIRMER hay que completarlo con datos de ella.

const URL = 'https://www.lepapillondanse66.com/fr/cours-danse-orientale-perpignan'
const TITLE = 'Cours de danse orientale à Perpignan | Le Papillon Danse 66'
const DESC = 'Cours de danse orientale et de danse intuitive à Perpignan pour toutes les femmes, débutantes ou confirmées. Lundi 18h et mercredi 11h, Salle Sweet Om.'

const FAQ = [
  ['Faut-il avoir déjà dansé ?',
    'Non. Les cours sont ouverts à toutes les femmes, quel que soit leur âge ou leur niveau. On avance à votre rythme, sans jugement.'],
  ['Comment se passe une séance ?',
    'On commence par la préparation corporelle, un échauffement intuitif pour se reconnecter à son corps. Puis on danse : danse intuitive et danse orientale intuitive, dans la même séance.'],
  ['Que faut-il apporter ?',
    'Une tenue confortable et une bouteille d\'eau. À CONFIRMER : foulard à sequins, pieds nus ou chaussons ?'],
  ['Y a-t-il un cours d\'essai ?',
    'À CONFIRMER : la première séance d\'essai est-elle offerte ?'],
  ['Combien coûtent les cours ?',
    'À CONFIRMER : tarif à la séance, au mois ou au trimestre.'],
  ['Où se garer ?',
    'Au Lidl ou dans les rues alentour de la Salle Sweet Om.'],
]

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Cours de danse orientale à Perpignan',
    description: DESC,
    url: URL,
    inLanguage: 'fr',
    provider: { '@type': 'DanceSchool', name: 'Le Papillon Danse 66', url: 'https://www.lepapillondanse66.com/fr' },
    hasCourseInstance: [
      { '@type': 'CourseInstance', courseMode: 'onsite', courseSchedule: { '@type': 'Schedule', byDay: 'https://schema.org/Monday', startTime: '18:00', endTime: '19:15', repeatFrequency: 'P1W' },
        location: { '@type': 'Place', name: 'Salle Sweet Om « Centre del Món »', address: '1 bis rue de la Pépinière Robin, 66000 Perpignan' } },
      { '@type': 'CourseInstance', courseMode: 'onsite', courseSchedule: { '@type': 'Schedule', byDay: 'https://schema.org/Wednesday', startTime: '11:00', endTime: '12:00', repeatFrequency: 'P1W' },
        location: { '@type': 'Place', name: 'Salle Sweet Om « Centre del Món »', address: '1 bis rue de la Pépinière Robin, 66000 Perpignan' } },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.filter(([, a]) => !a.includes('À CONFIRMER')).map(([q, a]) => ({
      '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
]

export default function DanseOrientale() {
  return (
    <section className="block sky lp">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <link rel="canonical" href={URL} />
        <meta name="robots" content="noindex" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <p className="lp__eyebrow">Perpignan · Pyrénées-Orientales</p>
      <h1 className="block__title">Cours de danse orientale à Perpignan</h1>
      <p className="info">
        Le Papillon Danse 66 propose des cours de <strong>danse orientale</strong> et de{' '}
        <strong>danse intuitive</strong> pour toutes les femmes, débutantes ou confirmées.
        Un espace bienveillant pour bouger, se reconnecter à son corps et révéler sa féminité.
      </p>

      <div className="lp__intro">
        <SafeImg className="lp__img" src="/images/course-orientale.jpg" alt="Cours de danse orientale à Perpignan avec Sully" loading="lazy" />
        <div className="lp__text">
          <h2 className="lp__h2">Une danse orientale intuitive</h2>
          <p>
            Avec Sully, la danse orientale ne se résume pas à des chorégraphies : on explore les
            mouvements ancestraux — ondulations, isolations, déplacements — en écoutant ce que le
            corps a envie d'exprimer. Chaque séance mêle technique et liberté.
          </p>
          <ul className="lp__list">
            <li>Ouvert à toutes les femmes, sans limite d'âge</li>
            <li>Aucune expérience nécessaire</li>
            <li>Petits groupes, accompagnement personnalisé</li>
            <li>Préparation corporelle incluse dans chaque séance</li>
          </ul>
        </div>
      </div>

      <InPerson />

      <div className="lp__faq">
        <h2 className="lp__h2">Questions fréquentes</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="lp__q">
            <summary>{q}</summary>
            <p className={a.includes('À CONFIRMER') ? 'lp__todo' : undefined}>{a}</p>
          </details>
        ))}
      </div>

      <p className="center">
        <BookLink>Réserver ma place</BookLink>
      </p>
      <p className="center">
        <OrnateButton as={Link} size="sm" to="/fr/cours">Tous les cours et ateliers</OrnateButton>
      </p>
      <p className="lp__note">{SITE.studio.name} — {SITE.studio.street}, {SITE.studio.city}</p>
    </section>
  )
}
