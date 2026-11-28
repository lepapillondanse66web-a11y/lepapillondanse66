import { useEffect, useRef } from 'react'
import { IMAGES } from '../config/site'

// Vuelo de la intro: una curva suave (Catmull-Rom) que pasa por varios puntos
// de la pantalla y termina exactamente en el lugar de la mariposa en el logo.
// Se calcula según el tamaño de la pantalla y se anima con el navegador.
const FLY_DELAY = 200
const FLY_DURATION = 3200
function flightKeyframes(w, h) {
  const pts = [
    [-0.55 * w, 0.6 * h],
    [-0.32 * w, 0.12 * h],
    [0.05 * w, -0.12 * h],
    [0.28 * w, -0.06 * h],
    [0.16 * w, 0.14 * h],
    [0, 0],
  ]
  const P = [pts[0], ...pts, pts[pts.length - 1]]
  const segs = pts.length - 1
  const at = (t) => {
    const f = Math.min(t * segs, segs - 1e-6)
    const i = Math.floor(f)
    const u = f - i
    const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]]
    return [0, 1].map((k) =>
      0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u))
  }
  const N = 72
  const frames = []
  for (let n = 0; n <= N; n++) {
    const t = n / N
    const [x, y] = at(t)
    const [x2, y2] = at(Math.min(1, t + 0.01))
    const vx = x2 - x
    const speed = Math.hypot(vx, y2 - y) || 1
    const calm = Math.min(1, (1 - t) * 5) // se endereza al posarse
    const tilt = Math.max(-16, Math.min(16, (vx / speed) * 16)) * calm
    const bob = Math.sin(t * Math.PI * 7) * 10 * calm // sube y baja al aletear
    const scale = 0.45 + 0.55 * t * t
    const glow = 0.85 * calm
    frames.push({
      offset: t,
      opacity: Math.min(1, t / 0.08),
      transform: `translate(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
      filter: `drop-shadow(0 0 ${(14 * calm).toFixed(1)}px rgb(255 228 170 / ${glow.toFixed(2)}))`,
    })
  }
  return frames
}


// Logo con las alas de la mariposa en movimiento.
// Son 4 capas del mismo tamaño, una encima de otra:
//   base (el logo sin alas) → ala izquierda → ala derecha → frente
// "frente" tiene el cuerpo de la mariposa, el brazo, la cara y el pelo de la
// bailarina, para que queden por delante de las alas al moverse.
// En la intro de bienvenida (intro=true) la mariposa entra volando y se
// posa en el logo, que aparece suavemente mientras tanto.
// Las capas se generaron a partir de logo.png (scripts/split-logo-wings.py).
export default function FlutterLogo({ className = '', alt = 'Le Papillon Danse', intro = false }) {
  const fly = useRef(null)

  useEffect(() => {
    const el = fly.current
    if (!intro || !el || !el.animate) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const anim = el.animate(flightKeyframes(window.innerWidth, window.innerHeight), {
      duration: FLY_DURATION,
      delay: FLY_DELAY,
      easing: 'cubic-bezier(0.33, 0.1, 0.3, 1)', // arranca parejo y frena suave al posarse
      fill: 'backwards',
    })
    return () => anim.cancel()
  }, [intro])

  return (
    <span className={`flutter ${intro ? 'flutter--intro' : ''} ${className}`} role="img" aria-label={alt}>
      <img className="flutter__base" src={IMAGES.logoLayers.base} alt="" width="591" height="751" />
      {/* La mariposa: alas, antenas con la cabeza (y en la intro, el cuerpo) se mueven juntas */}
      <span className="flutter__fly" ref={fly}>
        <img className="flutter__layer flutter__wing flutter__wing--l" src={IMAGES.logoLayers.wingL} alt="" />
        <img className="flutter__layer flutter__wing flutter__wing--r" src={IMAGES.logoLayers.wingR} alt="" />
        <img className="flutter__layer" src={IMAGES.logoLayers.antennae} alt="" />
        {intro && <img className="flutter__layer flutter__body" src={IMAGES.logoLayers.front} alt="" />}
      </span>
      <img className="flutter__layer flutter__front" src={IMAGES.logoLayers.front} alt="" />
      {intro && (
        <>
          {/* Brillo final que cruza el logo (solo sobre el dibujo, no el fondo) */}
          <span className="flutter__shine" style={{ '--logo-mask': `url(${IMAGES.logo})` }} aria-hidden="true" />
          {/* Destello de la gema del centro de la mariposa */}
          <span className="flutter__glint" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path d="M20 0 C21.2 14 26 18.8 40 20 C26 21.2 21.2 26 20 40 C18.8 26 14 21.2 0 20 C14 18.8 18.8 14 20 0Z" />
            </svg>
          </span>
        </>
      )}
    </span>
  )
}
