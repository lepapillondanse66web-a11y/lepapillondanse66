import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { playMusic } from '../lib/music'
import FlutterLogo from './FlutterLogo'
import OrnateButton from './OrnateButton'
import LanguageSwitcher from './LanguageSwitcher'

// Pantalla de bienvenida con el logo. Al tocar "Entrer" se abre la página
// y arranca la música (ese toque es el permiso que piden los navegadores).
// El contenido del sitio se carga igual por debajo, así Google lo lee.
export default function Welcome() {
  const { t } = useTranslation()
  const [state, setState] = useState('open') // open | closing | closed
  // La intro de la mariposa se ve en las primeras 3 cargas de la visita
  // (entrar y recargar); después la bienvenida aparece directo
  const INTRO_VECES = 3
  const [intro] = useState(() => {
    try {
      return Number(sessionStorage.getItem('papillon-intro') || 0) < INTRO_VECES
    } catch {
      return true
    }
  })
  useEffect(() => {
    try {
      const n = Number(sessionStorage.getItem('papillon-intro') || 0)
      sessionStorage.setItem('papillon-intro', String(n + 1))
    } catch {
      /* sin almacenamiento: se ve la intro siempre */
    }
  }, [])
  const button = useRef(null)

  useEffect(() => {
    if (state !== 'open') return
    document.body.style.overflow = 'hidden'
    // Foco en "Entrer" (para el teclado) sin mostrar el resplandor de foco
    button.current?.focus({ focusVisible: false })
    return () => {
      document.body.style.overflow = ''
    }
  }, [state])

  if (state === 'closed') return null

  const enter = (withMusic) => {
    if (withMusic) playMusic()
    setState('closing')
    setTimeout(() => setState('closed'), 700)
  }

  return (
    <div
      className={`welcome ${intro ? 'welcome--intro' : ''} sky ${state === 'closing' ? 'welcome--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Le Papillon Danse 66"
      onKeyDown={(e) => e.key === 'Escape' && enter(false)}
    >
      {/* Mismo selector y mismo lugar que en el encabezado del sitio */}
      <div className="welcome__lang">
        <LanguageSwitcher />
      </div>
      <FlutterLogo className="welcome__logo" intro={intro} />
      <OrnateButton ref={button} className="welcome__enter" onClick={() => enter(true)}>
        {t('welcome.enter')}
      </OrnateButton>
      <button type="button" className="welcome__silent" onClick={() => enter(false)}>
        {/* Parlante en silencio */}
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{t('welcome.enterSilent')}</span>
      </button>
    </div>
  )
}
