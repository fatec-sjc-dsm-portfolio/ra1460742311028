export function splitChars(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';

  const frag = document.createDocumentFragment();
  const chars: HTMLSpanElement[] = [];

  const tokens = text.split(/(\s+)/);

  for (const token of tokens) {
    if (token === '') continue;

    if (/^\s+$/.test(token)) {
      frag.appendChild(document.createTextNode(token));
      continue;
    }

    const word = document.createElement('span');
    word.className = 'word';
    word.style.display = 'inline-block';
    word.style.whiteSpace = 'nowrap';

    for (const ch of Array.from(token)) {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity';
      span.textContent = ch;
      word.appendChild(span);
      chars.push(span);
    }

    frag.appendChild(word);
  }

  el.appendChild(frag);
  return chars;
}
