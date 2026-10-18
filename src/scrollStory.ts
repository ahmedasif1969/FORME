import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Called inside the page GSAP context so every timeline and pin is reverted together. */
export function createScrollStory() {
  const desktop = matchMedia('(min-width: 768px) and (min-height: 650px)').matches;
  const philosophy = gsap.timeline({ scrollTrigger: {
    trigger: '.philosophy-story', start: desktop ? 'top 12%' : 'top 65%',
    end: desktop ? '+=1000' : 'bottom 30%', pin: desktop, pinSpacing: true,
    scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
  } });
  philosophy.fromTo('.statement-word', { color: '#efeee82e' }, { color: '#efeee8', stagger: .065, duration: .16, ease: 'none' }, 0);
  philosophy.fromTo('.philosophy-story h2 .muted', { color: '#727b6a' }, { color: '#efeee8', duration: 1.3, ease: 'none' }, .1);

  // The residence grows into view, then its title travels against the photograph.
  gsap.fromTo('.feature-content h2', { xPercent: -16 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: '.featured', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.feature-number', { y: 100, opacity: .1 }, { y: -45, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.featured', start: 'top 80%', end: 'bottom 30%', scrub: true } });
  gsap.fromTo('.feature-content p', { y: 55, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.featured', start: 'top 35%', end: 'top -5%', scrub: true } });

  // Opposing material movements reveal the relationship between the two surfaces.
  gsap.fromTo('.stone', { y: desktop ? 110 : 45 }, { y: desktop ? -90 : -25, ease: 'none', scrollTrigger: { trigger: '.material-grid', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.interior', { y: -40 }, { y: 65, ease: 'none', scrollTrigger: { trigger: '.material-grid', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.utils.toArray<HTMLElement>('.project-tile').forEach((tile, i) => {
    gsap.fromTo(tile, { y: 100 + i * 25 }, { y: 0, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'top 35%', scrub: true } });
    gsap.fromTo(tile.querySelector('img'), { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom 25%', scrub: true } });
  });

  // Closing lines settle into their final alignment as the inquiry form arrives.
  gsap.fromTo('.contact-title h2', { x: desktop ? -100 : -25 }, { x: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 85%', end: 'top 25%', scrub: true } });
  gsap.fromTo('.contact-form', { y: 85 }, { y: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 80%', end: 'top 20%', scrub: true } });

  // Hero sequence initialization is asynchronous. Its refresh must include these pins too.
  ScrollTrigger.sort();
}
