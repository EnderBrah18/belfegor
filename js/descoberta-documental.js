import { visivel } from './visibilidade.js?v=4';

const normalizar = valor => String(valor ?? '').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim().replace(/\s+/g,' ');
const termos = valor => Array.isArray(valor) ? valor : [];
export const camada = item => [1,2,3,4].includes(item.profundidade) ? item.profundidade : 2;

export function descobrir(item, conta, via = 'listagem', consulta = '') {
  if (!item || !visivel(item,conta)) return false;
  if (['direto','referencia','anexo','mensagem','pessoal'].includes(via)) return true;
  if (via === 'expediente') return camada(item) === 1;
  if (via === 'listagem') return camada(item) <= 2;
  if (via !== 'busca') return false;
  const chave = normalizar(consulta);
  if (!chave) return false;
  if (camada(item) === 4) {
    return [item.codigo,item.titulo,...termos(item.termosDescoberta)].some(valor => normalizar(valor) === chave);
  }
  return [item.codigo,item.titulo,item.resumo,item.setor,...termos(item.palavrasChave)].some(valor => normalizar(valor).includes(chave));
}

export function documentosRelacionados(origem, catalogo, conta) {
  const referencias = termos(origem.relacionados);
  return catalogo.filter(item => item.href && item.codigo !== origem.codigo && (
    referencias.includes(item.codigo) ? descobrir(item,conta,'referencia') :
      termos(item.relacionados).includes(origem.codigo) && descobrir(item,conta,'listagem')
  ));
}

function caminho(href) {
  try {
    const url = new URL(href,new URL('../',import.meta.url));
    const raiz = new URL('../',import.meta.url);
    return url.origin === raiz.origin && url.pathname.startsWith(raiz.pathname) ? url.pathname : null;
  } catch { return null; }
}

export function destinoDoVinculo(vinculo, catalogo) {
  const rota = vinculo.href ? caminho(vinculo.href) : null;
  return catalogo.find(item => item.codigo === vinculo.codigo ||
    (rota && item.href && caminho(item.href) === rota));
}

export function anexosAutorizados(item, catalogo, conta) {
  return termos(item.anexos).flatMap(anexo => {
    if (!descobrir(anexo,conta,'anexo')) return [];
    const destino = destinoDoVinculo(anexo,catalogo);
    if (destino) return descobrir(destino,conta,'anexo') && destino.href ? [{...anexo,href:destino.href,titulo:anexo.titulo ?? destino.titulo}] : [];
    if (anexo.codigo || !anexo.href || /\/documentos\/[^/]+\.html$/i.test(caminho(anexo.href) ?? '')) return [];
    return [anexo];
  });
}

export function aplicarVinculos(raiz, catalogo, conta) {
  for (const link of raiz.querySelectorAll('a[href],a[data-documento-codigo]')) {
    const codigo = link.dataset.documentoCodigo;
    const alvo = destinoDoVinculo({codigo,href:link.href},catalogo);
    if (!codigo && !alvo) continue;
    const permitido = descobrir(alvo,conta,'referencia');
    const elemento = link.closest('[data-referencia-documental]') ?? link;
    elemento.hidden = !permitido;
    elemento.style.display = permitido ? '' : 'none';
  }
}
