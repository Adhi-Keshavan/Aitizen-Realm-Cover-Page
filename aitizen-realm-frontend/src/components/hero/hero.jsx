import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { CHAPTERS, getChapterIndex } from './chapters'
import './hero.css'

const RealmScene = lazy(() => import('./RealmScene'))
const links = [['idea', 'The idea'], ['agents', 'Citizens'], ['how-it-works', 'Systems'], ['project-info', 'Research']]
const stages = ['Senses', 'Memory', 'Reasoning', 'Decision', 'Action', 'Evolution']

export default function Hero() {
  const containerRef = useRef(null)
  const progressRef = useRef(0)
  const redrawRef = useRef(null)
  const menuButton = useRef(null)
  const [chapter, setChapter] = useState(0)
  const [motion, setMotion] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [dispersed, setDispersed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const current = CHAPTERS[chapter]

  useEffect(() => {
    const container = containerRef.current
    let frame = 0
    const measure = () => {
      frame = 0
      const distance = container.offsetHeight - container.firstElementChild.clientHeight
      const progress = Math.max(0, Math.min(1, -container.getBoundingClientRect().top / Math.max(1, distance)))
      progressRef.current = progress
      container.style.setProperty('--journey', progress)
      setChapter(getChapterIndex(progress))
      redrawRef.current?.()
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(measure) }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setMotion(!preference.matches)
    measure()
    preference.addEventListener('change', updatePreference)
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      cancelAnimationFrame(frame)
      preference.removeEventListener('change', updatePreference)
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [menuOpen])

  const visit = id => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant' })
  }
  const goToChapter = index => {
    setMenuOpen(false)
    const container = containerRef.current
    const distance = container.offsetHeight - container.firstElementChild.clientHeight
    const top = window.scrollY + container.getBoundingClientRect().top + CHAPTERS[index].stop * distance
    window.scrollTo({ top, behavior: motion ? 'smooth' : 'instant' })
  }
  return (
    <section id="realm" className={'realm-film' + (motion ? '' : ' realm-film--still')} ref={containerRef} aria-label="AITIZEN REALM">
      <div className="realm-film__viewport">
        <header className="realm-film__header">
          <button className="realm-film__brand" onClick={() => goToChapter(0)} aria-label="AITIZEN REALM home">
            <img src="/aitizen-realm-logo.png" alt="" width="42" height="42" />
            <span>AITIZEN REALM</span>
          </button>
          <nav className="realm-film__nav" aria-label="Primary navigation">
            <button onClick={() => goToChapter(3)}>World</button>
            {links.map(([id, label]) => <button key={id} onClick={() => visit(id)}>{label}</button>)}
          </nav>
          <button className="realm-film__observer realm-film__header-cta" onClick={() => visit('agents')}>Observer</button>
          <button ref={menuButton} className="realm-film__menu-toggle" aria-expanded={menuOpen} aria-controls="realm-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close' : 'Menu'}</button>
        </header>
        <nav id="realm-mobile-menu" className="realm-film__mobile-menu" hidden={!menuOpen} aria-label="Mobile navigation">
          <button onClick={() => goToChapter(3)}>World</button>
          {links.map(([id, label]) => <button key={id} onClick={() => visit(id)}>{label}</button>)}
        </nav>
        <div className={'realm-film__art' + (chapter ? ' realm-film__art--ribbon' : '')} aria-hidden="true">
          {chapter > 0 && <div className="realm-film__horizon"><span>MATTER ◇ SYSTEM ◇ ORDER ◇ MATTER ◇ SYSTEM</span></div>}
          <Suspense fallback={null}>
            <RealmScene progressRef={progressRef} redrawRef={redrawRef} motion={motion} dispersed={dispersed} />
          </Suspense>
          {chapter === 1 && <ol className="realm-film__stages">{stages.map((stage, i) => <li key={stage}><small>0{i + 1}</small>{stage}</li>)}</ol>}
        </div>
        <div className="realm-film__copy">
          <p className="realm-film__edition">0{chapter + 1} / 04 <span>{current.name}</span></p>
          <h1>A world.<br />With a mind<br />of its own.</h1>
          <p className="realm-film__description" key={chapter}>{current.copy}</p>
          <button className="realm-film__observer realm-film__main-cta" onClick={() => visit('agents')}>Observer <span aria-hidden="true">→</span></button>
        </div>
        <footer className="realm-film__footer">
          <nav className="realm-film__chapters" aria-label="Cover chapters">
            {CHAPTERS.map(({ name, short }, i) => <button key={name} onClick={() => goToChapter(i)} aria-label={name} aria-current={chapter === i ? 'step' : undefined}><small>0{i + 1}</small>{short}</button>)}
          </nav>
          <div className="realm-film__tools">
            <button onClick={() => setDispersed(!dispersed)} aria-pressed={dispersed}>{dispersed ? 'Reassemble' : 'Disperse'}</button>
            <button onClick={() => setMotion(!motion)} aria-pressed={motion}>Motion {motion ? 'on' : 'off'}</button>
            <button onClick={() => chapter < 3 ? goToChapter(chapter + 1) : visit('idea')}>{chapter < 3 ? 'Next' : 'The idea'} ↓</button>
          </div>
        </footer>
        <div className="realm-film__progress" aria-hidden="true"><i /></div>
      </div>
    </section>
  )
}
