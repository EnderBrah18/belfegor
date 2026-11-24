import { visivel } from './visibilidade.js?v=3';

export const regimes = {
  'RGI-01': ['Regime Ordinário', 'Normalidade institucional', 'verde', ['Cadeia de comando regular', 'Competências departamentais preservadas', 'Garantias funcionais preservadas', 'Procedimentos ordinários em vigor']],
  'RGI-02': ['Regime de Vigilância', 'Vigilância institucional ampliada', 'ciano', ['Monitoramento interno ampliado', 'Fiscalização de credenciais', 'Auditorias extraordinárias', 'Intensificação dos procedimentos de segurança']],
  'RGI-03': ['Regime Extraordinário', 'Competências extraordinárias em vigor', 'amarelo', ['Redistribuição prioritária de recursos', 'Concessão de competências temporárias', 'Procedimentos administrativos especiais', 'Flexibilização de determinadas exigências regimentais']],
  'RGI-04': ['Regime de Exceção', 'Regimento ordinário parcialmente suspenso', 'laranja', ['Restrições de circulação', 'Centralização de decisões administrativas', 'Suspensão parcial de garantias funcionais', 'Aplicação de procedimentos excepcionais']],
  'RGI-05': ['Regime Marcial', 'Comando de segurança extraordinário', 'vermelho', ['Subordinação às determinações do comando de segurança', 'Deslocamentos sujeitos à autorização', 'Suspensão de atividades não essenciais', 'Priorização das operações de segurança e contenção', 'Restrições administrativas extraordinárias']],
  'RGI-06': ['Regime de Continuidade', 'Preservação institucional prioritária', 'violeta', ['Ativação da cadeia de sucessão emergencial', 'Preservação de ativos institucionais essenciais', 'Aplicação dos protocolos de continuidade', 'Priorização da sobrevivência institucional', 'Suspensão de atividades incompatíveis com a continuidade da Fundação']],
  absoluto: ['Regime de Intervenção Absoluta', 'Autoridade administrativa suprema em exercício', 'reservado', ['Exercício direto da autoridade do Administrador', 'Subordinação extraordinária do Conselho Diretor', 'Subordinação extraordinária da Direção-Geral', 'Suspensão de disposições regimentais conflitantes', 'Vigência até determinação superior']]
};
const filtroAdministrador = { visibilidade: { patenteMinima: 6, naMinimo: 6 } };
export const consultaReservada = conta => visivel(filtroAdministrador, conta);
export const gestor = conta => conta?.identificador === 'BF-00000' && conta.patente === 'G-7' && conta.acesso === 'NA-7' && consultaReservada(conta);

export async function lerGovernanca() {
  const resposta = await fetch(new URL('../dados/governanca.json', import.meta.url), {cache:'no-store'});
  if (!resposta.ok) throw Error('Registro de governança indisponível.');
  const dados = await resposta.json();
  if (!Array.isArray(dados.atos)) throw Error('Registro de governança inválido.');
  return dados;
}

export const ordinario = {
  id: 'RGI-01 · Referência', regime:'RGI-01', fundamento:'Regimento Geral da Fundação',
  emissor:'Conselho Diretor', escopo:'Institucional', alvos:[], disposicoes:[], classificacao:'Circulação geral'
};

const normalizar = texto => String(texto ?? '').trim().toLocaleLowerCase('pt-BR');
export function aplicavel(ato, conta) {
  if (ato.escopo === 'Institucional') return true;
  const campos = { Setorial:'departamento', Local:'instalacao', Regional:'regiao' };
  const valor = normalizar(conta?.[campos[ato.escopo]]);
  return Boolean(valor && ato.alvos?.some(alvo => normalizar(alvo) === valor));
}

export function situacao(ato, agora = Date.now()) {
  const encerramentos = [[ato.fim,'Encerrado'],[ato.revogadoEm,'Revogado'],[ato.substituidoEm,'Substituído']]
    .filter(([quando]) => quando && Date.parse(quando) <= agora)
    .sort(([a],[b]) => Date.parse(a) - Date.parse(b));
  if (encerramentos.length) return encerramentos[0][1];
  if (ato.inicio && Date.parse(ato.inicio) > agora) return 'Aguardando entrada em vigor';
  return 'Em vigor';
}

export function projetar(ato, conta) {
  if (!Object.hasOwn(regimes,ato.regime) || (!aplicavel(ato, conta) && !gestor(conta))) return null;
  if (ato.regime !== 'absoluto' && ato.classificacao !== 'Restrito' && normalizar(ato.emissor) !== 'administrador') return ato;
  if (consultaReservada(conta)) return ato;
  if (ato.regime !== 'absoluto' || !/^RGI-0[1-6]$/.test(ato.correspondente)) return null;
  return {
    id: ato.referenciaPublica, regime: ato.correspondente, escopo: ato.escopo, alvos: ato.alvos,
    emissor: 'Conselho Diretor', fundamento: 'Regimento Geral da Fundação',
    inicio: ato.inicio, fim: ato.fim, revogadoEm: ato.revogadoEm, substituidoEm: ato.substituidoEm,
    disposicoes: [], classificacao: 'Circulação geral',
    comunicados: ato.comunicados?.map(aviso => ({id:aviso.id, acao:aviso.acao, quando:aviso.quando}))
  };
}

export function atosPara(dados, conta) {
  return dados.atos.map(ato => projetar(ato,conta)).filter(Boolean);
}

export async function comunicadosGovernanca(conta) {
  const dados = await lerGovernanca();
  return atosPara(dados, conta).flatMap(ato => (ato.comunicados ?? [])
    .filter(aviso => Date.parse(aviso.quando) <= Date.now())
    .map(aviso => {
      const regime = regimes[ato.regime][0];
      const escopo = ato.alvos.length ? ato.escopo + ' · ' + ato.alvos.join(', ') : ato.escopo;
      const resumo = regime + ' · ' + aviso.acao + '. Abrangência: ' + escopo + '.';
      return {
        codigo: aviso.id, titulo:'Alteração do regime administrativo', resumo,
        corpo:[resumo, 'Consulte as determinações na seção Estrutura Institucional da rede interna.'],
        setor:'S.I.G.M.A.', categoria:'Operacionais', prioridade:'Rotina', edicao:'recente',
        referencia: new Date(aviso.quando).toLocaleDateString('pt-BR'), situacao:aviso.acao
      };
    }));
}

export async function lerCatalogo(nome, conta, raiz = new URL('../', import.meta.url)) {
  const resposta = await fetch(new URL('dados/' + nome + '.json', raiz), {cache:'no-store'});
  if (!resposta.ok) throw Error('Catálogo indisponível');
  const itens = await resposta.json();
  if (nome !== 'comunicados') return itens;
  const avisos = await comunicadosGovernanca(conta).catch(() => []);
  return [...avisos.reverse(), ...itens];
}
