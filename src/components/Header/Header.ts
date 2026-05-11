export function initHeader(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const nav    = document.querySelector<HTMLElement>('[data-menu-nav]');
  if (!toggle || !nav) return;

  const open = (): void => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu de navegação');
    document.body.classList.add('has-menu-open');
  };

  const close = (): void => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu de navegação');
    document.body.classList.remove('has-menu-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('is-open');
    if (isOpen) close(); else open();
  });

  nav.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => {
    a.addEventListener('click', () => close());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
  });

  const mq = window.matchMedia('(min-width: 821px)');
  mq.addEventListener('change', (e) => { if (e.matches) close(); });
}
