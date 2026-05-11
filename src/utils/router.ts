export type RouteHandler = (path: string) => void;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function currentPath(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function navigate(path: string): void {
  if (currentPath() === path) return;
  window.location.hash = path;
}

export function back(): void {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.hash = '/';
  }
}

export function onRouteChange(handler: RouteHandler): void {
  const fire = (): void => handler(currentPath());
  window.addEventListener('hashchange', fire);
  fire();
}
