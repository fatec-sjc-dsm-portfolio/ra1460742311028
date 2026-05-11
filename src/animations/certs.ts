import { gsap } from '@/utils/gsapRegister';

export function initCertsScene(): void {
  const cards = gsap.utils.toArray<HTMLElement>('.cert-card');
  if (cards.length === 0) return;

  cards.forEach((card, i) => {
    gsap.from(card, {
      autoAlpha: 0,
      y: 20,
      duration: 0.6,
      delay: (i % 4) * 0.05,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });
}
