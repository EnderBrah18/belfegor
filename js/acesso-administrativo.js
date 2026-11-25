export function acessoAdministrativo(conta) {
  return Boolean(conta?.ativo && conta.patente === 'G-7' && conta.acesso === 'NA-7');
}
