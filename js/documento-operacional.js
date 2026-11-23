import { iconeArquivo } from './icones-arquivo.js?v=3';

function el(tag,texto,classe) {
  const node = document.createElement(tag);
  if (texto !== undefined) node.textContent = texto;
  if (classe) node.className = classe;
  return node;
}

function nivel(item) {
  const regra = item.visibilidade;
  if (!regra) return 'Público';
  if (Number.isInteger(regra.naExato)) return 'NA-' + regra.naExato;
  if (Number.isInteger(regra.naMinimo)) return 'NA-' + regra.naMinimo + ' ou superior';
  return 'Restrito';
}

function campos(destino, itens) {
  destino.replaceChildren(...itens.map(([titulo,valor,icon]) => {
    const item = el('div');
    if (icon) item.append(iconeArquivo(icon));
    const grupo = el('div');
    const dd = el('dd',valor || '—');
    if (titulo === 'Nível de acesso') dd.className = 'op-acesso';
    if (titulo === 'Status') dd.className = 'op-status';
    grupo.append(el('dt',titulo),dd);
    item.append(grupo);
    return item;
  }));
}

function secoesOriginais(origem, procedimento) {
  const secoes = [];
  let atual;
  for (const node of origem.children) {
    if (node.tagName === 'H2') {
      const titulo = node.textContent.trim();
      atual = { titulo: titulo === 'Consulta' ? (procedimento ? 'Visão Geral' : 'Resumo Executivo') : titulo, nos:[] };
      secoes.push(atual);
    } else {
      if (!atual) {
        atual = { titulo: procedimento ? 'Visão Geral' : 'Resumo Executivo', nos:[] };
        secoes.push(atual);
      }
      if (node.tagName !== 'P' || !node.textContent.trim().startsWith('Voltar ')) atual.nos.push(node.cloneNode(true));
    }
  }
  return secoes;
}

function destaque(titulo,texto,classe) {
  const quadro = el('section',undefined,'com-quadro ' + (classe ?? ''));
  const h = el('h3',titulo);
  h.prepend(iconeArquivo(classe ? 'alert' : 'info'));
  quadro.append(h,el('p',texto));
  return quadro;
}

export function renderizarOperacional(root,item,catalogo,origem) {
  const $ = id => root.querySelector('#' + id);
  const procedimento = item.categoria === 'procedimento';
  $('op-titulo').textContent = procedimento ? item.codigo + ' — ' + item.titulo : item.codigo;
  $('op-subtitulo').textContent = procedimento ? item.resumo : item.titulo;
  const status = item.situacao;
  root.dataset.status = status ?? '';
  const faixa = procedimento
    ? [['Status',status,'check'],['Setor responsável',item.setor,'users'],['Aplicação',item.aplicacao,'sector'],
      ['Revisão atual',item.revisao && 'Rev. ' + item.revisao,'history'],['Vigência',item.vigencia,'file'],['Nível de acesso',nivel(item),'shield']]
    : [['Status',status,'check'],['Data da ocorrência',item.dataOcorrencia ?? item.referencia,'history'],['Local',item.local,'sector'],
      ['Categoria',item.tipo,'layers'],['Nível de risco',item.risco,'alert'],['Nível de acesso',nivel(item),'lock']];
  campos($('op-faixa'),faixa);
  campos($('op-info'),procedimento ? [['Código',item.codigo],['Categoria',item.grupo],['Status',status],
    ['Revisão',item.revisao],['Última atualização',item.atualizadoEm],['Páginas',item.paginas]]
    : [['Código',item.codigo],['Tipo',item.tipo],['Setor responsável',item.setor],['Autor',item.autor ?? item.responsavel],
      ['Data de registro',item.publicadoEm ?? item.referencia],['Última atualização',item.atualizadoEm]]);

  const rel = new Set(item.relacionados ?? []);
  for (const d of catalogo) if (d.relacionados?.includes(item.codigo)) rel.add(d.codigo);
  const arquivos = [
    ...(item.anexos ?? []).filter(a => a?.href),
    ...catalogo.filter(d => d.href && rel.has(d.codigo)).map(d => ({...d,titulo:d.codigo + ' — ' + d.titulo}))
  ];
  $('op-arquivos').replaceChildren(...(arquivos.length ? arquivos.map(a => {
    const li = el('li');
    const link = el('a',a.titulo);
    link.href = new URL('../' + a.href,import.meta.url);
    link.prepend(iconeArquivo('file'));
    link.append(iconeArquivo('arrow'));
    li.append(link);
    return li;
  }) : [el('li','Nenhum arquivo vinculado.')]));

  const historico = item.historico ?? item.auditoria ?? [];
  $('op-historico').replaceChildren(...(historico.length ? historico.map(a => {
    const li = el('li');
    li.append(el('strong',a.quando ?? a.tipo ?? 'Atualização'),el('p',a.texto ?? a.acao ?? ''));
    return li;
  }) : [el('li',procedimento && item.revisao ? 'Revisão atual: ' + item.revisao + '. Histórico anterior indisponível.' : 'Nenhuma atualização registrada.')]));

  const secoes = secoesOriginais(origem,procedimento);
  if (secoes.length) {
    if (procedimento && item.objetivo) secoes[0].nos.push(destaque('Objetivo',item.objetivo));
    if (!procedimento && item.conclusao) secoes[0].nos.push(destaque('Conclusão',item.conclusao));
    if (procedimento && item.atencao) secoes[0].nos.push(destaque('Atenção',item.atencao,'op-alerta'));
  }
  if (procedimento && item.etapas?.length) {
    const ol = el('ol',undefined,'proc-etapas');
    for (const [titulo,texto] of item.etapas) {
      const li = el('li');
      const grupo = el('div');
      grupo.append(el('strong',titulo),el('p',texto));
      li.append(grupo);
      ol.append(li);
    }
    secoes.push({titulo:'Procedimento Operacional',nos:[ol]});
  }
  if (!procedimento && item.circulacao?.length) {
    secoes.push({titulo:'Circulação',nos:item.circulacao.map(x => el('p',x))});
  }
  if (!secoes.length) secoes.push({titulo:procedimento ? 'Visão Geral' : 'Resumo Executivo',nos:[el('p',item.resumo ?? 'Sem resumo publicado.')]});

  let atual = 0;
  const menu = $('op-secoes');
  const titulo = $('op-secao-titulo');
  const controles = [];
  function abrir(i, focar = false) {
    atual = i;
    titulo.replaceChildren(iconeArquivo('file'),el('span',(procedimento ? i + 1 + '. ' : '') + secoes[i].titulo));
    $('op-texto').replaceChildren(...secoes[i].nos.map(x => x.cloneNode(true)));
    $('op-progresso').textContent = 'Seção ' + (i + 1) + ' de ' + secoes.length;
    $('op-anterior').disabled = i === 0;
    $('op-proxima').disabled = i === secoes.length - 1;
    controles.forEach((b,j) => b.setAttribute('aria-current',j === i ? 'step' : 'false'));
    if (focar) titulo.focus({preventScroll:true});
  }
  menu.replaceChildren(...secoes.map((secao,i) => {
    const li = el('li');
    const b = el('button',(procedimento ? i + 1 + '. ' : '') + secao.titulo);
    b.type = 'button';
    b.prepend(iconeArquivo('chevron-right'));
    b.addEventListener('click',() => abrir(i,true));
    controles.push(b);
    li.append(b);
    return li;
  }));
  $('op-anterior').onclick = () => { if (atual > 0) abrir(atual - 1,true); };
  $('op-proxima').onclick = () => { if (atual + 1 < secoes.length) abrir(atual + 1,true); };
  if ($('op-pdf')) {
    const artigo = $('op-texto').parentElement;
    artigo.querySelector('.op-impressao')?.remove();
    const impressao = el('div',undefined,'op-impressao');
    for (const [i,secao] of secoes.entries()) {
      const bloco = el('section');
      bloco.append(el('h3',i + 1 + '. ' + secao.titulo),...secao.nos.map(node => {
        const copia = node.cloneNode(true);
        copia.removeAttribute('id');
        for (const filho of copia.querySelectorAll('[id]')) filho.removeAttribute('id');
        return copia;
      }));
      impressao.append(bloco);
    }
    artigo.append(impressao);
    $('op-pdf').onclick = () => window.print();
  }
  abrir(0);
}
