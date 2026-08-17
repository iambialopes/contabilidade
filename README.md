# Corrêa Controle Interno

Interface standalone do sistema de controle interno da Corrêa Assessoria Contábil e Financeira.

A aplicação usa somente **HTML, CSS e JavaScript puro**. Não é necessário instalar React, Vite, Tailwind, Node.js ou qualquer dependência para abrir a interface.

## Como abrir

Baixe ou clone o repositório e abra o arquivo `index.html` diretamente no navegador:

```bash
git clone https://github.com/iambialopes/contabilidade.git
cd contabilidade
```

Também é possível abrir a pasta no VS Code e editar os arquivos normalmente.

## Estrutura do projeto

| Pasta/arquivo | Responsabilidade |
|---|---|
| `index.html` | Estrutura semântica da aplicação e pontos de montagem. |
| `css/variables.css` | Cores, espaçamentos, raios e tokens da marca. |
| `css/base.css` | Reset, tipografia e estilos globais. |
| `css/layout.css` | Sidebar, cabeçalho e estrutura principal. |
| `css/components.css` | Cards, tabela, rotinas, modal e componentes. |
| `css/responsive.css` | Ajustes para tablet, celular e acessibilidade de movimento. |
| `js/app.js` | Entrada da aplicação. |
| `js/data.js` | Clientes, departamentos e rotinas editáveis. |
| `js/state.js` | Estado da navegação, filtro e cliente selecionado. |
| `js/templates.js` | Templates HTML de cada seção. |
| `js/ui.js` | Renderização, eventos, busca, filtro e modal. |
| `assets/logo.png` | Logo local da Corrêa. |

## Onde editar

Para alterar clientes, departamentos e tarefas, edite `js/data.js`. Para alterar textos e a estrutura visual, edite `js/templates.js` e `index.html`. Para mudar cores ou espaçamentos gerais, use `css/variables.css`; para modificar componentes específicos, use `css/components.css`.

A versão atual utiliza dados demonstrativos no JavaScript. A persistência de clientes e tarefas em banco de dados poderá ser adicionada posteriormente.
