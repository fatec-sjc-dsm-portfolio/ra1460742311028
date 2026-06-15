import { gsap, Draggable } from '@/utils/gsapRegister';

/**
 * Port tipado do helper oficial do GSAP "horizontalLoop"
 * (https://gsap.com/docs/v3/HelperFunctions/helpers/seamlessLoop).
 * Cria um loop horizontal contínuo (seamless) dos itens, com drag + inércia
 * via Draggable/InertiaPlugin e snap por item.
 */

export interface HorizontalLoopConfig {
  /** Repetições da timeline (-1 = infinito). */
  repeat?: number;
  paused?: boolean;
  /** Velocidade do autoplay (1 = 100px/s). Irrelevante com paused: true. */
  speed?: number;
  /** Snap do xPercent por item (false desativa). */
  snap?: number | false;
  /** Espaço extra (px) depois do último item — normalmente o gap do flex. */
  paddingRight?: number;
  /** Habilita drag com inércia. */
  draggable?: boolean;
  /** Elemento que captura o gesto (default: pai dos itens). */
  trigger?: HTMLElement;
  /** Chamado sempre que o índice mais próximo muda (drag, throw ou tween). */
  onChange?: (item: HTMLElement, index: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export interface HorizontalLoop {
  timeline: gsap.core.Timeline;
  next(vars?: gsap.TweenVars): void;
  previous(vars?: gsap.TweenVars): void;
  toIndex(index: number, vars?: gsap.TweenVars): void;
  current(): number;
  refresh(deep?: boolean): void;
  destroy(): void;
}

export function horizontalLoop(
  itemsIn: readonly HTMLElement[],
  config: HorizontalLoopConfig = {},
): HorizontalLoop {
  const items = Array.from(itemsIn);
  const length = items.length;
  const onChange = config.onChange;

  let lastIndex = 0;
  let curIndex = 0;
  let indexIsDirty = false;
  let totalWidth = 0;
  let timeWrap: (t: number) => number = (t) => t;

  const timelineVars: gsap.TimelineVars = {
    repeat: config.repeat ?? -1,
    paused: config.paused ?? true,
    defaults: { ease: 'none' },
    onReverseComplete: () => {
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    },
  };
  if (onChange) {
    timelineVars.onUpdate = () => {
      const i = closestIndex(false);
      if (lastIndex !== i) {
        lastIndex = i;
        const item = items[i];
        if (item) onChange(item, i);
      }
    };
  }
  const tl = gsap.timeline(timelineVars);

  const startX = items[0]!.offsetLeft;
  const times: number[] = [];
  const widths: number[] = [];
  const spaceBefore: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed ?? 1) * 100;
  const snap =
    config.snap === false ? (v: number) => v : gsap.utils.snap(config.snap ?? 1);
  const container = items[0]!.parentNode as HTMLElement;

  const getTotalWidth = (): number =>
    items[length - 1]!.offsetLeft +
    (xPercents[length - 1]! / 100) * widths[length - 1]! -
    startX +
    spaceBefore[0]! +
    items[length - 1]!.offsetWidth *
      Number(gsap.getProperty(items[length - 1]!, 'scaleX')) +
    (config.paddingRight ?? 0);

  function populateWidths(): void {
    let b1 = container.getBoundingClientRect();
    items.forEach((el, i) => {
      widths[i] = parseFloat(String(gsap.getProperty(el, 'width', 'px')));
      xPercents[i] = snap(
        (parseFloat(String(gsap.getProperty(el, 'x', 'px'))) / widths[i]!) * 100 +
          Number(gsap.getProperty(el, 'xPercent')),
      );
      const b2 = el.getBoundingClientRect();
      spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
      b1 = b2;
    });
    gsap.set(items, { xPercent: (i) => xPercents[i]! });
    totalWidth = getTotalWidth();
  }

  function getClosest(values: number[], value: number, wrap: number): number {
    let i = values.length;
    let closest = 1e10;
    let index = 0;
    while (i--) {
      let d = Math.abs(values[i]! - value);
      if (d > wrap / 2) d = wrap - d;
      if (d < closest) {
        closest = d;
        index = i;
      }
    }
    return index;
  }

  function populateTimeline(): void {
    tl.clear();
    for (let i = 0; i < length; i++) {
      const item = items[i]!;
      const curX = (xPercents[i]! / 100) * widths[i]!;
      const distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0]!;
      const distanceToLoop =
        distanceToStart + widths[i]! * Number(gsap.getProperty(item, 'scaleX'));
      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / widths[i]!) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0,
      )
        .fromTo(
          item,
          { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]!) * 100) },
          {
            xPercent: xPercents[i]!,
            duration: (totalWidth - distanceToLoop) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond,
        )
        .add(`label${i}`, distanceToStart / pixelsPerSecond);
      times[i] = distanceToStart / pixelsPerSecond;
    }
    timeWrap = gsap.utils.wrap(0, tl.duration());
  }

  function refresh(deep?: boolean): void {
    const progress = tl.progress();
    tl.progress(0, true);
    populateWidths();
    if (deep) populateTimeline();
    if (deep && draggableInstance && tl.paused()) {
      tl.time(times[curIndex]!, true);
    } else {
      tl.progress(progress, true);
    }
  }

  function closestIndex(setCurrent: boolean): number {
    const index = getClosest(times, tl.time(), tl.duration());
    if (setCurrent) {
      curIndex = index;
      indexIsDirty = false;
    }
    return index;
  }

  function current(): number {
    return indexIsDirty ? closestIndex(true) : curIndex;
  }

  function toIndex(indexIn: number, vars: gsap.TweenVars = {}): void {
    let index = indexIn;
    // Sempre vai pela direção mais curta.
    if (Math.abs(index - curIndex) > length / 2) {
      index += index > curIndex ? -length : length;
    }
    const newIndex = gsap.utils.wrap(0, length, index);
    let time = times[newIndex]!;
    if (time > tl.time() !== index > curIndex && index !== curIndex) {
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    if (time < 0 || time > tl.duration()) {
      vars.modifiers = { time: timeWrap };
    }
    curIndex = newIndex;
    vars.overwrite = true;
    if (proxy) gsap.killTweensOf(proxy);
    if (vars.duration === 0) {
      tl.time(timeWrap(time));
    } else {
      tl.tweenTo(time, vars);
    }
  }

  const onResize = (): void => refresh(true);

  gsap.set(items, { x: 0 });
  populateWidths();
  populateTimeline();
  window.addEventListener('resize', onResize);

  // Pré-renderiza para evitar custo no primeiro frame.
  tl.progress(1, true).progress(0, true);

  let draggableInstance: Draggable | null = null;
  let proxy: HTMLElement | null = null;

  if (config.draggable) {
    proxy = document.createElement('div');
    const wrap = gsap.utils.wrap(0, 1);
    let ratio = 1;
    let startProgress = 0;
    let lastSnap = 0;
    let initChangeX = 0;
    let wasPlaying = false;

    const align = (): void => {
      tl.progress(
        wrap(startProgress + (draggableInstance!.startX - draggableInstance!.x) * ratio),
      );
    };
    const syncIndex = (): void => {
      closestIndex(true);
    };

    draggableInstance = Draggable.create(proxy, {
      trigger: config.trigger ?? container,
      type: 'x',
      inertia: true,
      overshootTolerance: 0,
      onPressInit(this: Draggable) {
        const x = this.x;
        gsap.killTweensOf(tl);
        wasPlaying = !tl.paused();
        tl.pause();
        startProgress = tl.progress();
        refresh();
        ratio = 1 / totalWidth;
        initChangeX = startProgress / -ratio - x;
        gsap.set(proxy, { x: startProgress / -ratio });
      },
      onDragStart() {
        config.onDragStart?.();
      },
      onDrag: align,
      onThrowUpdate: align,
      snap(this: Draggable, value: number) {
        if (Math.abs(startProgress / -ratio - this.x) < 10) {
          return lastSnap + initChangeX;
        }
        const time = -(value * ratio) * tl.duration();
        const wrappedTime = timeWrap(time);
        const snapTime = times[getClosest(times, wrappedTime, tl.duration())]!;
        let dif = snapTime - wrappedTime;
        if (Math.abs(dif) > tl.duration() / 2) {
          dif += dif < 0 ? tl.duration() : -tl.duration();
        }
        lastSnap = (time + dif) / tl.duration() / -ratio;
        return lastSnap;
      },
      onRelease(this: Draggable) {
        syncIndex();
        if (this.isThrowing) indexIsDirty = true;
        config.onDragEnd?.();
      },
      onThrowComplete() {
        syncIndex();
        if (wasPlaying) tl.play();
      },
    })[0]!;
  }

  closestIndex(true);
  lastIndex = curIndex;
  const firstItem = items[curIndex];
  if (onChange && firstItem) onChange(firstItem, curIndex);

  return {
    timeline: tl,
    next: (vars) => toIndex(current() + 1, vars),
    previous: (vars) => toIndex(current() - 1, vars),
    toIndex: (i, vars) => toIndex(i, vars),
    current,
    refresh,
    destroy(): void {
      window.removeEventListener('resize', onResize);
      draggableInstance?.kill();
      gsap.killTweensOf(tl);
      tl.kill();
      gsap.set(items, { clearProps: 'x,xPercent' });
    },
  };
}
