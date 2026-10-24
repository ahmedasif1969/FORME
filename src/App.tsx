import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, ArrowDown, Plus, X, Menu, Box, MoveUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import HeroSequence from './HeroSequence';
import HeroStory from './HeroStory';
import { createScrollStory } from './scrollStory';

const projects = [
  { name: 'The Meridian Residence', setting: 'Hillside retreat', image: '/media/residence.webp', description: 'A long, low silhouette follows the contours of the hillside. Open living spaces frame the landscape; sheltered terraces offer a slower rhythm of life.', materials: 'Natural stone / glass / water', number: '01' },
  { name: 'The Ridge House', setting: 'Above the valley', image: '/media/ridge.webp', description: 'A study in quiet contrast. Sculptural volumes and deep overhangs create a sheltered home at the meeting point of earth and sky.', materials: 'Board-formed concrete / oak / stone', number: '02' },
  { name: 'The Solstice Collection', setting: 'Courtyard living', image: '/media/interior.webp', description: 'Homes arranged around light. Private courtyards, tactile surfaces and planted thresholds bring a close connection to nature into everyday rituals.', materials: 'Limestone / timber / planted courtyards', number: '03' },
];

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState(0);
  const [menu, setMenu] = useState(false);
  const [formStatus, setFormStatus] = useState('');
  useEffect(() => {
    if (!menu) return;
    const dismiss = (event: PointerEvent) => {
      if (!(event.target as Element).closest('.nav')) setMenu(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
        root.current?.querySelector<HTMLButtonElement>('.menu-button')?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [menu]);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    let lenis: Lenis | undefined;
    const ticker = (time: number) => lenis?.raf(time * 1000);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lenis = new Lenis({ duration: 1.05, anchors: true, syncTouch: true });
      lenis.on('scroll', () => {
        // Clamp unfinished playback before ScrollTrigger can release its pin.
        window.dispatchEvent(new Event('hero-before-scroll'));
        ScrollTrigger.update();
      }); gsap.ticker.add(ticker); gsap.ticker.lagSmoothing(0);
    }
    const syncHeroScroll = (event: Event) => {
      const position = (event as CustomEvent<number>).detail;
      if (lenis) lenis.scrollTo(position, { immediate: true, force: true });
      else window.scrollTo({ top: position, behavior: 'instant' });
      ScrollTrigger.update();
    };
    window.addEventListener('hero-scroll-position', syncHeroScroll);
    const syncLoading = () => {
      if (document.documentElement.dataset.heroLoading) lenis?.stop();
      else lenis?.start();
    };
    syncLoading();
    window.addEventListener('hero-loading-change', syncLoading);
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        createScrollStory();
        gsap.utils.toArray<HTMLElement>('.reveal').forEach(el => {
          gsap.from(el, { y: 55, opacity: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 63%', scrub: 1 } });
        });
        gsap.utils.toArray<HTMLElement>('.image-reveal').forEach(el => {
          gsap.fromTo(el, { clipPath: 'inset(12% 7% 12% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 20%', scrub: true } });
          const image = el.querySelector('img');
          if (image) gsap.fromTo(image, { scale: 1.13, yPercent: -3 }, { scale: 1, yPercent: 3, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        gsap.fromTo('.feature-image', { scale: .88 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.featured', start: 'top 70%', end: 'top 5%', scrub: true } });
        gsap.utils.toArray<HTMLElement>('.principle').forEach(el => {
          gsap.fromTo(el, { opacity: .3 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 70%', end: 'top 40%', scrub: true } });
          const index = Number(el.dataset.principle);
          const activate = () => {
            gsap.to('.principle-visual img', { opacity: 0, duration: .5, overwrite: true });
            gsap.to(`.principle-visual img:nth-child(${index + 1})`, { opacity: 1, duration: .7, overwrite: true });
          };
          ScrollTrigger.create({ trigger: el, start: 'top 65%', end: 'bottom 45%', onEnter: activate, onEnterBack: activate });
        });
      }, root);
      return () => ctx.revert();
    });
    let mounted = true;
    document.fonts.ready.then(() => { if (mounted) ScrollTrigger.refresh(); });
    const progress = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { root.current?.style.setProperty('--page-progress', String(self.progress)); } });
    return () => { window.removeEventListener('hero-loading-change', syncLoading); window.removeEventListener('hero-scroll-position', syncHeroScroll); mounted = false; media.revert(); progress.kill(); gsap.ticker.remove(ticker); lenis?.destroy(); };
  }, []);

  const openProject = (index: number) => { setDetail(index); dialog.current?.showModal(); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setFormStatus('Your inquiry is ready. This is a portfolio demonstration; no message has been sent.');
  };
  return <div ref={root}>
    <a className="skip" href="#about">Skip to content</a>
    <div className="page-progress" aria-hidden="true" />
    <section className="hero" id="home" aria-label="The art of considered living">
      <picture className="hero-poster"><source media="(max-width: 767px)" srcSet="/media/poster-phone.webp"/><img src="/media/poster.webp" alt="Contemporary hillside residence overlooking a pool at dusk" fetchPriority="high"/></picture>
      <HeroSequence />
      <div className="hero-shade" />
      <header className={menu ? 'nav menu-open' : 'nav'}>
        <a className="brand" href="#home" aria-label="FORME Developments home"><span className="brand-mark"><Box strokeWidth={1.2}/></span><span>FORME<small>DEVELOPMENTS</small></span></a>
        <nav id="main-navigation" className={menu ? 'nav-links open' : 'nav-links'} aria-label="Main navigation"><a href="#projects" onClick={() => setMenu(false)}>Projects</a><a href="#about" onClick={() => setMenu(false)}>About Us</a><a href="#contact" onClick={() => setMenu(false)}>Contact</a></nav>
        <a className="pill" href="#contact">Book a Viewing <ArrowUpRight size={15}/></a>
        <button className="menu-button" aria-controls="main-navigation" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(value => !value)}>{menu ? <X/> : <Menu/>}</button>
      </header>
      <HeroStory />
      <div className="hero-bottom">
        <div className="hero-bottom-copy"><a href="#about">Discover FORME <ArrowDown size={15}/></a></div>
        <div className="sequence-status"><div><span className="micro">A closer look</span><span className="frame-number">00%</span></div><span className="sequence-rule"/><span className="micro">LANDSCAPE / ARCHITECTURE / LIFE</span></div>
      </div>
    </section>

    <main>
      <section className="philosophy section-pad" id="about">
        <div className="section-kicker"><span>THE FORME PHILOSOPHY</span><span>Built around what matters.</span></div>
        <div className="philosophy-story"><h2 className="reveal">LESS, BUT<br/><span className="muted">CONSIDERED.</span></h2>
        <p className="philosophy-statement" aria-label="Not more for the sake of more. Just the things that make a place feel like home.">{'Not more for the sake of more. Just the things that make a place feel like home.'.split(' ').map((word,i) => <span className="statement-word" aria-hidden="true" key={i}>{word} </span>)}</p></div>
        <div className="philosophy-layout"><div className="philosophy-copy reveal"><span className="small-cross">+</span><p>We believe the most meaningful spaces begin with a simple question: what belongs here?</p><p className="secondary">We take our cues from the land. From the way light falls across stone, to the shelter of a mature tree. Every material, every opening, every quiet detail has a reason.</p><a className="text-link" href="#principles">Our approach <ArrowUpRight size={17}/></a></div><figure className="philosophy-image image-reveal"><img src="/media/detail.webp" loading="lazy" alt="Stone terraces, planted landscape and glass walls of a contemporary home"/><figcaption>Shaped by landscape. Defined by light.</figcaption></figure></div>
        <div className="philosophy-foot"><span>CONTEXT COMES FIRST.</span><span>EVERY DETAIL FOLLOWS.</span></div>
      </section>

      <section className="featured" id="residence">
        <div className="feature-image"><img src="/media/residence.webp" loading="lazy" alt="The Meridian Residence, a contemporary villa with an illuminated pool"/></div>
        <div className="feature-shade"/>
        <div className="feature-top"><span>THE FEATURED RESIDENCE</span><span>HILLSIDE RETREAT</span></div>
        <div className="feature-content"><span className="feature-number">01</span><div><h2 className="reveal">THE MERIDIAN<br/>RESIDENCE</h2><p>A considered dialogue between<br/>architecture and the horizon.</p></div><button className="round-link" onClick={() => openProject(0)} aria-label="Explore The Meridian Residence"><MoveUpRight strokeWidth={1}/></button></div>
        <div className="feature-bottom"><span>STONE. LIGHT. OPEN SPACE.</span><button onClick={() => openProject(0)}>Explore Residence <ArrowUpRight size={16}/></button></div>
      </section>

      <section className="materials section-pad" id="materials"><div className="material-intro"><h2 className="reveal">THE BEAUTY<br/>IS IN THE <span className="muted">DETAIL.</span></h2><p>Honest materials. Thoughtful connections.<br/>A richness that reveals itself over time.</p></div><div className="material-grid"><figure className="stone image-reveal"><img src="/media/stone.webp" loading="lazy" alt="Tactile natural stone and warm light"/><figcaption><span>01 / NATURAL STONE</span><span>Character in every surface.</span></figcaption></figure><figure className="interior image-reveal"><img src="/media/interior.webp" loading="lazy" alt="Warm oak, limestone and glass framing a planted courtyard"/><figcaption><span>02 / TIMBER & LIGHT</span><span>Warmth without excess.</span></figcaption></figure><div className="material-note reveal"><Plus size={24} strokeWidth={1}/><p>Cool concrete meets warm oak. Glass opens to water and planting. Each material brings the others into focus.</p><span className="micro">MATERIALITY & CRAFT</span></div></div></section>

      <section className="projects section-pad" id="projects"><div className="projects-heading"><span className="micro">A COLLECTION OF DISTINCT PERSPECTIVES</span><h2 className="reveal">SELECTED<br/>DEVELOPMENTS<span className="project-total">(03)</span></h2></div><div className="project-gallery">{projects.map((project, i) => <button className={`project-tile project-${i}`} key={project.name} onClick={() => openProject(i)}><div className="tile-image"><img src={project.image} loading="lazy" alt={project.name}/><span className="tile-arrow"><ArrowUpRight/></span></div><div className="tile-info"><span>{project.number}</span><div><h3>{project.name}</h3><p>{project.setting}</p></div><Plus size={17}/></div></button>)}</div><p className="concept-note">An architectural concept collection. All developments are fictional.</p></section>

      <section className="principles section-pad" id="principles"><div className="principles-aside"><span className="micro">THE WAY WE THINK</span><h2>GOOD DESIGN<br/>BEGINS WITH<br/><span className="muted">INTENTION.</span></h2><div className="principle-visual"><img src="/media/landscape.webp" loading="lazy" alt="Hillside landscape around the residence"/><img src="/media/stone.webp" loading="lazy" alt="Natural stone craftsmanship"/><img src="/media/interior.webp" loading="lazy" alt="Enduring natural materials in the residence"/></div></div><div className="principle-list">{[{title:'Context',body:'Architecture shaped by its surroundings. We begin with the contours, the climate and the character of a place.'},{title:'Craft',body:'Material quality and thoughtful detailing. Care is visible in the things you touch, and the things you never notice.'},{title:'Permanence',body:'Spaces designed to endure. A restrained palette and adaptable spaces, conceived for the years ahead.'}].map((p,i) => <article className="principle" data-principle={i} key={p.title}><span>0{i+1}</span><div><h3>{p.title}</h3><p>{p.body}</p></div><Plus size={19}/></article>)}</div></section>

      <section className="contact section-pad" id="contact"><div className="contact-backdrop"/><div className="contact-title"><span className="micro">YOUR NEXT CHAPTER</span><h2 className="reveal">BUILT TO BELONG.<br/>MADE TO ENDURE.</h2><p>For a new home, a shared vision, or a conversation about what comes next.</p></div><form onSubmit={submit} className="contact-form"><div className="form-row"><label>Name<input name="name" autoComplete="name" required maxLength={100} placeholder="Your full name"/></label><label>Email<input type="email" name="email" autoComplete="email" required placeholder="you@example.com"/></label></div><label>Inquiry type<select name="inquiry" required defaultValue=""><option value="" disabled>Select your interest</option><option>Book a viewing</option><option>Investment inquiry</option><option>Creative collaboration</option><option>General inquiry</option></select></label><label>Message<textarea name="message" required minLength={10} maxLength={3000} rows={2} placeholder="Tell us a little about what you have in mind."/></label><div className="form-bottom"><p>Portfolio demonstration.<br/>No personal data is transmitted.</p><button className="pill" type="submit">Prepare inquiry <ArrowUpRight size={16}/></button></div><p className="form-status" role="status">{formStatus}</p></form></section>
    </main>
    <footer className="footer"><a href="#home" className="footer-brand">FORME<span>DEVELOPMENTS</span></a><div><a href="#projects">Projects</a><a href="#about">About Us</a><a href="#contact">Contact</a></div><p>© {new Date().getFullYear()} FORME Developments<br/>A fictional brand. A considered perspective.</p><a className="back-top" href="#home" aria-label="Back to top"><ArrowUpRight/></a></footer>
    <dialog ref={dialog} className="project-dialog" aria-labelledby="project-dialog-title" data-lenis-prevent onClick={e => { if(e.target === e.currentTarget) dialog.current?.close(); }}><button className="dialog-close" onClick={() => dialog.current?.close()} aria-label="Close residence details"><X/></button><img src={projects[detail].image} alt={projects[detail].name}/><div className="dialog-copy"><span className="micro">CONCEPT RESIDENCE / {projects[detail].setting}</span><h2 id="project-dialog-title">{projects[detail].name}</h2><p>{projects[detail].description}</p><p className="secondary">{projects[detail].materials}</p><a className="pill" href="#contact" onClick={() => dialog.current?.close()}>Book a Viewing <ArrowUpRight size={16}/></a><small>Fictional architectural concept. Imagery is illustrative.</small></div></dialog>
  </div>;
}
