(() => {
  'use strict';

  const CHAVE = 'media-certa-v1';
  const NOTA_MAXIMA = 10;
  const MIN_AVALIACOES = 1;
  const MAX_AVALIACOES = 12;
  const padrao = () => ({ minima: '5,0', notas: ['', '', '', ''], tema: 'auto' });

  const $ = (id) => document.getElementById(id);
  const formatar = (valor, casas = 2) => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas, maximumFractionDigits: casas
  }).format(valor);

  // A string é mantida durante a edição para permitir vírgula decimal sem perder o cursor.
  function lerNota(texto) {
    const valor = String(texto ?? '').trim();
    if (!valor) return null;
    if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(valor)) return NaN;
    const numero = Number(valor.replace(',', '.'));
    return Number.isFinite(numero) && numero >= 0 && numero <= NOTA_MAXIMA ? numero : NaN;
  }

  function carregar() {
    try {
      const data = JSON.parse(localStorage.getItem(CHAVE));
      if (!data || typeof data !== 'object' || !Array.isArray(data.notas)) return padrao();
      const notas = data.notas.slice(0, MAX_AVALIACOES).map(valor => typeof valor === 'string' ? valor : String(valor ?? ''));
      while (notas.length < MIN_AVALIACOES) notas.push('');
      return {
        minima: typeof data.minima === 'string' ? data.minima : '5,0',
        notas,
        tema: ['auto', 'dark', 'light'].includes(data.tema) ? data.tema : 'auto'
      };
    } catch { return padrao(); }
  }

  const estado = carregar();
  const notaMinima = $('minima');
  const gradeGrid = $('grades-grid');
  notaMinima.value = estado.minima;

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
    catch { /* O cálculo continua funcionando se o armazenamento estiver bloqueado. */ }
  }

  function temaEfetivo() {
    if (estado.tema !== 'auto') return estado.tema;
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function aplicarTema() {
    const tema = temaEfetivo();
    document.documentElement.dataset.theme = tema;
    $('theme-toggle').setAttribute('aria-label', `Ativar tema ${tema === 'dark' ? 'claro' : 'escuro'}`);
    $('theme-toggle').title = `Ativar tema ${tema === 'dark' ? 'claro' : 'escuro'}`;
  }

  function validarCampo(container, erro, valor) {
    const invalido = Number.isNaN(valor);
    container.classList.toggle('invalid', invalido);
    if (erro) erro.hidden = !invalido;
    return !invalido;
  }

  function renderizarNotas() {
    gradeGrid.replaceChildren();
    estado.notas.forEach((nota, indice) => {
      const cartao = document.createElement('div');
      cartao.className = 'grade-field';
      const cabecalho = document.createElement('div');
      cabecalho.className = 'grade-top';
      const titulo = document.createElement('label');
      titulo.htmlFor = `nota-${indice}`;
      titulo.textContent = `Avaliação ${indice + 1}`;
      const auxiliar = document.createElement('span');
      auxiliar.className = 'grade-number';
      auxiliar.textContent = `#${String(indice + 1).padStart(2, '0')}`;
      cabecalho.append(titulo, auxiliar);
      const linha = document.createElement('div');
      linha.className = 'grade-bottom';
      const campo = document.createElement('input');
      campo.id = `nota-${indice}`;
      campo.type = 'text';
      campo.inputMode = 'decimal';
      campo.autocomplete = 'off';
      campo.spellcheck = false;
      campo.placeholder = '—';
      campo.maxLength = 8;
      campo.value = nota;
      campo.setAttribute('aria-describedby', `erro-${indice}`);
      const unidade = document.createElement('span');
      unidade.className = 'grade-unit';
      unidade.textContent = '/ 10';
      linha.append(campo, unidade);
      const erro = document.createElement('div');
      erro.id = `erro-${indice}`;
      erro.className = 'grade-error';
      erro.textContent = 'Use uma nota de 0 a 10.';
      erro.hidden = true;
      cartao.append(cabecalho, linha, erro);
      gradeGrid.append(cartao);
      campo.addEventListener('input', () => {
        estado.notas[indice] = campo.value;
        validarCampo(cartao, erro, lerNota(campo.value));
        atualizarResultado();
        salvar();
      });
      validarCampo(cartao, erro, lerNota(nota));
    });
    $('count-value').textContent = estado.notas.length;
    $('remove-evaluation').disabled = estado.notas.length <= MIN_AVALIACOES;
    $('add-evaluation').disabled = estado.notas.length >= MAX_AVALIACOES;
  }

  // Arredondamento para CIMA impede que a nota sugerida fique abaixo da meta.
  function arredondarCima(valor) {
    return Math.ceil((valor - 1e-9) * 100) / 100;
  }

  function simular(minima, notas) {
    const preenchidas = notas.filter(valor => valor !== null);
    const restantes = notas.length - preenchidas.length;
    const soma = preenchidas.reduce((acumulado, nota) => acumulado + nota, 0);
    const totalNecessario = minima * notas.length;
    const mediaAtual = preenchidas.length ? soma / preenchidas.length : null;
    const mediaMaxima = (soma + restantes * NOTA_MAXIMA) / notas.length;
    const mediaFinal = soma / notas.length;
    const atingiu = soma + 1e-9 >= totalNecessario;
    const possivel = soma + restantes * NOTA_MAXIMA + 1e-9 >= totalNecessario;
    const mediaNecessaria = restantes ? Math.max(0, (totalNecessario - soma) / restantes) : null;
    const progresso = totalNecessario <= 0 ? 100 : Math.max(0, Math.min(100, 100 * soma / totalNecessario));
    return { preenchidas: preenchidas.length, restantes, soma, mediaAtual, mediaMaxima,
      mediaFinal, atingiu, possivel, mediaNecessaria, totalNecessario, progresso };
  }

  function atualizarResultado() {
    const minimo = lerNota(estado.minima);
    const valores = estado.notas.map(lerNota);
    const valido = !Number.isNaN(minimo) && !valores.some(Number.isNaN);
    validarCampo(notaMinima.parentElement, $('minima-error'), minimo);
    const preenchidas = valores.filter(nota => nota !== null && !Number.isNaN(nota)).length;
    $('filled-badge').textContent = `${preenchidas} de ${estado.notas.length}`;

    const painel = $('result-panel');
    $('calculation-warning').hidden = valido;
    if (!valido) {
      painel.dataset.status = 'invalid';
      $('status-pill').textContent = 'Revise os dados';
      $('result-symbol').textContent = '!';
      $('result-title').textContent = 'Valores inválidos';
      $('required-value').textContent = '—';
      $('required-suffix').textContent = '';
      $('result-description').textContent = 'Use apenas notas de 0 a 10 e preencha com valores válidos.';
      $('current-value').textContent = '—';
      $('maximum-value').textContent = '—';
      $('remaining-value').textContent = '—';
      $('progress-label').textContent = '—';
      $('progress-fill').style.width = '0%';
      $('progressbar').setAttribute('aria-valuenow', '0');
      $('progress-detail').textContent = 'Corrija os campos destacados.';
      return;
    }

    const r = simular(minimo, valores);
    let status, rotulo, titulo, valor, sufixo = '/ 10', descricao, simbolo;
    if (r.restantes === 0) {
      if (r.atingiu) {
        status = 'success'; rotulo = 'Aprovado'; titulo = 'Média final';
        valor = formatar(r.mediaFinal); simbolo = '✓';
        descricao = `Aprovado! A média final de ${formatar(r.mediaFinal)} atingiu a média mínima de ${formatar(minimo)}.`;
      } else {
        status = 'danger'; rotulo = 'Não aprovado'; titulo = 'Média final';
        valor = formatar(r.mediaFinal); simbolo = '×';
        descricao = `Todas as avaliações foram preenchidas. A média final de ${formatar(r.mediaFinal)} ficou abaixo de ${formatar(minimo)}.`;
      }
    } else if (r.atingiu) {
      status = 'success'; rotulo = 'Aprovação garantida'; titulo = 'Média necessária';
      valor = '0,00'; simbolo = '✓';
      descricao = `A aprovação já está garantida: mesmo tirando 0 nas ${r.restantes} ${r.restantes === 1 ? 'avaliação restante' : 'avaliações restantes'}, a média final será ${formatar(r.mediaFinal)}.`;
    } else if (!r.possivel) {
      status = 'danger'; rotulo = 'Meta inalcançável'; titulo = 'Média necessária';
      valor = formatar(arredondarCima(r.mediaNecessaria)); simbolo = '!';
      descricao = `Seria necessário superar a nota 10 nas avaliações restantes. Mesmo com 10 em todas elas, a maior média final possível é ${formatar(r.mediaMaxima)}.`;
    } else {
      status = 'pending'; rotulo = r.preenchidas ? 'Em andamento' : 'Pronto para calcular'; titulo = 'Média necessária';
      valor = formatar(arredondarCima(r.mediaNecessaria)); simbolo = '↗';
      descricao = r.restantes === 1
        ? `O aluno precisa tirar pelo menos ${valor} na última avaliação para alcançar a média ${formatar(minimo)}.`
        : `O aluno precisa obter média de pelo menos ${valor} nas ${r.restantes} avaliações restantes para alcançar ${formatar(minimo)}.`;
    }
    painel.dataset.status = status;
    $('status-pill').textContent = rotulo;
    $('result-symbol').textContent = simbolo;
    $('result-title').textContent = titulo;
    $('required-value').textContent = valor;
    $('required-suffix').textContent = sufixo;
    $('result-description').textContent = descricao;
    $('current-value').textContent = r.mediaAtual === null ? '—' : formatar(r.mediaAtual);
    $('maximum-value').textContent = formatar(r.mediaMaxima);
    $('remaining-value').textContent = r.restantes;
    $('progress-label').textContent = `${Math.round(r.progresso)}%`;
    $('progress-fill').style.width = `${r.progresso}%`;
    $('progressbar').setAttribute('aria-valuenow', String(Math.round(r.progresso)));
    $('progress-detail').textContent = r.totalNecessario === 0
      ? 'A média mínima definida é zero.'
      : `${formatar(r.soma)} de ${formatar(r.totalNecessario)} pontos necessários`;
  }

  notaMinima.addEventListener('input', () => {
    estado.minima = notaMinima.value;
    atualizarResultado();
    salvar();
  });

  $('add-evaluation').addEventListener('click', () => {
    if (estado.notas.length >= MAX_AVALIACOES) return;
    estado.notas.push('');
    renderizarNotas();
    atualizarResultado();
    salvar();
    $(`nota-${estado.notas.length - 1}`).focus();
  });

  $('remove-evaluation').addEventListener('click', () => {
    if (estado.notas.length <= MIN_AVALIACOES) return;
    const ultima = estado.notas.at(-1);
    if (ultima.trim() && !window.confirm('A última avaliação já possui uma nota. Deseja removê-la?')) return;
    estado.notas.pop();
    renderizarNotas();
    atualizarResultado();
    salvar();
  });

  $('clear-button').addEventListener('click', () => {
    if (!estado.notas.some(valor => valor.trim())) return;
    if (!window.confirm('Deseja apagar todas as notas desta simulação? A média mínima e o total de avaliações serão mantidos.')) return;
    estado.notas = estado.notas.map(() => '');
    renderizarNotas();
    atualizarResultado();
    salvar();
  });

  $('example-button').addEventListener('click', () => {
    if (estado.notas.some(valor => valor.trim()) && !window.confirm('Substituir as notas preenchidas por um exemplo?')) return;
    estado.minima = '5,0';
    estado.notas = ['6,0', '4,0', '', ''];
    notaMinima.value = estado.minima;
    renderizarNotas();
    atualizarResultado();
    salvar();
  });

  $('theme-toggle').addEventListener('click', () => {
    estado.tema = temaEfetivo() === 'dark' ? 'light' : 'dark';
    aplicarTema();
    salvar();
  });
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (estado.tema === 'auto') aplicarTema();
  });

  aplicarTema();
  renderizarNotas();
  atualizarResultado();
})();
