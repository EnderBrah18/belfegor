import assert from 'node:assert/strict';
import test from 'node:test';
import { descobrir, documentosRelacionados, anexosAutorizados, aplicarVinculos } from '../js/descoberta-documental.js';

const conta = (acesso, patente = 3, departamento = 'Logística') => ({ativo:true,acesso:'NA-'+acesso,patente:'G-'+patente,departamento});
const origem = {codigo:'BF-PRO-0001',href:'documentos/origem.html'};
const profundo = {codigo:'BF-LOG-REG-0002',titulo:'Conciliação de remessa',resumo:'Operação de cargas',setor:'Logística',
  profundidade:4,termosDescoberta:['via de conciliação antiga'],palavrasChave:['cargas'],
  href:'documentos/conciliacao.html',visibilidade:{naMinimo:5,patenteMinima:3,departamentos:['Logística']},
  relacionados:[origem.codigo]};

test('pesquisas genéricas e todas as listagens omitem o fundo de arquivo', () => {
  for (const via of ['listagem','expediente']) assert.equal(descobrir(profundo,conta(5),via),false);
  for (const consulta of ['', '  ', 'BF-LOG', 'conciliação', 'cargas','Logística','via de conciliação'])
    assert.equal(descobrir(profundo,conta(5),'busca',consulta),false);
  for (const consulta of [profundo.codigo, 'conciliacao de remessa', 'VIA DE CONCILIAÇÃO ANTIGA'])
    assert.equal(descobrir(profundo,conta(5),'busca',consulta),true);
});

test('a autorização continua obrigatória em todos os canais de descoberta', () => {
  const contasNegadas = [null,conta(2),conta(5,2),conta(5,3,'Pesquisa'),{...conta(5),ativo:false}];
  for (const usuario of contasNegadas) {
    for (const via of ['direto','referencia','anexo','mensagem','pessoal','busca'])
      assert.equal(descobrir(profundo,usuario,via,profundo.codigo),false);
    assert.deepEqual(documentosRelacionados({...origem,relacionados:[profundo.codigo]},[profundo],usuario),[]);
    assert.deepEqual(anexosAutorizados({anexos:[{href:profundo.href,titulo:'Título alternativo'}]},[profundo],usuario),[]);
  }
  for (const via of ['direto','referencia','anexo','mensagem','pessoal'])
    assert.equal(descobrir(profundo,conta(5),via),true);
  assert.equal(descobrir(profundo,conta(7,7,'Administração'),'direto'),true);
});

test('histórico usa termos cadastrados e camada ativa independe da idade e situação', () => {
  const antigo = {profundidade:3,palavrasChave:['registro inicial']};
  assert.equal(descobrir(antigo,null),false);
  assert.equal(descobrir(antigo,null,'busca','registro'),true);
  assert.equal(descobrir({profundidade:2,publicadoEm:'1800',situacao:'Em vigor'},null),true);
  assert.equal(descobrir({profundidade:2},null,'expediente'),false);
});

test('referências devem ser intencionais e anexos respeitam ambos os níveis de autorização', () => {
  assert.deepEqual(documentosRelacionados(origem,[profundo],conta(5)),[]);
  assert.deepEqual(documentosRelacionados({...origem,relacionados:[profundo.codigo]},[profundo],conta(5)),[profundo]);
  assert.equal(anexosAutorizados({anexos:[{codigo:profundo.codigo}]},[profundo],conta(5))[0].href,profundo.href);
  assert.deepEqual(anexosAutorizados({anexos:[{codigo:profundo.codigo,visibilidade:{naMinimo:6}}]},[profundo],conta(5)),[]);
  assert.deepEqual(anexosAutorizados({anexos:[{codigo:'BF-INEXISTENTE'}]},[profundo],conta(5)),[]);
});

test('regras exatas e combinação superior continuam valendo', () => {
  const reservado = {...profundo,visibilidade:{naExato:6,patenteExata:6}};
  assert.equal(descobrir(reservado,conta(6,5),'direto'),false);
  assert.equal(descobrir(reservado,conta(5,6),'direto'),false);
  assert.equal(descobrir(reservado,conta(6,6),'direto'),true);
});

test('links incorporados ficam invisíveis sem autorização e reaparecem após validação', () => {
  const link = { href:new URL('../documentos/conciliacao.html',import.meta.url).href, dataset:{}, style:{}, closest:()=>null };
  const raiz = {querySelectorAll:()=>[link]};
  aplicarVinculos(raiz,[profundo],conta(2));
  assert.equal(link.hidden,true);
  assert.equal(link.style.display,'none');
  aplicarVinculos(raiz,[profundo],conta(5));
  assert.equal(link.hidden,false);
  assert.equal(link.style.display,'');
});
