import { gsap } from '@/utils/gsapRegister';

interface CarouselOptions {
  slides: readonly HTMLElement[];
  showCounter?: boolean;
  showDots?: boolean;
}

export interface CarouselInstance {
  readonly element: HTMLElement;
  destroy(): void;
}

export function createCarousel(opts: CarouselOptions): CarouselInstance {
  const { slides, showCounter = true, showDots = true } = opts;

  const root = document.createElement('div');
  root.className = 'carousel';

  const viewport = document.createElement('div');
  viewport.className = 'carousel__viewport';

  const track = document.createElement('div');
  track.className = 'carousel__track';
  slides.forEach((s) => track.appendChild(s));

  viewport.appendChild(track);
  root.appendChild(viewport);

  const controls = document.createElement('div');
  controls.className = 'carousel__controls';

  const dotsEl    = document.createElement('div');
  const counterEl = document.createElement('p');
  const nav       = document.createElement('div');

  if (showDots) {
    dotsEl.className = 'carousel__dots';
    dotsEl.setAttribute('role', 'tablist');
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir para o projeto ${i + 1}`);
      dot.dataset['index'] = String(i);
      dotsEl.appendChild(dot);
    });
    controls.appendChild(dotsEl);
  }

  if (showCounter) {
    counterEl.className = 'carousel__counter';
    controls.appendChild(counterEl);
  }

  nav.className = 'carousel__nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel__btn';
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Projeto anterior');
  prevBtn.textContent = '←';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel__btn';
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Próximo projeto');
  nextBtn.textContent = '→';

  nav.append(prevBtn, nextBtn);
  controls.appendChild(nav);
  root.appendChild(controls);

  const DRAG_THRESHOLD_PX = 6;

  let currentIndex   = 0;
  let dragOffset     = 0; 
  let isPointerDown  = false; 
  let hasDragStarted = false;
  let pointerStartX  = 0;
  let baseX          = 0; 

  function offsetForIndex(i: number): number {
    const slide = slides[i];
    if (!slide) return 0;
    return -slide.offsetLeft + parseFloat(getComputedStyle(track).paddingLeft || '0');
  }

  function clampIndex(i: number): number {
    return Math.max(0, Math.min(slides.length - 1, i));
  }

  function updateUI(): void {
    if (showCounter) {
      const total = String(slides.length).padStart(2, '0');
      const cur   = String(currentIndex + 1).padStart(2, '0');
      counterEl.innerHTML = `<strong>${cur}</strong> / ${total}`;
    }
    if (showDots) {
      dotsEl.querySelectorAll<HTMLElement>('.carousel__dot').forEach((d, i) => {
        d.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
      });
    }
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === slides.length - 1;
  }

  function goTo(i: number, animate = true): void {
    currentIndex = clampIndex(i);
    baseX = offsetForIndex(currentIndex);
    gsap.to(track, {
      x: baseX,
      duration: animate ? 0.8 : 0,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    updateUI();
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    isPointerDown  = true;
    hasDragStarted = false;
    pointerStartX  = e.clientX;
    dragOffset     = 0;
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isPointerDown) return;

    const dx = e.clientX - pointerStartX;

    if (!hasDragStarted) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      hasDragStarted = true;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
      gsap.killTweensOf(track);
    }

    dragOffset = dx;
    gsap.set(track, { x: baseX + dragOffset });
  }

  function onPointerUp(e: PointerEvent): void {
    if (!isPointerDown) return;
    isPointerDown = false;

    if (!hasDragStarted) return;

    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);

    const avgSlide = track.scrollWidth / slides.length;
    const threshold = avgSlide * 0.25;

    if (dragOffset < -threshold)      goTo(currentIndex + 1);
    else if (dragOffset >  threshold) goTo(currentIndex - 1);
    else                              goTo(currentIndex);

    dragOffset     = 0;
    hasDragStarted = false;
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  if (showDots) {
    dotsEl.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('.carousel__dot');
      if (!target) return;
      const i = Number(target.dataset['index'] ?? -1);
      if (Number.isInteger(i) && i >= 0) goTo(i);
    });
  }

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup',   onPointerUp);
  viewport.addEventListener('pointercancel', onPointerUp);

  root.tabIndex = 0;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carrossel');
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentIndex - 1); }
  });

  const onResize = (): void => goTo(currentIndex, false);
  window.addEventListener('resize', onResize);

  requestAnimationFrame(() => goTo(0, false));

  return {
    element: root,
    destroy(): void {
      window.removeEventListener('resize', onResize);
      gsap.killTweensOf(track);
      root.remove();
    },
  };
}
