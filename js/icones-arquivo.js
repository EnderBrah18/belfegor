const sprite = new URL('../imagens/icones-arquivo.svg', import.meta.url);

export function iconeArquivo(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const uso = document.createElementNS(ns, 'use');
  svg.setAttribute('class','arquivo-icone');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  uso.setAttribute('href',sprite.href + '#' + id);
  svg.append(uso);
  return svg;
}
