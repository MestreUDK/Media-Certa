(() => {
  'use strict';

  const CHAVE = 'media-certa-v2';
  const CHAVE_ANTERIOR = 'media-certa-v1';
  const NOTA_MAXIMA = 10;
  const PESO_MAXIMO = 1000;
  const MIN_AVALIACOES = 1;
  const MAX_AVALIACOES = 12;
  const padrao = () => ({
    minima: '5,0', notas: ['', '', '', ''], pesos: ['1', '1', '1', '1'],
    modo: 'simples', tema: 'auto'
  });

  const $ = (id) => document.getElementById(id);
  const formatar = (valor, casas = 2) => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas, maximumFractionDigits: casas
  }).format(valor);

  // Mantenha textos durante a edição (permite a digitação de vírgula e decimais incompletos).
  function lerNumero(texto, minimo, maximo, aceitaZero) {
    const valor = String(texto ?? '').trim();
    if (!valor) return null;
    if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(valor)) return NaN;
    const numero = Number(valor.replace(',', '.'));
    return Number.isFinite(numero) && numero >= minimo && numero <= maximo && (aceitaZero || numero > 0)
      ? numero : NaN;
  }
  const lerNota = (valor) => lerNumero(valor, 0, NOTA_MAXIMA, true);
  const lerPeso = (valor) => lerNumero(valor, 0, PESO_MAXIMO, false);

  function carregar() {
    try {
      const texto = localStorage.getItem(CHAVE) || localStorage.getItem(CHAVE_ANTERIOR);
      const dados = JSON.parse(texto);
      if (!dados || typeof dados !== 'object' || !Array.isArray(dados.notas)) return padrao();
      const notas = dados.notas.slice(0, MAX_AVALIACOES).map(v => String(v ?? ''));
      while (notas.length < MIN_AVALIACOES) notas.push('');
      const pesos = notas.map((_, i) => dados.pesos && Array.isArray(dados.pesos)
        ? String(dados.pesos[i] ?? '1') : '1');
      return {
        minima: typeof dados.minima === 'string' ? dados.minima : '5,0',
        notas, pesos,
        modo: dados.modo === 'ponderado' ? 'ponderado' : 'simples',
        tema: ['auto', 'dark', 'light'].includes(dados.tema) ? dados.tema : 'auto'
      };
    } catch { return padrao(); }
  }

  const estado = carregar();
  const notaMinima = $('minima');
  const gradeGrid = $('grades-grid');
  notaMinima.value = estado.minima;

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
    catch { /* Sem armazenamento, o cálculo continua funcionando. */ }
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

  function validarCampo(container, erro, numero, obrigatorio = false) {
    const invalido = Number.isNaN(numero) || (obrigatorio && numero === null);
    container.classList.toggle('invalid', invalido);
    if (erro) erro.hidden = !invalido;
    return !invalido;
  }

  function atualizarModoVisual() {
    const ponderado = estado.modo === 'ponderado';
    $('mode-simple').classList.toggle('active', !ponderado);
    $('mode-weighted').classList.toggle('active', ponderado);
    $('mode-simple').setAttribute('aria-pressed', String(!ponderado));
    $('mode-weighted').setAttribute('aria-pressed', String(ponderado));
    $('mode-hint').textContent = ponderado
      ? 'Informe o peso de cada avaliação. Os valores podem ser proporcionais ou percentuais.'
      : 'Todas as avaliações têm o mesmo peso.';
    $('grades-description').textContent = ponderado
      ? 'Preencha as notas realizadas e defina o peso de todas as avaliações'
      : 'Preencha apenas as que já aconteceram';
    $('weights-summary').hidden = !ponderado;
    $('remaining-weight-metric').hidden = !ponderado;
    $('current-label').textContent = ponderado ? 'Média ponderada das notas lançadas' : 'Média das notas lançadas';
    $('calculation-tip').innerHTML = ponderado
      ? '<strong>Como é calculado?</strong> Cada nota é multiplicada pelo seu peso; os produtos são divididos pela soma dos pesos. A nota exigida é a média ponderada que falta nas avaliações pendentes, não uma nota individual obrigatória para cada uma.'
      : '<strong>Como é calculado?</strong> Todas as avaliações têm o mesmo peso. A aplicação considera nota máxima 10 e calcula a média exigida nas avaliações que ainda faltam.';
  }

  function renderizarNotas() {
    gradeGrid.replaceChildren();
    const ponderado = estado.modo === 'ponderado';
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
      campo.maxLength = 12;
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

      if (ponderado) {
        const blocoPeso = document.createElement('div');
        blocoPeso.className = 'weight-block';
        const pesoLabel = document.createElement('label');
        pesoLabel.htmlFor = `peso-${indice}`;
        pesoLabel.textContent = 'Peso desta avaliação';
        const pesoWrap = document.createElement('div');
        pesoWrap.className = 'weight-input-wrap';
        const campoPeso = document.createElement('input');
        campoPeso.id = `peso-${indice}`;
        campoPeso.type = 'text';
        campoPeso.inputMode = 'decimal';
        campoPeso.autocomplete = 'off';
        campoPeso.spellcheck = false;
        campoPeso.maxLength = 12;
        campoPeso.placeholder = '1';
        campoPeso.value = estado.pesos[indice];
        campoPeso.setAttribute('aria-describedby', `erro-peso-${indice}`);
        const erroPeso = document.createElement('div');
        erroPeso.id = `erro-peso-${indice}`;
        erroPeso.className = 'grade-error';
        erroPeso.textContent = 'Informe um peso maior que 0 e até 1000.';
        erroPeso.hidden = true;
        pesoWrap.append(campoPeso);
        blocoPeso.append(pesoLabel, pesoWrap, erroPeso);
        cartao.append(blocoPeso);
        campoPeso.addEventListener('input', () => {
          estado.pesos[indice] = campoPeso.value;
          validarCampo(pesoWrap, erroPeso, lerPeso(campoPeso.value), true);
          atualizarResultado();
          salvar();
        });
        validarCampo(pesoWrap, erroPeso, lerPeso(campoPeso.value), true);
      }

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

  // Para sugerir uma nota com duas casas, arredondar sempre para cima, não para o valor mais próximo.
  function arredondarCima(valor) {
    return Math.ceil((valor - 1e-9) * 100) / 100;
  }

  // O modo simples é um caso particular: cada avaliação recebe peso 1.
  function simular(minima, notas, pesos) {
    const pesoTotal = pesos.reduce((a, b) => a + b, 0);
    const pesoPreenchido = notas.reduce((s, nota, i) => s + (nota === null ? 0 : pesos[i]), 0);
    const pesoRestante = pesoTotal - pesoPreenchido;
    const pontos = notas.reduce((s, nota, i) => s + (nota === null ? 0 : nota * pesos[i]), 0);
    const preenchidas = notas.filter(nota => nota !== null).length;
    const restantes = notas.length - preenchidas;
    const totalNecessario = minima * pesoTotal;
    const mediaAtual = pesoPreenchido ? pontos / pesoPreenchido : null;
    const mediaMaxima = (pontos + pesoRestante * NOTA_MAXIMA) / pesoTotal;
    const mediaFinal = pontos / pesoTotal; // pendentes equivalem a zero para essa projeção
    const atingiu = pontos + 1e-9 >= totalNecessario;
    const possivel = pontos + pesoRestante * NOTA_MAXIMA + 1e-9 >= totalNecessario;
    const mediaNecessaria = pesoRestante ? Math.max(0, (totalNecessario - pontos) / pesoRestante) : null;
    const progresso = totalNecessario <= 0 ? 100 : Math.min(100, Math.max(0, 100 * pontos / totalNecessario));
    return { preenchidas, restantes, pontos, pesoTotal, pesoRestante, mediaAtual, mediaMaxima,
      mediaFinal, atingiu, possivel, mediaNecessaria, totalNecessario, progresso };
  }

  function atualizarResultado() {
    const ponderado = estado.modo === 'ponderado';
    const minimo = lerNota(estado.minima);
    const valores = estado.notas.map(lerNota);
    const pesos = ponderado ? estado.pesos.map(lerPeso) : estado.notas.map(() => 1);
    const valido = minimo !== null && !Number.isNaN(minimo)
      && !valores.some(Number.isNaN)
      && pesos.every(p => p !== null && !Number.isNaN(p));
    validarCampo(notaMinima.parentElement, $('minima-error'), minimo, true);
    const preenchidas = valores.filter(nota => nota !== null && !Number.isNaN(nota)).length;
    $('filled-badge').textContent = `${preenchidas} de ${estado.notas.length}`;
    $('total-weight').textContent = valido && ponderado ? formatar(pesos.reduce((a, b) => a + b, 0)) : '—';

    const painel = $('result-panel');
    $('calculation-warning').hidden = valido;
    if (!valido) {
      painel.dataset.status = 'invalid';
      $('status-pill').textContent = 'Revise os dados';
      $('result-symbol').textContent = '!';
      $('result-title').textContent = 'Valores inválidos';
      $('required-value').textContent = '—';
      $('required-suffix').textContent = '';
      $('result-description').textContent = ponderado
        ? 'Verifique a média mínima, as notas e todos os pesos. Os pesos devem ser maiores que zero.'
        : 'Use apenas notas de 0 a 10 e preencha a média mínima.';
      $('current-value').textContent = '—';
      $('maximum-value').textContent = '—';
      $('remaining-value').textContent = '—';
      $('remaining-weight').textContent = '—';
      $('progress-label').textContent = '—';
      $('progress-fill').style.width = '0%';
      $('progressbar').setAttribute('aria-valuenow', '0');
      $('progress-detail').textContent = 'Corrija os campos destacados.';
      return;
    }

    const r = simular(minimo, valores, pesos);
    const adjetivo = ponderado ? 'ponderada' : '';
    let status, rotulo, titulo, valor, descricao, simbolo;
    if (r.restantes === 0) {
      if (r.atingiu) {
        status = 'success'; rotulo = 'Aprovado'; titulo = 'Média final';
        valor = formatar(r.mediaFinal); simbolo = '✓';
        descricao = `Aprovado! A média final ${adjetivo} de ${formatar(r.mediaFinal)} atingiu a média mínima de ${formatar(minimo)}.`;
      } else {
        status = 'danger'; rotulo = 'Não aprovado'; titulo = 'Média final';
        valor = formatar(r.mediaFinal); simbolo = '×';
        descricao = `Todas as avaliações foram preenchidas. A média final ${adjetivo} de ${formatar(r.mediaFinal)} ficou abaixo de ${formatar(minimo)}.`;
      }
    } else if (r.atingiu) {
      status = 'success'; rotulo = 'Aprovação garantida'; titulo = 'Média necessária';
      valor = '0,00'; simbolo = '✓';
      descricao = `A aprovação já está garantida: mesmo tirando zero nas ${r.restantes} ${r.restantes === 1 ? 'avaliação restante' : 'avaliações restantes'}, a média final será ${formatar(r.mediaFinal)}.`;
    } else if (!r.possivel) {
      status = 'danger'; rotulo = 'Meta inalcançável'; titulo = ponderado ? 'Média ponderada necessária' : 'Média necessária';
      valor = formatar(arredondarCima(r.mediaNecessaria)); simbolo = '!';
      descricao = `A meta não pode ser alcançada: seria necessária média superior a 10 nas avaliações restantes. Mesmo com 10 em todas, a maior média final possível é ${formatar(r.mediaMaxima)}.`;
    } else {
      status = 'pending'; rotulo = r.preenchidas ? 'Em andamento' : 'Pronto para calcular';
      titulo = ponderado ? 'Média ponderada necessária' : 'Média necessária';
      valor = formatar(arredondarCima(r.mediaNecessaria)); simbolo = '↗';
      if (r.restantes === 1) {
        descricao = `O aluno precisa tirar pelo menos ${valor} na última avaliação (peso ${formatar(r.pesoRestante)}) para alcançar ${formatar(minimo)}.`;
      } else if (ponderado) {
        descricao = `Nas ${r.restantes} avaliações restantes, é necessária média ponderada de pelo menos ${valor}. As notas podem ser diferentes, desde que respeitem os pesos.`;
      } else {
        descricao = `O aluno precisa obter média de pelo menos ${valor} nas ${r.restantes} avaliações restantes para alcançar ${formatar(minimo)}.`;
      }
    }
    painel.dataset.status = status;
    $('status-pill').textContent = rotulo;
    $('result-symbol').textContent = simbolo;
    $('result-title').textContent = titulo;
    $('required-value').textContent = valor;
    $('required-suffix').textContent = '/ 10';
    $('result-description').textContent = descricao;
    $('current-value').textContent = r.mediaAtual === null ? '—' : formatar(r.mediaAtual);
    $('maximum-value').textContent = formatar(r.mediaMaxima);
    $('remaining-value').textContent = r.restantes;
    $('remaining-weight').textContent = formatar(r.pesoRestante);
    $('progress-label').textContent = `${Math.round(r.progresso)}%`;
    $('progress-fill').style.width = `${r.progresso}%`;
    $('progressbar').setAttribute('aria-valuenow', String(Math.round(r.progresso)));
    $('progress-detail').textContent = r.totalNecessario === 0
      ? 'A média mínima definida é zero.'
      : `${formatar(r.pontos)} de ${formatar(r.totalNecessario)} ${ponderado ? 'pontos ponderados' : 'pontos'} necessários`;
  }

  function trocarModo(modo) {
    if (estado.modo === modo) return;
    estado.modo = modo;
    atualizarModoVisual();
    renderizarNotas();
    atualizarResultado();
    salvar();
  }

  $('mode-simple').addEventListener('click', () => trocarModo('simples'));
  $('mode-weighted').addEventListener('click', () => trocarModo('ponderado'));

  notaMinima.addEventListener('input', () => {
    estado.minima = notaMinima.value;
    atualizarResultado();
    salvar();
  });

  $('add-evaluation').addEventListener('click', () => {
    if (estado.notas.length >= MAX_AVALIACOES) return;
    estado.notas.push('');
    estado.pesos.push('1');
    renderizarNotas();
    atualizarResultado();
    salvar();
    $(`nota-${estado.notas.length - 1}`).focus();
  });

  $('remove-evaluation').addEventListener('click', () => {
    if (estado.notas.length <= MIN_AVALIACOES) return;
    const ultima = estado.notas.at(-1);
    const pesoAlterado = estado.pesos.at(-1) !== '1';
    if ((ultima.trim() || pesoAlterado) && !window.confirm('A última avaliação possui uma nota ou peso personalizado. Deseja removê-la?')) return;
    estado.notas.pop();
    estado.pesos.pop();
    renderizarNotas();
    atualizarResultado();
    salvar();
  });

  $('clear-button').addEventListener('click', () => {
    if (!estado.notas.some(valor => valor.trim())) return;
    if (!window.confirm('Deseja apagar todas as notas desta simulação? Os pesos e as configurações serão mantidos.')) return;
    estado.notas = estado.notas.map(() => '');
    renderizarNotas();
    atualizarResultado();
    salvar();
  });

  $('example-button').addEventListener('click', () => {
    if (estado.notas.some(valor => valor.trim()) && !window.confirm('Substituir as notas preenchidas por um exemplo?')) return;
    if (estado.modo === 'ponderado') {
      estado.minima = '6,0';
      estado.notas = ['8,0', '4,0', '', ''];
      estado.pesos = ['1', '3', '2', '4'];
    } else {
      estado.minima = '5,0';
      estado.notas = ['6,0', '4,0', '', ''];
      estado.pesos = ['1', '1', '1', '1'];
    }
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
  atualizarModoVisual();
  renderizarNotas();
  atualizarResultado();
  salvar(); // Migra com segurança as configurações salvas na versão 1.0.
})();
