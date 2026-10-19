# Média Certa v1.1.0 — Calculadora de Aprovação

🔗 **Acesse a aplicação:** https://mestreudk.github.io/Media-Certa/

Aplicação 100% estática para calcular quanto um aluno precisa tirar nas avaliações restantes para alcançar uma média mínima. Oferece **modo simples** e **modo ponderado**, funciona em celular e computador, sem cadastro, banco de dados ou dependências externas. Ideal para hospedar no GitHub Pages.

## Funcionalidades

- **Dois modos de cálculo** com alternância instantânea:
  - **Simples:** todas as avaliações têm o mesmo peso (funcionamento original da v1.0.0).
  - **Ponderado:** peso personalizável por avaliação, inclusive as que ainda estão pendentes.
- Média mínima de aprovação configurável entre **0 e 10** (padrão: **5,0**).
- Quantidade de avaliações de **1 a 12** (padrão: **4**).
- Lançamento individual das notas (deixe vazias as avaliações pendentes).
- Aceita vírgula ou ponto decimal em notas, média mínima e pesos.
- Cálculo automático da média necessária nas avaliações restantes, respeitando os pesos ativos.
- Indica **aprovação garantida**, **aluno aprovado**, **não aprovado** e **meta inalcançável**.
- Exibe média das notas lançadas, maior média final possível, avaliações restantes e progresso.
- No modo ponderado, mostra o total dos pesos e o peso ainda disponível nas avaliações pendentes.
- Tema claro/escuro, exemplo diferente para cada modo, e botão para limpar somente as notas (preservando configurações e pesos).
- Salvamento local automático em `localStorage` com migração dos dados da v1.0.0.

## Como calcular

As notas e a média mínima usam escala de **0 a 10**. O resultado para as avaliações pendentes indica a **média necessária entre elas**, não necessariamente a mesma nota para cada avaliação.

### Modo simples

```text
Média necessária nas avaliações restantes =
  (média mínima × total de avaliações − soma das notas lançadas)
  ÷ número de avaliações restantes
```

**Exemplo:** média mínima `5`, 4 avaliações, notas lançadas `6` e `4`:

```text
(5 × 4 − (6 + 4)) ÷ 2 = 5,00
```

A média necessária nas duas avaliações restantes é `5,00`.

### Modo ponderado

Cada avaliação recebe um **peso maior que zero e até 1000**; pesos decimais também são aceitos. Os pesos são relativos: **não precisam somar 100**. Exemplos válidos: `1, 2, 3` ou `20, 30, 50`.

A média final ponderada é:

```text
Média final =
  soma(nota de cada avaliação × seu peso)
  ÷ soma dos pesos de todas as avaliações
```

Para calcular a **média ponderada necessária nas avaliações ainda pendentes**, usamos:

```text
Média necessária nas pendentes =
  (média mínima × soma de todos os pesos
     − soma(notas já lançadas × respectivos pesos))
  ÷ soma dos pesos das avaliações pendentes
```

**Exemplo:** média mínima `6,0`, quatro avaliações:

| Avaliação | Nota | Peso |
| --- | ---: | ---: |
| 1 | 8,0 | 1 |
| 2 | 4,0 | 3 |
| 3 | Pendente | 2 |
| 4 | Pendente | 4 |

```text
Total de pesos: 1 + 3 + 2 + 4 = 10
Pontos já adquiridos: 8 × 1 + 4 × 3 = 20
Pontos necessários: 6 × 10 = 60
Peso pendente: 2 + 4 = 6
Média ponderada necessária nas pendentes: (60 − 20) / 6 = 6,666...
Resultado exibido: 6,67
```

As notas podem variar entre as avaliações pendentes: basta que sua média ponderada seja de pelo menos `6,666...`.

> O programa arredonda **para cima** a média necessária exibida, em duas casas decimais, para não sugerir uma nota ligeiramente insuficiente. Para determinar aprovação/reprovação, usa a média real, sem arredondá-la.

### Interpretação dos resultados

- **Aprovação garantida:** o aluno já possui pontuação suficiente, mesmo que obtenha zero nas avaliações restantes.
- **Meta inalcançável:** mesmo que o aluno tire 10 em todas as avaliações restantes, não conseguirá a média mínima.
- **Média final:** é mostrada assim que todas as notas forem lançadas.
- **Peso inválido:** pesos em branco, zero, negativos, não numéricos ou acima de 1000 bloqueiam o cálculo **no modo ponderado**, mas não afetam o modo simples.

## Publicar no GitHub Pages

### Primeira publicação

1. Crie um repositório no GitHub, por exemplo `media-certa`.
2. Coloque os arquivos `index.html`, `style.css`, `script.js` e `README.md` na **raiz** do repositório.
3. Abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione branch `main`, pasta `/(root)` e clique em **Save**.
6. Aguarde a publicação no endereço `https://SEU-USUARIO.github.io/media-certa/`.

Documentação oficial: https://docs.github.com/pt/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

### Atualizar o site da versão 1.0.0 para 1.1.0

1. Substitua os arquivos `index.html`, `style.css`, `script.js` e `README.md` no mesmo repositório.
2. Aguarde o GitHub Pages publicar a nova versão; recarregue a página caso o navegador exiba arquivos antigos.
3. Ao abrir a nova versão **no mesmo navegador**, ela importa automaticamente as notas, a média mínima e o tema da v1.0.0. O modo inicial será **Simples**, com peso `1` em todas as avaliações.

## Executar localmente

Abra `index.html` em um navegador moderno. Não é preciso instalar dependências nem executar servidor.

## Privacidade

Os dados não são enviados a nenhum servidor. São armazenados no `localStorage` do navegador que acessa o aplicativo. Outros dispositivos ou perfis de navegador não compartilham automaticamente essas informações. Limpar os dados do site pode apagá-las.

## Limitações e regras não incluídas

O app **não** incorpora recuperação paralela/final, substituição de avaliações, regras institucionais de arredondamento, frequências ou notas extracurriculares. Sua escola pode usar critérios distintos; nesses casos, as regras precisam ser implementadas separadamente.

## Arquivos

```text
media-certa/
├── index.html   # Interface com seletor de modo e campos de peso
├── style.css    # Estilos responsivos e temas
├── script.js    # Cálculos simples/ponderados, validação e salvamento
└── README.md    # Manual, exemplos e publicação
```

## Novidades da v1.1.0

- Adicionado o modo ponderado com pesos individuais configuráveis.
- Acrescentado total de pesos e peso pendente no resumo.
- Adicionado exemplo específico para o modo ponderado.
- Mantidas as notas ao alternar de modo, com persistência dos pesos personalizados.
- Migração automática dos dados da versão anterior.
- Ajuste da validação da média mínima vazia, evitando interpretá-la como zero.
