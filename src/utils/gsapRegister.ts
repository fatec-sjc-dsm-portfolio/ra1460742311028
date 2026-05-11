import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.defaults({ ease: 'power3.out', duration: 0.8 });

const mql = (q: string): boolean =>
  typeof window !== 'undefined' && (window.matchMedia?.(q).matches ?? false);

export const isTouchDevice = (): boolean =>
  mql('(hover: none) and (pointer: coarse)');

export const isSmallViewport = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth <= 900;

export const prefersReducedMotion = (): boolean =>
  mql('(prefers-reduced-motion: reduce)');

export const shouldAnimate = (): boolean =>
  !isTouchDevice() && !isSmallViewport() && !prefersReducedMotion();

export { gsap, ScrollTrigger };
