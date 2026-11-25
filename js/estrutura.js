import { contaEditorial, aplicarVisibilidadeSuperior } from './visibilidade.js?v=4';


const abas = [...document.querySelectorAll('.estrutura-abas a')];
const detalhes = [...document.querySelectorAll('[data-estrutura-detalhe]')];
const autoridades = document.getElementById('autoridades');
const relacionados = document.getElementById('relacionados');

function apresentar() {
  const aba = abas.find(link => !link.hidden && link.hash === location.hash);
  const destaque = aba ?? abas.find(link => !link.hidden);
  for (const link of abas) {
    if (link === destaque) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  for (const painel of detalhes) painel.hidden = aba?.hash !== '#' + painel.dataset.estruturaDetalhe;
  autoridades.hidden = Boolean(aba);
  relacionados.hidden = Boolean(aba);
}

window.addEventListener('hashchange', apresentar);
apresentar();

aplicarVisibilidadeSuperior(await contaEditorial());
apresentar();
window.addEventListener('bf-credencial-atualizada', apresentar);
