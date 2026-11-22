(() => {
  const painel = document.querySelector('[data-bf-account]');
  const chaveSessao = 'belfegor-sessao-v1';
  const chaveFicha = 'belfegor-ficha-v1';

  if (!painel) {
    addEventListener('belfegor:registro-salvo', () => {
      try {
        const ficha = lerFicha();
        if (ficha) localStorage.setItem(chaveSessao, ficha.ident);
      } catch {
        // O registro salvo continua disponível para entrar pelo portal.
      }
    });
    return;
  }

  const cadastro = painel.querySelector('[data-bf-register]');
  const entrar = painel.querySelector('[data-bf-login]');
  const perfil = painel.querySelector('[data-bf-profile]');
  const sair = painel.querySelector('[data-bf-logout]');
  const linkCadastro = perfil.getAttribute('href');
  const diretorio = document.querySelector('[data-bf-diretorio]');

  function lerFicha() {
    try {
      const ficha = JSON.parse(localStorage.getItem(chaveFicha));
      if (
        typeof ficha?.nome === 'string' && ficha.nome.trim() &&
        typeof ficha.ident === 'string' && ficha.ident.trim() &&
        /^G-[0-6]$/.test(ficha.patente) && /^NA-[0-4]$/.test(ficha.acesso)
      ) return ficha;
    } catch {
      // A ficha pode estar indisponível neste navegador.
    }
    return null;
  }

  function fichaAtiva() {
    try {
      const ficha = lerFicha();
      const anterior = sessionStorage.getItem(chaveSessao);
      const sessao = localStorage.getItem(chaveSessao) ?? anterior;
      if (anterior !== null) {
        if (sessao === anterior) localStorage.setItem(chaveSessao, sessao);
        sessionStorage.removeItem(chaveSessao);
      }
      if (!sessao) return null;
      if (sessao.startsWith('{')) {
        const perfilImportado = JSON.parse(sessao);
        return { ...perfilImportado, importado: true };
      }
      return ficha && sessao === ficha.ident ? ficha : null;
    } catch {
      return null;
    }
  }

  function atualizar() {
    const ficha = fichaAtiva();
    cadastro.hidden = Boolean(ficha);
    entrar.hidden = Boolean(ficha);
    perfil.hidden = !ficha;
    sair.hidden = !ficha;
    perfil.href = ficha?.importado ? entrar.href : linkCadastro;
    perfil.textContent = ficha ? [ficha.nome, ficha.patente, ficha.acesso].join(' · ') : '';

    if (diretorio) {
      diretorio.hidden = !ficha;
      if (ficha) {
        const titulo = document.createElement('h2');
        titulo.textContent = 'Circulação funcional';
        const torre = document.createElement('p');
        torre.textContent = Number(ficha.patente.slice(2)) >= 4
          ? 'Sua patente atende ao requisito de entrada regular nos setores internos da Torre Central.'
          : 'A entrada nos setores internos da Torre Central exige convocação, missão ou escolta para sua patente.';
        const acesso = document.createElement('p');
        acesso.textContent = ficha.acesso === 'NA-0'
          ? 'Credencial NA-0. Consulte as áreas de circulação comum.'
          : 'Credencial ' + ficha.acesso + '. Antes de entrar em uma área restrita, confira a autorização exigida e sua atribuição no local.';
        diretorio.replaceChildren(titulo, torre, acesso);
      } else {
        diretorio.replaceChildren();
      }
    }
  }

  sair.addEventListener('click', () => {
    sessionStorage.removeItem(chaveSessao);
    localStorage.removeItem(chaveSessao);
    atualizar();
    entrar.focus();
  });
  addEventListener('pageshow', atualizar);
  addEventListener('storage', (evento) => {
    if (!evento.key || evento.key === chaveSessao) sessionStorage.removeItem(chaveSessao);
    if (!evento.key || evento.key === chaveSessao || evento.key === chaveFicha) atualizar();
  });
  atualizar();
})();
