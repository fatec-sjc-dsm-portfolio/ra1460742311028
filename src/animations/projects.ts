import { gsap } from '@/utils/gsapRegister';

export function initProjectsScene(): void {
  const carousel = document.querySelector<HTMLElement>('#projects .carousel');
  if (!carousel) return;

  gsap.from(carousel, {
    autoAlpha: 0,
    y: 24,
    duration: 0.8,
    ease: 'power3.out',
    clearProps: 'all',
    scrollTrigger: {
      trigger: carousel,
      start: 'top 85%',
      toggleActions: 'play none none none',
      once: true,
    },
  });
}
