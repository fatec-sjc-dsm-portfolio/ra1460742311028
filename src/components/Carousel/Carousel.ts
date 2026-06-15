import { gsap, Draggable, prefersReducedMotion } from '@/utils/gsapRegister';
import { horizontalLoop, type HorizontalLoop } from '@/utils/horizontalLoop';

interface CarouselOptions {
  slides: readonly HTMLElement[];
  showCounter?: boolean;
  showDots?: boolean;
}

export interface CarouselInstance {
  readonly element: HTMLElement;
  destroy(): void;
}

const RESIZE_DEBOUNCE_MS = 150;

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

  const tweenVars = (): gsap.TweenVars => ({
    duration: prefersReducedMotion() ? 0 : 0.8,
    ease: 'power3.out',
  });

  let currentIndex   = 0;
  let isLoopMode     = false;
  let loop: HorizontalLoop | null = null;
  let boundedDrag: Draggable | null = null;
  let boundedOffsets: number[] = [];
  let suppressClick  = false;
  let destroyed      = false;

  /* ── UI ──────────────────────────────────────────────────────────── */

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
    // No loop infinito as setas nunca travam; no modo limitado travam nas pontas.
    prevBtn.disabled = !isLoopMode && currentIndex === 0;
    nextBtn.disabled = !isLoopMode && currentIndex === slides.length - 1;
  }

  /* ── Supressão de clique pós-drag (os cards abrem detalhe no click) ─ */

  viewport.addEventListener(
    'click',
    (e) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  const onDragStart = (): void => {
    suppressClick = true;
    viewport.classList.add('is-dragging');
  };
  const onDragEnd = (): void => {
    viewport.classList.remove('is-dragging');
    setTimeout(() => { suppressClick = false; }, 0);
  };

  /* ── Medidas compartilhadas ──────────────────────────────────────── */

  function visibleWidth(): number {
    const cs = getComputedStyle(viewport);
    return viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  }

  function trackGap(): number {
    return parseFloat(getComputedStyle(track).columnGap) || 0;
  }

  /** Loop contínuo só é viável se a fita de cards cobre a janela visível. */
  function canLoop(): boolean {
    return slides.length >= 2 && track.scrollWidth + trackGap() > visibleWidth() + 1;
  }

  /* ── Modo loop infinito (Draggable + Inertia via horizontalLoop) ─── */

  function initLoop(startIndex: number): void {
    isLoopMode = true;
    loop = horizontalLoop(slides, {
      paused: true,
      draggable: true,
      paddingRight: trackGap(),
      trigger: viewport,
      onChange: (_item, i) => {
        currentIndex = i;
        updateUI();
      },
      onDragStart,
      onDragEnd,
    });
    if (startIndex > 0) loop.toIndex(startIndex, { duration: 0 });
    updateUI();
  }

  function teardownLoop(): void {
    loop?.destroy();
    loop = null;
  }

  /* ── Modo limitado (poucos cards): drag livre com inércia e bounds ─ */

  function measureBounded(): { minX: number; maxX: number } {
    const minX = Math.min(0, visibleWidth() - track.scrollWidth);
    // offsetLeft é relativo ao .carousel (position: relative), então usa o
    // delta em relação ao primeiro slide para obter a posição dentro do track.
    const baseLeft = slides[0]?.offsetLeft ?? 0;
    boundedOffsets = slides.map((s) => Math.max(minX, -(s.offsetLeft - baseLeft)));
    return { minX, maxX: 0 };
  }

  function nearestBoundedIndex(x: number): number {
    let best = 0;
    let bestDist = Infinity;
    boundedOffsets.forEach((offset, i) => {
      const d = Math.abs(offset - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function goToBounded(i: number, animate = true): void {
    currentIndex = Math.max(0, Math.min(slides.length - 1, i));
    const vars = animate ? tweenVars() : { duration: 0 };
    gsap.to(track, { x: boundedOffsets[currentIndex]!, overwrite: 'auto', ...vars });
    updateUI();
  }

  function initBounded(startIndex: number): void {
    isLoopMode = false;
    const bounds = measureBounded();
    boundedDrag = Draggable.create(track, {
      type: 'x',
      bounds,
      inertia: true,
      edgeResistance: 0.82,
      snap: (value: number) => boundedOffsets[nearestBoundedIndex(value)]!,
      onDragStart,
      onDrag(this: Draggable) {
        currentIndex = nearestBoundedIndex(this.x);
        updateUI();
      },
      onThrowUpdate(this: Draggable) {
        currentIndex = nearestBoundedIndex(this.x);
        updateUI();
      },
      onRelease: onDragEnd,
    })[0]!;
    goToBounded(startIndex, false);
  }

  function teardownBounded(): void {
    boundedDrag?.kill();
    boundedDrag = null;
    gsap.killTweensOf(track);
    gsap.set(track, { clearProps: 'x' });
  }

  /* ── Ciclo de vida / navegação ───────────────────────────────────── */

  function init(startIndex = 0): void {
    if (destroyed || !slides.length) return;
    if (canLoop()) initLoop(startIndex);
    else initBounded(startIndex);
  }

  function teardown(): void {
    teardownLoop();
    teardownBounded();
  }

  function goTo(i: number): void {
    if (loop) loop.toIndex(i, tweenVars());
    else goToBounded(i);
  }

  function step(dir: 1 | -1): void {
    if (loop) {
      if (dir === 1) loop.next(tweenVars());
      else loop.previous(tweenVars());
    } else {
      goToBounded(currentIndex + dir);
    }
  }

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  if (showDots) {
    dotsEl.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('.carousel__dot');
      if (!target) return;
      const i = Number(target.dataset['index'] ?? -1);
      if (Number.isInteger(i) && i >= 0) goTo(i);
    });
  }

  root.tabIndex = 0;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carrossel');
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
  });

  // Re-inicializa no resize: o modo pode mudar (loop ↔ limitado) com a largura.
  let resizeTimer: number | undefined;
  const onResize = (): void => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const keep = currentIndex;
      teardown();
      init(keep);
    }, RESIZE_DEBOUNCE_MS);
  };
  window.addEventListener('resize', onResize);

  // Mede só depois de montado no DOM (offsetLeft/scrollWidth precisam de layout).
  requestAnimationFrame(() => init(0));
  // Fontes alteram a largura dos cards — re-mede quando terminarem de carregar.
  document.fonts?.ready.then(() => {
    if (destroyed) return;
    const keep = currentIndex;
    teardown();
    init(keep);
  });

  return {
    element: root,
    destroy(): void {
      destroyed = true;
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      teardown();
      root.remove();
    },
  };
}
