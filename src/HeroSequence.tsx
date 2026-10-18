import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { nextDownloads } from './downloadQueue';
gsap.registerPlugin(ScrollTrigger);

type Manifest = { count: number; fps: number; desktop: { width: number; height: number }; phone: { width: number; height: number } };

/** Compressed frames persist across direction changes; only the nearby decoded window lives on the GPU. */
export default function HeroSequence() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current!;
    const hero = el.closest<HTMLElement>('.hero')!;
    const chapters = [...hero.querySelectorAll<HTMLElement>('.hero-chapter')];
    const story = gsap.timeline({ paused: true });
    story.to({}, { duration: 1 });
    chapters.forEach((chapter, index) => {
      const lines = chapter.querySelectorAll('.hero-line span');
      const caption = chapter.querySelector('.hero-caption');
      if (index === 0) {
        story.set(chapter, { autoAlpha: 1 }, 0);
      } else {
        const entry = index === 1 ? .33 : .66;
        story.set(chapter, { autoAlpha: 1 }, entry);
        story.fromTo(lines, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .08, stagger: .012, ease: 'power2.out', immediateRender: false }, entry);
        story.fromTo(caption, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .1, ease: 'none', immediateRender: false }, entry + .01);
      }
      if (index < 2) {
        const exit = index === 0 ? .21 : .54;
        story.to(lines, { yPercent: -110, opacity: 0, duration: .075, stagger: .012, ease: 'power2.in' }, exit);
        story.to(caption, { y: -25, opacity: 0, duration: .08, ease: 'none' }, exit);
        story.set(chapter, { autoAlpha: 0 }, exit + .11);
      }
    });
    story.to('.hero-story', { opacity: .15, y: -35, duration: .07, ease: 'none' }, .93);
    story.progress(0);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (reduced.matches || connection?.saveData) return () => story.revert();
    const controller = new AbortController();
    let disposed = false, animation = 0, displayed = -1, target = 0, lastTick = 0, frameBudget = 0;
    let trigger: ScrollTrigger | undefined;
    let holdingExit = false;
    let manifest: Manifest;
    const variant: 'phone' | 'desktop' = innerWidth < 768 ? 'phone' : 'desktop';
    const compressed = new Map<number, Blob>();
    const decoded = new Map<number, ImageBitmap>();
    const fetching = new Set<number>(), decoding = new Set<number>(), failed = new Set<number>();
    const attempts = new Map<number, number>();
    let bytes = 0;
    const lowMemory = variant === 'phone' || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
    const compressedBudget = (lowMemory ? 70 : 150) * 1024 * 1024;
    // One and a half viewports keeps the sequence responsive while preserving every frame.
    const getScrollDistance = () => Math.max(innerHeight * 1.5, 900);
    const decodeLimit = lowMemory ? 2 : 3;
    const context = el.getContext('2d', { alpha: false });
    if (!context) return () => story.revert();
    const fallback = () => {
      el.classList.remove('ready');
      hero.dataset.sequence = 'still-fallback';
      disposed = true;
      controller.abort();
      cancelAnimationFrame(animation);
      trigger?.kill();
      ScrollTrigger.refresh();
    };
    el.addEventListener('contextlost', fallback);
    const resize = () => {
      const density = Math.min(devicePixelRatio || 1, 1.5);
      el.width = Math.round(hero.clientWidth * density);
      el.height = Math.round(hero.clientHeight * density);
      paint(displayed);
    };
    function paint(index: number) {
      const frame = decoded.get(index);
      if (!frame || !context || disposed) return;
      const scale = Math.max(el.width / frame.width, el.height / frame.height);
      const w = frame.width * scale, h = frame.height * scale;
      try { context.drawImage(frame, (el.width - w) * .5, (el.height - h) * .5, w, h); }
      catch { fallback(); return; }
      el.classList.add('ready');
      hero.dataset.frame = String(index);
      const progress = index / Math.max(1, manifest.count - 1);
      hero.style.setProperty('--playback', String(progress));
      story.progress(progress);
      const activeChapter = progress < .33 ? 0 : progress < .66 ? 1 : 2;
      hero.dataset.storyChapter = String(activeChapter + 1);
      hero.querySelectorAll<HTMLElement>('.story-step').forEach((step, i) => {
        step.classList.toggle('is-active', i === activeChapter);
        step.style.setProperty('--chapter-progress', String(Math.min(1, Math.max(0, progress * 3 - i))));
      });
      const number = hero.querySelector('.frame-number');
      if (number) number.textContent = `${Math.round(progress * 100).toString().padStart(2, '0')}%`;
    }
    function priorities() {
      const direction = target >= displayed ? 1 : -1;
      const near = [0];
      for (let n = 0; n <= 16; n++) near.push(Math.max(0, Math.min(manifest.count - 1, Math.max(0, displayed) + n * direction)));
      return [...new Set(near)];
    }
    function pumpDecode() {
      if (disposed || document.hidden) return;
      for (const index of priorities()) {
        if (decoding.size >= decodeLimit) break;
        if (decoded.has(index) || decoding.has(index) || !compressed.has(index)) continue;
        decoding.add(index);
        createImageBitmap(compressed.get(index)!).then(frame => {
          if (disposed) frame.close(); else decoded.set(index, frame);
        }).catch(() => { if (!disposed) fallback(); }).finally(() => { decoding.delete(index); pumpDecode(); });
      }
      for (const [index, frame] of decoded) {
        if (Math.abs(index - Math.max(0, displayed)) > 20 && index !== 0) { frame.close(); decoded.delete(index); }
      }
    }
    function pumpFetch() {
      if (disposed || document.hidden || bytes > compressedBudget) return;
      const order = nextDownloads(manifest.count, priorities(), fetching, compressed, failed);
      for (const index of order) {
        fetching.add(index);
        fetch(`/media/${variant}/${String(index).padStart(4, '0')}.webp`, { signal: controller.signal }).then(response => {
          if (!response.ok) throw new Error('Frame unavailable');
          return response.blob();
        }).then(blob => { if (!disposed) { compressed.set(index, blob); bytes += blob.size; } }).catch(() => {
          attempts.set(index, (attempts.get(index) || 0) + 1);
          if (!disposed && (attempts.get(index) || 0) >= 3) { failed.add(index); fallback(); }
        }).finally(() => { fetching.delete(index); pumpFetch(); pumpDecode(); });
      }
    }
    function tick(now: number) {
      if (disposed) return;
      if (!document.hidden) {
        pumpFetch(); pumpDecode();
        const next = displayed < 0 ? 0 : displayed === target ? displayed : displayed + Math.sign(target - displayed);
        const elapsed = lastTick ? Math.min(50, now - lastTick) : 16.7;
        const scrollDistance = getScrollDistance();
        const scrollDrivenRate = (Math.abs(trigger?.getVelocity() ?? 0) / scrollDistance) * (manifest.count - 1);
        // Backlog keeps catch-up fast after the scroll gesture has ended.
        const backlogRate = Math.abs(target - displayed) / .4;
        const playbackRate = Math.min(60, Math.max(manifest.fps, scrollDrivenRate, backlogRate));
        const interval = 1000 / playbackRate;
        frameBudget = Math.min(frameBudget + elapsed, interval + elapsed);
        if (decoded.has(next) && (displayed < 0 || frameBudget + .5 >= interval)) {
          if (next !== displayed) {
            displayed = next; paint(displayed);
            frameBudget = Math.max(0, frameBudget - interval);
          } else frameBudget = 0;
        }
        if (holdingExit && displayed === manifest.count - 1 && trigger) {
          holdingExit = false;
          window.dispatchEvent(new CustomEvent('hero-scroll-position', { detail: trigger.end + 1 }));
        }
      }
      lastTick = now;
      animation = requestAnimationFrame(tick);
    }
    const observer = new ResizeObserver(resize);
    fetch('/media/manifest.json', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Sequence unavailable'); return r.json(); }).then((data: Manifest) => {
      if (disposed) return;
      manifest = data;
      // Select one device set for this visit. Rotation repaints the same source, without downloading both sets.
      resize(); observer.observe(hero);
      trigger = ScrollTrigger.create({ trigger: hero, start: 'top top', end: () => `+=${getScrollDistance()}`, pin: true, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: self => {
        target = Math.round(self.progress * (manifest.count - 1));
        if (self.scroll() >= self.end && displayed < manifest.count - 1) {
          holdingExit = true;
          window.dispatchEvent(new CustomEvent('hero-scroll-position', { detail: self.end - 1 }));
        } else if (self.scroll() < self.end - 2) holdingExit = false;
      } });
      // Re-measure every downstream trigger after adding asynchronous hero pin spacing.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      animation = requestAnimationFrame(tick);
      hero.dataset.sequence = variant;
    }).catch(() => { if (!disposed) hero.dataset.sequence = 'still-fallback'; });
    return () => {
      disposed = true; controller.abort(); cancelAnimationFrame(animation); trigger?.kill(); observer.disconnect(); el.removeEventListener('contextlost', fallback);
      decoded.forEach(frame => frame.close()); decoded.clear(); compressed.clear();
      story.revert();
    };
  }, []);
  return <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />;
}
