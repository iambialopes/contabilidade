# Atualização concluída — Ihara e páginas por departamento

A atualização foi implementada e validada. O sistema agora usa o nome **Ihara** no cabeçalho e perfil, possui navegação por URL para `/fiscal`, `/pessoal`, `/contabil` e `/societario`, e cada departamento apresenta seu próprio checklist, status, prazos e contexto do cliente selecionado.

| Área | Interface individual | Rotinas contempladas |
|---|---|---|
| Fiscal | `/fiscal` | Importação das notas, apuração na Domínio, PGDAS, envio da guia, Sintegra, DSTDA, livro eletrônico, EFD Reinf fiscal e DEFIS anual. |
| Pessoal | `/pessoal` | Conferências, cálculo da folha, eSocial, DCTFWeb, recibos e guias, admissões, férias, rescisões, atestados, procedimentos, distribuição de lucros e EFD Reinf folha. |
| Contábil | `/contabil` | Solicitação de movimentação, importação de extratos, distribuição de lucros e fechamento do balancete. |
| Societário | `/societario` | Cadastro das empresas, procurações, vínculos SAT/CRC, abertura de CNPJ, baixa e alteração. |

A checagem TypeScript, o build de produção e a revisão visual das cinco páginas foram concluídos.
