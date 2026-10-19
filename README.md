# Média Certa — Calculadora de Aprovação
Aplicação disponível em:
https://mestreudk.github.io/Media-Certa/

Aplicação 100% estática para calcular quanto um aluno precisa tirar nas avaliações restantes para alcançar uma média mínima. Funciona em celular e computador, sem cadastro, sem banco de dados e sem dependências externas.

## Funcionalidades

- Média mínima configurável de **0 a 10** (padrão: **5,0**).
- Quantidade de avaliações ajustável de **1 a 12** (padrão: **4**).
- Inserção de notas individualmente, deixando vazias as avaliações ainda não realizadas.
- Aceita notas com **vírgula** ou **ponto** decimal.
- Cálculo automático da **média necessária nas avaliações restantes**.
- Indicação de **aprovação garantida**, **aprovação alcançada**, **não aprovação** ou **meta inalcançável**.
- Exibe a média das notas preenchidas, a maior média final possível e o progresso.
- Tema escuro/claro, botão de exemplo, limpeza de notas com confirmação.
- Salvamento local automático usando `localStorage` (os dados ficam no próprio dispositivo/navegador).

## Como funciona o cálculo

As avaliações têm **pesos iguais**, a escala é de **0 a 10** e a média final é a média aritmética simples.

```text
Média necessária nas restantes =
  (Média mínima × Quantidade total − Soma das notas já lançadas)
  ÷ Quantidade de avaliações restantes
```

A média necessária é **arredondada para cima em duas casas decimais** para evitar apresentar uma nota ligeiramente insuficiente.

**Exemplo:** média mínima `5`, quatro avaliações no total, duas notas lançadas (`6` e `4`):

```text
(5 × 4 − (6 + 4)) ÷ 2 = 5
```

O aluno precisa de média `5,00` nas duas próximas avaliações.

**Outros cenários:**

- Se a soma das notas já obtidas alcançou o total de pontos necessário, a aprovação está garantida mesmo com zero nas restantes.
- Se nem notas `10` em todas as avaliações restantes alcançariam a média exigida, a meta é sinalizada como inalcançável.
- Depois de inserir todas as notas, é exibida a média final e o resultado.

> **Atenção:** o app não aplica arredondamento da **média final** para decisão de aprovação. O resultado é comparado matematicamente com a média mínima informada. Caso sua escola utilize pesos diferentes, avaliações substitutivas, recuperação, arredondamento institucional ou outras regras, será necessário adaptar o código.

## Publicar gratuitamente no GitHub Pages

1. Crie um repositório no GitHub, por exemplo, `media-certa`.
2. Envie os arquivos `index.html`, `style.css`, `script.js` e este `README.md` **para a raiz do repositório**. Não envie a pasta externa como um único diretório.
3. Acesse **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Selecione o branch **main** e a pasta **/(root)**; clique em **Save**.
6. O GitHub disponibilizará o site em um endereço no formato `https://SEU-USUARIO.github.io/media-certa/`.

Documentação oficial: https://docs.github.com/pt/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Executar localmente

Basta abrir `index.html` em um navegador moderno. Não é preciso instalar dependências nem rodar servidor.

## Privacidade

O código do site é público quando publicado num repositório público, mas **as notas digitadas não são enviadas ao repositório nem a servidores**. Elas são guardadas no `localStorage` do navegador do dispositivo. Quem usa o mesmo perfil do navegador pode visualizar essas notas; ao limpar os dados do site, elas podem ser perdidas.

## Estrutura

```text
media-certa/
├── index.html   # Estrutura da interface
├── style.css    # Design responsivo e temas
├── script.js    # Cálculos, validação e salvamento local
└── README.md    # Instruções
```
