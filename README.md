# Corrêa Controle Interno

Esta é a versão simples do sistema de controle interno da Corrêa Assessoria Contábil e Financeira.

## Como usar

Não é necessário instalar React, Node.js, Vite, Tailwind ou qualquer dependência para visualizar a interface. Baixe ou clone o repositório e abra o arquivo `index.html` diretamente no navegador.

```bash
git clone https://github.com/iambialopes/contabilidade.git
cd contabilidade
```

Depois, abra `index.html` pelo explorador de arquivos ou pelo VS Code com a extensão Live Server, caso queira usar um servidor local opcional.

## Arquivos principais

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da aplicação e pontos de montagem. |
| `style.css` | Identidade visual, layout, responsividade e componentes. |
| `script.js` | Navegação, clientes, filtros, seleção, modal e rotinas departamentais. |
| `assets/logo.png` | Logo local da Corrêa. |

## Páginas disponíveis

A navegação lateral abre a visão geral e as páginas específicas de Fiscal, Pessoal, Contábil e Societário. As rotinas de cada departamento estão configuradas no objeto `modules` do arquivo `script.js`, de modo que sejam fáceis de editar.

Esta versão usa dados demonstrativos no próprio JavaScript. Para salvar clientes e tarefas permanentemente, será necessário adicionar uma API ou banco de dados em uma etapa posterior.
