import { gsap, ScrollTrigger } from '@/utils/gsapRegister';

export function initSkillsScene(): void {
  gsap.utils.toArray<HTMLElement>('.skill-row').forEach((row) => {
    const items = row.querySelectorAll('li');
    if (items.length === 0) return;

    gsap.from(items, {
      autoAlpha: 0,
      y: 16,
      stagger: 0.05,
      duration: 0.55,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: row,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });

  ScrollTrigger.refresh();
}
