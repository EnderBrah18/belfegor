import { contaEditorial } from './visibilidade.js?v=3';
import { regimes, ordinario, gestor, lerGovernanca, atosPara, situacao } from './governanca.js';

const painel = document.getElementById('rgi-painel');
const conta = await contaEditorial();
const podeGerir = gestor(conta);
const chave = 'belfegor-rgi-previa:' + conta?.usuario;
let publicados;
try { publicados = await lerGovernanca(); }
catch (erro) { painel.textContent = erro.message; throw erro; }

let previa = null;
if (podeGerir) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave));
    if (Array.isArray(salvo?.atos)) previa = salvo;
  } catch { /* O expediente publicado continua disponível. */ }
}

const elemento = (tag, texto, classe) => {
  const no = document.createElement(tag);
  if (texto) no.textContent = texto;
  if (classe) no.className = classe;
  return no;
};
function botao(texto, acao) {
  const no = elemento('button', texto, 'estrutura-botao');
  no.type = 'button';
  no.addEventListener('click', acao);
  return no;
}

const dialogo = document.getElementById('rgi-consulta');
const consultaTitulo = document.getElementById('rgi-consulta-titulo');
const consultaCorpo = document.getElementById('rgi-consulta-corpo');
function consultar(titulo, nos) {
  consultaTitulo.textContent = titulo;
  consultaCorpo.replaceChildren(...nos);
  if (!dialogo.open) dialogo.showModal();
}
const data = valor => valor ? new Date(valor).toLocaleString('pt-BR') : '';
const abrangencia = ato => [ato.escopo,...ato.alvos].join(' · ');
const nomeRegime = ato => regimes[ato.regime][0] + (ato.regime === 'absoluto' ? '' : ' — ' + ato.regime);
function listaDados(pares) {
  const lista = elemento('dl', null, 'estrutura-lista');
  for (const [rotulo, valor] of pares) {
    const linha = elemento('div');
    linha.append(elemento('dt',rotulo), elemento('dd',valor || '—'));
    lista.append(linha);
  }
  return lista;
}

function disposicoes(ato) {
  const lista = elemento('ul', null, 'rgi-disposicoes');
  const itens = ato.disposicoes?.length ? ato.disposicoes : regimes[ato.regime][3];
  lista.append(...itens.map(item => elemento('li',item)));
  return lista;
}

function atoNormativo(ato) {
  consultar('Ato normativo', [
    elemento('h3',nomeRegime(ato)),
    listaDados([
      ['Referência',ato.id],['Fundamentação',ato.fundamento],['Autoridade emissora',ato.emissor],
      ['Abrangência',abrangencia(ato)],['Entrada em vigor',data(ato.inicio) || 'Conforme registro'],
      ['Fim previsto',data(ato.fim) || 'Indeterminado'],['Situação',situacao(ato)],
      ['Classificação',ato.classificacao],['Justificativa',ato.justificativa],
      ['Encerramento efetivo',data(ato.revogadoEm || ato.substituidoEm || ato.fim)]
    ]),
    disposicoes(ato)
  ]);
}

function cartao(ato) {
  const no = elemento('article',null,'rgi-ato');
  const [ , condicao, cor ] = regimes[ato.regime];
  no.dataset.rgiCor = cor;
  no.append(
    elemento('p','Regime administrativo vigente','rgi-rotulo'),
    elemento('h3',nomeRegime(ato)),
    elemento('p',condicao,'rgi-condicao'),
    listaDados([
      ['Fundamentação',ato.fundamento],['Autoridade emissora',ato.emissor],
      ['Abrangência',abrangencia(ato)],['Entrada em vigor',data(ato.inicio) || 'Conforme registro'],
      ['Vigência',data(ato.fim) || 'Indeterminada']
    ]),
    elemento('h4','Disposições vigentes'),disposicoes(ato),
    botao('Consultar ato normativo',() => atoNormativo(ato))
  );
  return no;
}

function renderizar() {
  const atos = atosPara(previa ?? publicados, conta);
  const vigentes = atos.filter(ato => situacao(ato) === 'Em vigor');
  if (!vigentes.some(ato => ato.escopo === 'Institucional')) vigentes.unshift(ordinario);
  painel.replaceChildren(...vigentes.map(cartao),botao('Histórico de regimes',() => {
    const registros = [...atos].reverse().map(ato => {
      const registro = elemento('article',null,'rgi-registro');
      registro.append(elemento('h3',nomeRegime(ato)),
        elemento('p',[ato.id,abrangencia(ato),situacao(ato)].filter(Boolean).join(' · ')),
        botao('Consultar ato',() => atoNormativo(ato)));
      return registro;
    });
    consultar('Histórico de regimes',registros.length ? registros : [elemento('p','Nenhum ato registrado.')]);
  }));
  if (vigentes.length > 1) painel.prepend(elemento('p','Consulte cada ato vigente para verificar sua abrangência e suas competências.','rgi-rotulo'));
  if (podeGerir) {
    if (previa) painel.prepend(elemento('p','Prévia local · alterações pendentes de publicação.','rgi-rotulo'));
    atualizarSelecao();
  }
}

const gerencia = document.getElementById('rgi-gestao');
const formulario = document.getElementById('rgi-form');
const campos = formulario.elements;
const selecao = campos.namedItem('ato');
const mensagem = document.getElementById('rgi-mensagem');
const regime = campos.namedItem('regime');
const correspondente = campos.namedItem('correspondente');
const campoPublico = document.getElementById('rgi-correspondente');
const campoAlvos = document.getElementById('rgi-alvos');
const botaoRevogar = document.getElementById('rgi-revogar');

function atualizarSelecao() {
  selecao.replaceChildren(new Option('Novo ato',''));
  for (const ato of (previa ?? publicados).atos) {
    if (['Em vigor','Aguardando entrada em vigor'].includes(situacao(ato))) {
      selecao.add(new Option(ato.id + ' · ' + nomeRegime(ato),ato.id));
    }
  }
  preencher();
}

function ajustarCampos() {
  const absoluto = regime.value === 'absoluto';
  campoPublico.hidden = !absoluto;
  correspondente.required = absoluto;
  campos.emissor.readOnly = absoluto;
  if (absoluto) campos.emissor.value = 'Administrador';
  else if (campos.emissor.value === 'Administrador') campos.emissor.value = 'Conselho Diretor';
  campoAlvos.hidden = campos.escopo.value === 'Institucional';
  campos.alvos.required = !campoAlvos.hidden;
}

function paraInput(valor) {
  if (!valor) return '';
  const instante = new Date(valor);
  return new Date(instante.getTime() - instante.getTimezoneOffset()*60000).toISOString().slice(0,16);
}

function preencher() {
  const ato = (previa ?? publicados).atos.find(item => item.id === selecao.value);
  regime.value = ato?.regime ?? 'RGI-01';
  for (const nome of ['escopo','emissor','fundamento','justificativa','classificacao','correspondente']) {
    campos[nome].value = ato?.[nome] ?? {escopo:'Institucional',emissor:'Conselho Diretor',fundamento:'Regimento Geral da Fundação',classificacao:'Circulação geral'}[nome] ?? '';
  }
  campos.inicio.value = paraInput(ato?.inicio ?? Date.now());
  campos.fim.value = paraInput(ato?.fim);
  campos.alvos.value = ato?.alvos.join(', ') ?? '';
  campos.disposicoes.value = ato?.disposicoes.join('\n') ?? '';
  campos.comunicar.checked = false;
  botaoRevogar.disabled = !ato;
  ajustarCampos();
}

function salvar(atos, texto) {
  const dados = {atos};
  localStorage.setItem(chave, JSON.stringify(dados));
  previa = dados;
  mensagem.textContent = texto + ' Exportar o registro para publicação.';
  renderizar();
}

if (podeGerir) {
  gerencia.hidden = false;
  for (const [codigo, [titulo]] of Object.entries(regimes)) {
    regime.add(new Option(titulo,codigo));
    if (codigo !== 'absoluto') correspondente.add(new Option(titulo,codigo));
  }
  regime.addEventListener('change',ajustarCampos);
  campos.escopo.addEventListener('change',ajustarCampos);
  selecao.addEventListener('change',preencher);
  formulario.addEventListener('submit',evento => {
    evento.preventDefault();
    const dados = new FormData(formulario);
    const texto = chave => String(dados.get(chave) ?? '').trim();
    const atos = structuredClone((previa ?? publicados).atos);
    const anterior = atos.find(ato => ato.id === texto('ato'));
    const agora = new Date();
    const inicio = new Date(texto('inicio'));
    const fim = texto('fim') ? new Date(texto('fim')) : null;
    const escopo = texto('escopo');
    const alvos = escopo === 'Institucional' ? [] : [...new Set(texto('alvos').split(',').map(s=>s.trim()).filter(Boolean))];
    if (Number.isNaN(+inicio) || (fim && !(+fim > +inicio)) || (escopo !== 'Institucional' && !alvos.length)) {
      mensagem.textContent = 'Confira a abrangência e o período de vigência.';
      return;
    }
    if (!texto('emissor') || !texto('fundamento') || !texto('justificativa')) {
      mensagem.textContent = 'Preencha a autoridade emissora, a fundamentação e a justificativa.';
      return;
    }
    const acao = anterior ? 'Alteração decretada' : 'Regime decretado';
    if (!confirm(acao + '. Confirmar a atualização da prévia local?')) return;
    const absoluto = regime.value === 'absoluto';
    const regimeAto = {
      id:'ATO-' + crypto.randomUUID(), regime:regime.value, escopo, alvos,
      emissor:absoluto ? 'Administrador' : texto('emissor'), fundamento:texto('fundamento'),
      justificativa:texto('justificativa'), inicio:inicio.toISOString(), fim:fim?.toISOString() ?? null,
      classificacao:absoluto || /^administrador$/i.test(texto('emissor')) ? 'Restrito' : texto('classificacao'),
      disposicoes:texto('disposicoes').split('\n').map(s=>s.trim()).filter(Boolean), comunicados:[]
    };
    if (absoluto) {
      regimeAto.correspondente = correspondente.value;
      regimeAto.referenciaPublica = 'ATO-' + crypto.randomUUID();
    }
    if (anterior) {
      anterior.substituidoEm = new Date(Math.max(+inicio,+agora)).toISOString();
      regimeAto.substitui = anterior.id;
    }
    if (campos.comunicar.checked) regimeAto.comunicados.push({
      id:'ECHO-' + crypto.randomUUID().slice(0,8).toUpperCase(), acao, quando:regimeAto.inicio
    });
    atos.push(regimeAto);
    try { salvar(atos,acao + ' na prévia local.'); }
    catch { mensagem.textContent = 'Falha ao salvar a prévia neste navegador.'; }
  });
  botaoRevogar.addEventListener('click',() => {
    const atos = structuredClone((previa ?? publicados).atos);
    const ato = atos.find(item => item.id === selecao.value);
    if (!ato || !confirm('Confirmar a revogação na prévia local?')) return;
    ato.revogadoEm = new Date().toISOString();
    const anterior = atos.find(item => item.id === ato.substitui);
    if (anterior && Date.parse(ato.inicio) > Date.parse(ato.revogadoEm)) delete anterior.substituidoEm;
    if (campos.comunicar.checked) (ato.comunicados ??= []).push({
      id:'ECHO-' + crypto.randomUUID().slice(0,8).toUpperCase(), acao:'Regime revogado', quando:ato.revogadoEm
    });
    try { salvar(atos,'Revogação registrada na prévia local.'); }
    catch { mensagem.textContent = 'Falha ao salvar a prévia neste navegador.'; }
  });
  document.getElementById('rgi-descartar').addEventListener('click',() => {
    if (!previa || !confirm('Descartar as alterações locais?')) return;
    localStorage.removeItem(chave);
    previa = null;
    renderizar();
    mensagem.textContent = 'Registro publicado restaurado.';
  });
  document.getElementById('rgi-exportar').addEventListener('click',() => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(previa ?? publicados,null,2) + '\n'],{type:'application/json'}));
    const link = elemento('a');
    link.href = url;
    link.download = 'governanca.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
}
renderizar();
