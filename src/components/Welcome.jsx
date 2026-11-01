import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { playMusic } from '../lib/music'
import FlutterLogo from './FlutterLogo'
import OrnateButton from './OrnateButton'

// Pantalla de bienvenida con el logo. Al tocar "Entrer" se abre la página
// y arranca la música (ese toque es el permiso que piden los navegadores).
// El contenido del sitio se carga igual por debajo, así Google lo lee.
export default function Welcome() {
  const { t } = useTranslation()
  const [state, setState] = useState('open') // open | closing | closed
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
      className={`welcome sky ${state === 'closing' ? 'welcome--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Le Papillon Danse 66"
      onKeyDown={(e) => e.key === 'Escape' && enter(false)}
    >
      <FlutterLogo className="welcome__logo" />
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
