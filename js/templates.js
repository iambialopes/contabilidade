/* Corrêa Controle Interno — Templates HTML da interface. */

function renderNavigation(departments, currentPage) {
  return departments.map((department) => `
    <button class="${currentPage === department.key ? 'active' : ''}" data-page="${department.key}">
      <span class="nav-icon">${department.icon}</span>
      <span class="nav-copy">
        <strong>${department.label}</strong>
        <small>${department.detail}</small>
      </span>
      ${currentPage === department.key ? '<i class="active-mark"></i>' : ''}
    </button>
  `).join('');
}

function renderOverview({ clientsHtml, lowerHtml, activeCount, totalCount, selectedMonth, selectedYear, months, canDeleteSelectedMonth }) {
  return `
    <section class="paper-card">
      <div class="hero-copy">
        <p class="eyebrow">Visão do escritório</p>
        <h2>O trabalho de hoje,<br><span>organizado por cliente.</span></h2>
        <p>Centralize as rotinas dos quatro departamentos e encontre rapidamente o próximo passo de cada empresa.</p>
        <button class="primary-button" data-action="new-client">＋ Cadastrar cliente</button>
      </div>
    </section>

    <section class="month-context-bar">
      <div><p class="eyebrow">Competência em análise</p><strong>${selectedMonth}</strong></div>
      <div class="month-context-actions">
        ${competenceSelectors(selectedMonth, selectedYear, months)}
        <button class="secondary-button month-new-button" type="button" data-action="new-competence">＋ Nova competência</button>
        ${canDeleteSelectedMonth ? '<button class="secondary-button month-delete-button" type="button" data-action="delete-competence">Excluir competência</button>' : ''}
      </div>
    </section>

    <section class="summary-grid">
      ${summaryCard('▥', 'Empresas ativas', String(activeCount), `de ${totalCount} cadastradas`)}
      ${summaryCard('☑', 'Rotinas em dia', '86%', '+8% este mês')}
      ${summaryCard('!', 'Pontos de atenção', '07', '2 vencem hoje')}
      ${summaryCard('▦', 'Próximo fechamento', '28 AGO', 'Folha mensal')}
    </section>

    ${clientsHtml}
    ${lowerHtml}
  `;
}

function summaryCard(icon, label, value, detail) {
  return `
    <div class="summary-card">
      <div class="summary-icon">${icon}</div>
      <label>${label}</label>
      <div class="summary-value">${value} <small>${detail}</small></div>
    </div>
  `;
}

function renderClientsSection(rowsHtml, filters, clients, isExpanded = false) {
  return `
    <section class="client-list-section${isExpanded ? ' is-expanded' : ''}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Base de clientes</p>
          <h2>Empresas acompanhadas</h2>
        </div>
        <div class="section-heading-actions">
          <button class="text-button client-expand-button" type="button" data-action="toggle-client-list" aria-pressed="${isExpanded}">${isExpanded ? '⤢ Recolher lista' : '⛶ Expandir lista'}</button>
          <button class="text-button" data-action="new-client">＋ Adicionar cliente</button>
        </div>
      </div>

      <div class="client-table">
        <div class="table-tools">
          <div class="search-wrap">
            <span>⌕</span>
            <input id="client-search" placeholder="Buscar por empresa, CNPJ ou cidade">
          </div>
          <div class="table-tool-actions">
            <button id="export-clients-pdf" class="filter-button export-button" type="button">⇩ Exportar PDF</button>
            <button id="clear-client-filters" class="filter-button all" type="button">Limpar filtros</button>
          </div>
        </div>
        <div class="filter-grid" aria-label="Filtros de clientes">
          ${clientFilterSelect('city', 'Cidade', filters.city, clients.map((client) => client.city))}
          ${clientFilterSelect('activity', 'Atividade', filters.activity, clients.map((client) => client.activity))}
          ${clientFilterSelect('tax', 'Tributação', filters.tax, clients.map((client) => client.tax))}
          ${clientFilterSelect('payroll', 'Folha', filters.payroll, clients.map((client) => client.payroll))}
          ${clientFilterSelect('fiscalClosing', 'Fechamento fiscal', filters.fiscalClosing, clients.map((client) => client.fiscalClosing))}
          ${clientFilterSelect('status', 'Status', filters.status, ['Ativo', 'Inativo'])}
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente</th><th>CNPJ</th><th>Cidade</th><th>Tributação</th>
                <th>Atividade</th><th>Folha</th><th>Fechamento fiscal</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody id="client-rows">${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function getPrintColumns() {
  return [
    ['Razão social', 'name'], ['CNPJ ou CPF', 'cnpj'], ['Município', 'city'], ['Resp. contábil', 'accountingResponsible'],
    ['Tributação', 'tax'], ['Atividade', 'activity'], ['Informações folha', 'payrollInfo'], ['Fechamento fiscal', 'fiscalClosing'],
    ['Sintegra', 'sintegra'], ['DSTDA', 'dstda'], ['Folha de pagamento', 'payrollStatus'], ['Balancete contábil', 'balance'],
    ['EFD Reinf', 'efdReinf'], ['Status', 'active']
  ];
}

function renderExportOptions() {
  return `
    <div class="modal-backdrop" id="export-options-backdrop">
      <div class="modal export-options-modal" role="dialog" aria-modal="true" aria-labelledby="export-options-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Personalizar relatório</p>
            <h2 id="export-options-title">Escolha as colunas</h2>
            <p class="modal-description">Desmarque as informações que não deseja incluir no PDF. Os filtros atuais serão mantidos.</p>
          </div>
          <button class="close" id="close-export-options" aria-label="Fechar">×</button>
        </div>
        <div class="export-columns-grid">
          ${getPrintColumns().map(([label, key]) => `<label class="export-column-option"><input type="checkbox" name="export-column" value="${key}" checked><span>${label}</span></label>`).join('')}
        </div>
        <div class="export-options-actions">
          <button class="secondary-button" id="select-all-export-columns" type="button">Selecionar todas</button>
          <div><button class="secondary-button" id="cancel-export-options" type="button">Cancelar</button><button class="primary-button" id="confirm-export-pdf" type="button">Gerar PDF</button></div>
        </div>
      </div>
    </div>
  `;
}

function renderPrintReport(clients, filters, searchTerm = '', selectedKeys = null) {
  const filterLabels = [
    ['Busca', searchTerm || 'Todas'],
    ['Cidade', filters.city || 'Todas'],
    ['Atividade', filters.activity || 'Todas'],
    ['Tributação', filters.tax || 'Todas'],
    ['Folha', filters.payroll || 'Todas'],
    ['Fechamento fiscal', filters.fiscalClosing || 'Todos'],
    ['Status', filters.status === 'active' ? 'Ativos' : filters.status === 'inactive' ? 'Inativos' : 'Todos']
  ];
  const columns = getPrintColumns().filter(([, key]) => !selectedKeys || selectedKeys.includes(key));

  return `
    <article class="print-report">
      <header class="print-report-header">
        <div><p class="eyebrow">Corrêa Controle Interno</p><h1>Relatório de empresas</h1><p>Informações cadastrais e acompanhamento da planilha AGOSTO 26.</p></div>
        <div class="print-report-date">Emitido em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</div>
      </header>
      <section class="print-filters"><strong>Filtros aplicados</strong>${filterLabels.map(([label, value]) => `<span><b>${label}:</b> ${escapeHtml(value)}</span>`).join('')}</section>
      <p class="print-report-count">${clients.length} empresa${clients.length === 1 ? '' : 's'} encontrada${clients.length === 1 ? '' : 's'}</p>
      <table><thead><tr>${columns.map(([label]) => `<th>${label}</th>`).join('')}</tr></thead><tbody>
        ${clients.map((client) => `<tr>${columns.map(([, key]) => `<td>${escapeHtml(key === 'active' ? (client.active ? 'Ativo' : 'Inativo') : client[key] || 'Não informado')}</td>`).join('')}</tr>`).join('')}
      </tbody></table>
    </article>
  `;
}

function getCompetenceYear(label) {
  const yearToken = String(label || '').trim().split(/\s+/).pop();
  const year = Number(yearToken);
  return yearToken.length === 2 ? 2000 + year : year;
}

function competenceSelectors(selectedMonth, selectedYear, months, prefix = 'overview') {
  const sortedMonths = [...months].sort((a, b) => monthSortValue(a) - monthSortValue(b));
  const years = [...new Set(sortedMonths.map(getCompetenceYear).filter(Boolean))].sort((a, b) => a - b);
  const activeYear = Number(selectedYear) || getCompetenceYear(selectedMonth) || years[years.length - 1];
  const monthsForYear = sortedMonths.filter((month) => getCompetenceYear(month) === activeYear);
  const yearOptions = years.map((year) => `<option value="${year}" ${year === activeYear ? 'selected' : ''}>${year}</option>`).join('');
  const monthOptions = monthsForYear.map((month) => `<option value="${month}" ${month === selectedMonth ? 'selected' : ''}>${month}</option>`).join('');
  return `<div class="competence-selectors ${prefix === 'fiscal' ? 'fiscal-competence-selectors' : ''}"><label class="month-select-field"><span>Ano</span><select id="${prefix}-year-select" aria-label="Selecionar ano da ${prefix === 'fiscal' ? 'competência Fiscal' : 'Visão geral'}">${yearOptions}</select></label><label class="month-select-field"><span>Mês</span><select id="${prefix}-month-select" aria-label="Selecionar mês da ${prefix === 'fiscal' ? 'competência Fiscal' : 'Visão geral'}">${monthOptions}</select></label></div>`;
}

function renderDeleteCompetenceConfirmation(month) {
  return `
    <div class="modal-backdrop" id="delete-competence-backdrop">
      <div class="modal delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-competence-title">
        <div class="delete-icon" aria-hidden="true">!</div>
        <div class="delete-copy">
          <p class="eyebrow">Confirmação necessária</p>
          <h2 id="delete-competence-title">Excluir competência?</h2>
          <p>Você está prestes a excluir a competência criada abaixo:</p>
          <div class="delete-client-card"><strong>${escapeHtml(month)}</strong><span>Os dados revisados deste mês serão removidos deste navegador.</span></div>
          <p class="delete-warning"><strong>Atenção:</strong> as competências importadas da planilha não podem ser excluídas.</p>
        </div>
        <div class="modal-actions delete-actions">
          <button class="secondary-button" id="cancel-delete-competence" type="button">Cancelar</button>
          <button class="delete-confirm-button" id="confirm-delete-competence" type="button">Excluir competência</button>
        </div>
      </div>
    </div>
  `;
}

function reviewSelect(index, field, value, options) {
  return `<select class="competence-review-select" data-review-index="${index}" data-review-field="${field}" aria-label="Alterar ${field}">${options.map((option) => `<option value="${option}" ${String(option) === String(value) ? 'selected' : ''}>${option || 'Não informado'}</option>`).join('')}</select>`;
}

function renderNewCompetenceModal({ sourceMonth, targetMonth, clients }) {
  const safeSourceMonth = escapeHtml(sourceMonth);
  const safeTargetMonth = escapeHtml(targetMonth);
  return `
    <div class="modal-backdrop" id="competence-modal-backdrop">
      <div class="modal competence-modal" role="dialog" aria-modal="true" aria-labelledby="competence-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Nova competência</p>
            <h2 id="competence-title">Preparar nova competência</h2>
            <p class="modal-description">A situação de ${safeSourceMonth} foi copiada para conferência. Revise a carteira e faça as alterações necessárias antes de criar o próximo mês.</p>
          </div>
          <button class="close" id="close-competence-modal" aria-label="Fechar">×</button>
        </div>
        <div class="competence-target-field"><label for="competence-target-month">Nome da nova competência</label><input id="competence-target-month" value="${safeTargetMonth}" placeholder="Ex.: OUTUBRO 26" autocomplete="off"><span>O mês será criado somente depois da confirmação.</span></div>
        <div class="competence-review-note"><strong>${clients.length} clientes serão levados para a nova competência.</strong><span>Revise as situações abaixo; as alterações só serão salvas ao confirmar a nova competência.</span></div>
        <div class="competence-review-toolbar"><p class="form-section-label">Conferência</p><button class="text-button" id="competence-add-client" type="button">＋ Adicionar cliente</button></div>
        <div class="competence-table-scroll">
          <table class="competence-table">
            <thead><tr><th>Cliente</th><th>CNPJ ou CPF</th><th>Tributação</th><th>Atividade</th><th>Informações folha</th><th>Fechamento fiscal</th><th>Sintegra</th><th>DSTDA</th><th>Folha pagamento</th><th>Balancete</th><th>EFD Reinf</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              ${clients.length ? clients.map((client, index) => `
                <tr data-competence-row="${index}">
                  <td><strong>${escapeHtml(client.name)}</strong></td>
                  <td>${escapeHtml(client.cnpj)}</td>
                  <td>${reviewSelect(index, 'tax', client.tax, ['MEI', 'PF', 'PRESUMIDO', 'SIMPLES NACIONAL', 'SN COM FATOR R'])}</td>
                  <td>${reviewSelect(index, 'activity', client.activity, ['ASSOCIAÇÃO', 'COMERCIO', 'COMÉRCIO E SERVIÇO', 'CONDOMINIO', 'PESSOA FISICA', 'SERVIÇO'])}</td>
                  <td>${reviewSelect(index, 'payrollInfo', client.payrollInfo, ['FUNCIONÁRIOS', 'PRÓ-LABORE', 'PRÓ-LABORE E FUNCIONÁRIOS', 'SEM FOLHA'])}</td>
                  <td>${reviewSelect(index, 'fiscalClosing', client.fiscalClosing, ['EM ANÁLISE', 'ENVIADO', 'NÃO FEITO', 'SEM MOVIMENTO'])}</td>
                  <td>${reviewSelect(index, 'sintegra', client.sintegra, ['CLIENTE NOVO', 'DESOBRIGADO', 'ENVIAR', 'MEI - DESOBRIGADO', 'SIMPLES NACIONAL - SERVIÇO'])}</td>
                  <td>${reviewSelect(index, 'dstda', client.dstda, ['CLIENTE NOVO', 'DESOBRIGADO', 'MEI - DESOBRIGADO', 'SIMPLES NACIONAL - SERVIÇO', 'VERIFICAR OBRIGATORIEDADE'])}</td>
                  <td>${reviewSelect(index, 'payrollStatus', client.payrollStatus, ['ENVIADO - DCTFWEB', 'ENVIADO- FUNCIONARIOS', 'ENVIADO- PRO LABORE', 'NÃO FEITO', 'SEM FOLHA'])}</td>
                  <td>${reviewSelect(index, 'balance', client.balance, ['NÃO FEITO MEI', 'NÃO FEITO PRESUMIDO', 'NÃO FEITO SN', 'SEM ESCRITURAÇÃO', 'SEM MOVIMENTO'])}</td>
                  <td>${reviewSelect(index, 'efdReinf', client.efdReinf, ['DISPENSA', 'VERIFICAR CONTÁBIL - DISTRIBUIÇÃO'])}</td>
                  <td>${reviewSelect(index, 'active', client.active ? 'ATIVO' : 'INATIVO', ['ATIVO', 'INATIVO'])}</td>
                  <td><button class="delete-client competence-remove-client" type="button" data-competence-remove="${index}" title="Remover ${escapeHtml(client.name)}" aria-label="Remover ${escapeHtml(client.name)}">×</button></td>
                </tr>
              `).join('') : '<tr><td colspan="13" class="competence-empty">Nenhum cliente será levado para esta competência.</td></tr>'}
            </tbody>
          </table>
        </div>
        <p class="form-error" id="competence-error" role="alert"></p>
        <div class="modal-actions">
          <button class="secondary-button" id="cancel-competence-modal" type="button">Cancelar</button>
          <button class="primary-button" id="confirm-competence-modal" type="button">Criar competência</button>
        </div>
      </div>
    </div>
  `;
}

function clientFilterSelect(field, label, selectedValue, values) {
  const uniqueValues = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const options = field === 'status'
    ? [['', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos']]
    : [['', 'Todos'], ...uniqueValues.map((value) => [value, value])];

  return `
    <label class="filter-field">
      <span>${label}</span>
      <select class="client-filter" data-filter="${field}" aria-label="Filtrar por ${label.toLowerCase()}">
        ${options.map(([value, text]) => `<option value="${value}" ${selectedValue === value ? 'selected' : ''}>${text}</option>`).join('')}
      </select>
    </label>
  `;
}

function renderClientRows(clients, selectedClientCnpj) {
  if (!clients.length) {
    return '<tr><td colspan="10" style="text-align:center;padding:30px">Nenhum cliente encontrado.</td></tr>';
  }

  return clients.map((client) => `
    <tr class="${selectedClientCnpj === client.cnpj ? 'selected' : ''}" data-client="${client.cnpj}">
      <td><div class="client-name"><span class="initials ${client.tone}">${client.initials}</span>${client.name}</div></td>
      <td>${client.cnpj}</td>
      <td>${client.city}</td>
      <td><span class="tag">${client.tax}</span></td>
      <td>${client.activity}</td>
      <td>${client.payroll}</td>
      <td><span class="fiscal-closing-value">${client.fiscalClosing || 'Não informado'}</span></td>
      <td><span class="status ${client.active ? '' : 'inactive'}"><i></i>${client.active ? 'Ativo' : 'Inativo'}</span></td>
      <td class="client-actions"><button class="client-sheet-button" type="button" data-client-open="${client.cnpj}" title="Abrir ficha de ${client.name}">Ficha ↗</button><button class="delete-client" type="button" data-client-delete="${client.cnpj}" title="Excluir ${client.name}" aria-label="Excluir ${client.name}">×</button></td>
    </tr>
  `).join('');
}

function renderLowerPanels(selectedClient) {
  const departmentSummary = [
    { key: 'fiscal', label: 'Fiscal', eyebrow: 'Obrigações e guias', value: selectedClient.fiscalClosing || 'Acompanhar fechamento', detail: `Sintegra: ${selectedClient.sintegra || 'Não informado'}`, accent: 'peach' },
    { key: 'pessoal', label: 'Pessoal', eyebrow: 'Folha e eventos', value: selectedClient.payrollInfo || 'Sem informação de folha', detail: `Folha: ${selectedClient.payrollStatus || 'Não informado'}`, accent: 'blue' },
    { key: 'contabil', label: 'Contábil', eyebrow: 'Movimentação e balancete', value: selectedClient.balance || 'Acompanhar balancete', detail: 'Movimentação e fechamento contábil', accent: 'sand' },
    { key: 'societario', label: 'Societário', eyebrow: 'Processos e procurações', value: 'Cadastro e processos', detail: 'Procurações, vínculos e alterações', accent: 'olive' }
  ];
  return `
    <section class="client-dashboard client-summary-dashboard">
      <div class="client-dashboard-head">
        <div>
          <p class="eyebrow">Resumo do cliente</p>
          <h3>${selectedClient.name}</h3>
          <p>${selectedClient.city} · ${selectedClient.tax} · ${selectedClient.activity} · ${selectedClient.active ? 'Cliente ativo' : 'Cliente inativo'}</p>
        </div>
        <button class="secondary-button" data-action="open-sheet">Abrir ficha ↗</button>
      </div>

      <div class="client-summary-meta">
        <div><span>CNPJ ou CPF</span><strong>${selectedClient.cnpj}</strong></div>
        <div><span>Responsável contábil</span><strong>${selectedClient.accountingResponsible || 'Não informado'}</strong></div>
        <div><span>Fechamento fiscal</span><strong>${selectedClient.fiscalClosing || 'Não informado'}</strong></div>
        <div><span>Folha</span><strong>${selectedClient.payroll || 'Não informado'}</strong></div>
      </div>

      <div class="dashboard-sector-grid summary-sector-grid">
        ${departmentSummary.map((department) => `
          <article class="dashboard-sector-card summary-sector-card ${department.accent}">
            <div class="dashboard-sector-heading"><div><p class="eyebrow">${department.eyebrow}</p><h4>${department.label}</h4></div><button type="button" class="summary-sector-mark" data-page="${department.key}" aria-label="Abrir setor ${department.label}">↗</button></div>
            <strong class="summary-sector-value">${department.value}</strong>
            <p class="dashboard-sector-meta">${department.detail}</p>
            <button class="department-summary-link" data-page="${department.key}">Abrir setor</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderFiscalDashboard({ clients, selectedClient, selectedMonth, months, fiscalRows, filteredRows, filters, summary, deadlines, history }) {
  const statusOptions = ['Concluído', 'Pendente', 'Em análise', 'Aguardando', 'Não se aplica', 'Desobrigado'];
  const statusClass = (value) => String(value || '').toLowerCase().replaceAll(' ', '-').replaceAll('ã', 'a').replaceAll('á', 'a');
  const selectStatus = (row, field) => `<select class="fiscal-status-select fiscal-status-${statusClass(row[field])}" data-fiscal-status="${field}" data-fiscal-client="${row.cnpj}" aria-label="${field} de ${row.name}">${statusOptions.map((option) => `<option ${row[field] === option ? 'selected' : ''}>${option}</option>`).join('')}</select>`;
  const focusRow = fiscalRows.find((row) => row.cnpj === selectedClient?.cnpj) || fiscalRows[0];
  const focusItems = [['notas', 'Notas'], ['apuracao', 'Apuração'], ['pgdas', 'PGDAS'], ['guia', 'Guia'], ['sintegra', 'Sintegra'], ['dstda', 'DSTDA'], ['livroEletronico', 'Livro eletrônico'], ['efdReinf', 'EFD Reinf']];
  return `
    <div class="fiscal-dashboard-shell">
    <section class="fiscal-zone fiscal-focus-zone" aria-labelledby="fiscal-focus-zone-title">
      <div class="fiscal-zone-heading"><div><p class="eyebrow">Acompanhamento individual</p><h3 id="fiscal-focus-zone-title">Cliente em foco</h3></div><span>1 empresa selecionada</span></div>
    <section class="fiscal-hero">
      <div class="fiscal-hero-copy"><p class="eyebrow">Controle fiscal da competência</p><h2>Fiscal · ${selectedMonth}</h2><p>Acompanhe as obrigações de cada empresa, identifique pendências e registre o andamento do período.</p></div>
      <div class="fiscal-hero-controls"><div class="fiscal-hero-competence"><span>Competência desta tela</span>${competenceSelectors(selectedMonth, getCompetenceYear(selectedMonth), months, 'fiscal')}</div><div class="fiscal-hero-client"><span>Cliente em foco desta tela</span><select id="fiscal-focus-client" aria-label="Selecionar cliente em foco">${[...clients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((client) => `<option value="${client.cnpj}" ${client.cnpj === selectedClient?.cnpj ? 'selected' : ''}>${client.name}</option>`).join('')}</select><small>${selectedClient?.cnpj || ''} · ${selectedClient?.city || ''}</small></div></div>
    </section>
    <section class="fiscal-focus-panel panel">
      <div class="section-heading fiscal-focus-heading"><div><p class="eyebrow">Acompanhamento do cliente</p><h3>${focusRow?.name || 'Nenhum cliente selecionado'}</h3><small>${focusRow?.cnpj || ''} · ${focusRow?.city || ''} · ${focusRow?.tax || ''}</small></div><span class="fiscal-overall fiscal-overall-${statusClass(focusRow?.overall)}">${focusRow?.overall || 'Aguardando'}</span></div>
      <div class="fiscal-focus-grid">${focusItems.map(([key, label]) => `<div class="fiscal-focus-item"><span>${label}</span><strong class="fiscal-focus-status-${statusClass(focusRow?.[key])}">${focusRow?.[key] || 'Aguardando'}</strong></div>`).join('')}</div>
    </section>
    </section>
    <section class="fiscal-zone fiscal-overview-zone" aria-labelledby="fiscal-overview-zone-title">
      <div class="fiscal-zone-heading"><div><p class="eyebrow">Painel do departamento</p><h3 id="fiscal-overview-zone-title">Visão geral do fiscal</h3></div><span>${selectedMonth} · ${fiscalRows.length} clientes acompanhados</span></div>
    <section class="fiscal-summary-grid">
      ${summaryCard('✓', 'Clientes em dia', String(summary.done), `de ${summary.total} acompanhados`)}
      ${summaryCard('!', 'Pontos de atenção', String(summary.attention), 'pendências ou análise')}
      ${summaryCard('↗', 'Obrigações concluídas', String(summary.completedObligations), `de ${summary.totalObligations} lançamentos`)}
      ${summaryCard('◷', 'Próximo vencimento', deadlines[0]?.due || 'Sem prazo', deadlines[0]?.name || 'competência atual')}
    </section>
    <section class="fiscal-toolbar panel">
      <div><p class="eyebrow">Filtrar controle</p><h3>Obrigações do período</h3></div>
      <div class="fiscal-filters">
        <input id="fiscal-search" type="search" placeholder="Buscar empresa" value="${filters.search || ''}">
        <select data-fiscal-filter="status"><option value="">Todas as situações</option><option ${filters.status === 'Pendente' ? 'selected' : ''}>Pendente</option><option ${filters.status === 'Em análise' ? 'selected' : ''}>Em análise</option><option ${filters.status === 'Concluído' ? 'selected' : ''}>Concluído</option><option ${filters.status === 'Aguardando' ? 'selected' : ''}>Aguardando</option></select>
        <select data-fiscal-filter="tax"><option value="">Todas as tributações</option>${[...new Set(clients.map((client) => client.tax).filter(Boolean))].sort().map((tax) => `<option ${filters.tax === tax ? 'selected' : ''}>${tax}</option>`).join('')}</select>
        <select data-fiscal-filter="city"><option value="">Todas as cidades</option>${[...new Set(clients.map((client) => client.city).filter(Boolean))].sort().map((city) => `<option ${filters.city === city ? 'selected' : ''}>${city}</option>`).join('')}</select>
        <select data-fiscal-filter="obligation"><option value="">Todas as obrigações</option>${['notas', 'apuracao', 'pgdas', 'guia', 'sintegra', 'dstda', 'livroEletronico', 'efdReinf'].map((key) => `<option value="${key}" ${filters.obligation === key ? 'selected' : ''}>${{ notas: 'Notas', apuracao: 'Apuração', pgdas: 'PGDAS', guia: 'Guia', sintegra: 'Sintegra', dstda: 'DSTDA', livroEletronico: 'Livro eletrônico', efdReinf: 'EFD Reinf' }[key]}</option>`).join('')}</select>
        <button class="text-button" data-action="clear-fiscal-filters">Limpar filtros</button><button class="filter-button export-button" data-action="export-fiscal-pdf" type="button">⇩ Exportar PDF</button>
      </div>
    </section>
    <div class="fiscal-lower-grid">
      <section class="panel fiscal-deadlines"><div class="section-heading"><div><p class="eyebrow">Agenda fiscal</p><h3>Próximos vencimentos</h3></div><button class="text-button" data-action="toast" data-message="A agenda de vencimentos será ampliada na próxima etapa.">＋ Adicionar prazo</button></div>${deadlines.map((item) => `<div class="fiscal-deadline-item"><div><strong>${item.name}</strong><small>${item.detail}</small></div><span>${item.due}</span></div>`).join('')}</section>
      <section class="panel fiscal-history"><div class="section-heading"><div><p class="eyebrow">Registro de alterações</p><h3>Histórico fiscal</h3></div></div>${history.length ? history.slice(0, 6).map((item) => `<div class="fiscal-history-item"><strong>${item.text}</strong><small>${item.date}</small></div>`).join('') : '<p class="fiscal-empty-copy">As alterações realizadas nesta competência aparecerão aqui.</p>'}</section>
    </div>
    <section class="fiscal-table-panel fiscal-table-panel-compact panel">
      <div class="section-heading fiscal-list-heading"><div><p class="eyebrow">Consulta completa</p><h3>Todos os clientes</h3></div><span>${filteredRows.length} exibidos</span></div>
      <div class="fiscal-table-scroll"><table class="fiscal-table"><thead><tr><th>Cliente</th><th>Tributação</th><th>Notas</th><th>Apuração</th><th>PGDAS</th><th>Guia</th><th>Sintegra</th><th>DSTDA</th><th>Livro eletrônico</th><th>EFD Reinf</th><th>Situação geral</th></tr></thead><tbody>${filteredRows.map((row) => `<tr><td><strong>${row.name}</strong><small>${row.cnpj} · ${row.city}</small></td><td>${row.tax}</td><td>${selectStatus(row, 'notas')}</td><td>${selectStatus(row, 'apuracao')}</td><td>${selectStatus(row, 'pgdas')}</td><td>${selectStatus(row, 'guia')}</td><td>${selectStatus(row, 'sintegra')}</td><td>${selectStatus(row, 'dstda')}</td><td>${selectStatus(row, 'livroEletronico')}</td><td>${selectStatus(row, 'efdReinf')}</td><td><span class="fiscal-overall fiscal-overall-${statusClass(row.overall)}">${row.overall}</span></td></tr>`).join('') || '<tr><td colspan="11" class="fiscal-empty">Nenhum cliente encontrado para os filtros selecionados.</td></tr>'}</tbody></table></div>
      <div class="fiscal-table-footer"><span>${filteredRows.length} clientes exibidos</span><span>Competência ${selectedMonth}</span></div>
    </section>
    </section>
    </div>`;
}

function renderDepartment({ department, moduleData, selectedClient, clients }) {
  const sortedClients = [...clients].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
  return `
    <section class="dept-hero">
      <p class="eyebrow">${moduleData.eyebrow}</p>
      <h2>Departamento ${department.label}</h2>
      <p>${moduleData.intro}</p>
    </section>

    <section class="client-context department-client-panel">
      <div class="department-client-panel-heading">
        <div>
          <p class="eyebrow">Cliente em foco</p>
          <h3>Selecione uma empresa</h3>
        </div>
        <span class="department-client-count">${sortedClients.length} clientes</span>
      </div>
      <label class="department-client-picker">
        <span>Pesquisar empresa</span>
        <input id="department-client-search" type="search" value="${selectedClient.name}" placeholder="Nome, CNPJ ou cidade" autocomplete="off" aria-label="Pesquisar cliente para ${department.label}">
      </label>
      <div class="department-client-results" id="department-client-results" role="listbox" aria-label="Resultados de clientes">
        ${sortedClients.map((client) => `<button type="button" class="department-client-result ${client.cnpj === selectedClient.cnpj ? 'selected' : ''}" data-department-client="${client.cnpj}" data-search-text="${`${client.name} ${client.cnpj} ${client.city}`.toLowerCase()}"><strong class="department-client-name">${client.name}</strong><span class="department-client-details"><small>${client.cnpj}</small><small>${client.city}</small></span></button>`).join('')}
      </div>
      <small class="department-client-metric">${moduleData.metric} ${moduleData.metricLabel}</small>
    </section>

    <div class="routine-heading">
      <div>
        <p class="eyebrow">Checklist do departamento</p>
        <h2>Rotinas e próximos prazos</h2>
      </div>
      <button class="primary-button" data-action="toast" data-message="A nova rotina será criada na próxima etapa.">＋ Nova rotina</button>
    </div>

    <section class="routine-grid">
      ${moduleData.tasks.map(([title, description, status, due, tone]) => `
        <button class="routine-card" data-action="toast" data-message="${title}: acompanhamento aberto para ${selectedClient.name}.">
          <div class="routine-top">
            <span class="routine-status ${tone}">${status}</span>
            <span class="due">${due}</span>
          </div>
          <h4>${title}</h4>
          <p>${description}</p>
          <div class="routine-footer"><span>${selectedClient.initials} · ${selectedClient.tax}</span><span>↗</span></div>
        </button>
      `).join('')}
    </section>
  `;
}

function renderModal(client = null) {
  const isEditing = Boolean(client);
  const modalEyebrow = isEditing ? 'Ficha existente' : 'Nova ficha';
  const modalTitle = isEditing ? 'Editar cliente' : 'Cadastrar cliente';
  const modalDescription = isEditing ? 'Atualize os dados da empresa e salve as alterações na ficha.' : 'Preencha os dados principais para incluir a empresa na sua carteira.';
  const current = client || {};
  const select = (id) => current[id] || '';

  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">${modalEyebrow}</p>
            <h2 id="modal-title">${modalTitle}</h2>
            <p class="modal-description">${modalDescription}</p>
          </div>
          <button class="close" id="close-modal" aria-label="Fechar">×</button>
        </div>
        <p class="form-section-label">Dados cadastrais</p>
        <div class="form-grid">
          ${formField('Razão social', 'Nome da empresa', true, 'client-name', current.name)}
          ${formField('CNPJ ou CPF', '00.000.000/0000-00', false, 'client-cnpj', current.cnpj, isEditing)}
          ${formSelectField('Município', 'client-city', ['BALNEARIO CAMBORIU', 'BLUMENAU', 'CRICIUMA', 'FLORIANOPOLIS', 'GAROPABA', 'IMBITUBA', 'LAGUNA', 'TUBARÃO'], select('city'))}
          ${formSelectField('Responsável contábil', 'client-accounting-responsible', ['ANA', 'GRACY', 'SEM CONTABILIDADE'], select('accountingResponsible'))}
          ${formSelectField('Tributação', 'client-tax', ['MEI', 'PF', 'PRESUMIDO', 'SIMPLES NACIONAL', 'SN COM FATOR R'], select('tax'))}
          ${formSelectField('Atividade', 'client-activity', ['ASSOCIAÇÃO', 'COMERCIO', 'COMÉRCIO E SERVIÇO', 'CONDOMINIO', 'PESSOA FISICA', 'SERVIÇO'], select('activity'))}
          ${formSelectField('Status', 'client-active', ['ATIVO', 'INATIVO'], current.active === false ? 'INATIVO' : 'ATIVO')}
        </div>

        <p class="form-section-label">Acompanhamento da planilha</p>
        <div class="form-grid">
          ${formSelectField('Informações folha', 'client-payroll-info', ['FUNCIONÁRIOS', 'PRÓ-LABORE', 'PRÓ-LABORE E FUNCIONÁRIOS', 'SEM FOLHA'], select('payrollInfo'))}
          ${formSelectField('Fechamento fiscal', 'client-fiscal-closing', ['EM ANÁLISE', 'ENVIADO', 'NÃO FEITO', 'SEM MOVIMENTO'], select('fiscalClosing'))}
          ${formSelectField('Sintegra', 'client-sintegra', ['CLIENTE NOVO', 'DESOBRIGADO', 'ENVIAR', 'MEI - DESOBRIGADO', 'SIMPLES NACIONAL - SERVIÇO'], select('sintegra'))}
          ${formSelectField('DSTDA', 'client-dstda', ['CLIENTE NOVO', 'DESOBRIGADO', 'MEI - DESOBRIGADO', 'SIMPLES NACIONAL - SERVIÇO', 'VERIFICAR OBRIGATORIEDADE'], select('dstda'))}
          ${formSelectField('Folha de pagamento', 'client-payroll-status', ['ENVIADO - DCTFWEB', 'ENVIADO- FUNCIONARIOS', 'ENVIADO- PRO LABORE', 'NÃO FEITO', 'SEM FOLHA'], select('payrollStatus'))}
          ${formSelectField('Balancete contábil', 'client-balance', ['NÃO FEITO MEI', 'NÃO FEITO PRESUMIDO', 'NÃO FEITO SN', 'SEM ESCRITURAÇÃO', 'SEM MOVIMENTO'], select('balance'))}
          ${formSelectField('EFD Reinf', 'client-efd-reinf', ['DISPENSA', 'VERIFICAR CONTÁBIL - DISTRIBUIÇÃO'], select('efdReinf'))}
        </div>
        <p class="form-error" id="form-error" role="alert"></p>
        <div class="modal-actions">
          <button class="secondary-button" id="cancel-modal">Cancelar</button>
          <button class="primary-button" id="save-modal" style="margin:0">${isEditing ? 'Salvar alterações' : 'Salvar cliente'}</button>
        </div>
      </div>
    </div>
  `;
}

function renderClientSheet(client) {
  const fields = [
    ['Razão social', client.name],
    ['CNPJ ou CPF', client.cnpj],
    ['Município', client.city],
    ['Responsável contábil', client.accountingResponsible],
    ['Tributação', client.tax],
    ['Atividade', client.activity],
    ['Informações folha', client.payrollInfo],
    ['Fechamento fiscal', client.fiscalClosing],
    ['Sintegra', client.sintegra],
    ['DSTDA', client.dstda],
    ['Folha de pagamento', client.payrollStatus],
    ['Balancete contábil', client.balance],
    ['EFD Reinf', client.efdReinf],
    ['Status', client.active ? 'Ativo' : 'Inativo']
  ];

  return `
    <div class="modal-backdrop sheet-backdrop" id="sheet-backdrop">
      <div class="modal client-sheet-modal" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Ficha da empresa</p>
            <h2 id="sheet-title">${client.name}</h2>
            <p class="modal-description">Consulta dos dados cadastrais e do acompanhamento da planilha.</p>
          </div>
          <button class="close" id="close-sheet" aria-label="Fechar ficha">×</button>
        </div>
        <div class="client-sheet-identity">
          <span class="initials ${client.tone}">${client.initials}</span>
          <div><strong>${client.name}</strong><small>${client.cnpj} · ${client.city}</small></div>
          <span class="status ${client.active ? '' : 'inactive'}"><i></i>${client.active ? 'Ativo' : 'Inativo'}</span>
        </div>
        <p class="form-section-label">Dados completos</p>
        <div class="client-sheet-grid">
          ${fields.map(([label, value]) => `<div class="client-sheet-field"><span>${label}</span><strong>${value || 'Não informado'}</strong></div>`).join('')}
        </div>
        <div class="modal-actions"><button class="secondary-button" id="close-sheet-action" type="button">Fechar ficha</button><button class="primary-button" id="edit-sheet-action" type="button">Editar ficha</button></div>
      </div>
    </div>
  `;
}

function renderDeleteConfirmation(client) {
  return `
    <div class="modal-backdrop delete-backdrop" id="delete-backdrop">
      <div class="modal delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div class="delete-icon" aria-hidden="true">!</div>
        <div class="delete-copy">
          <p class="eyebrow">Confirmação necessária</p>
          <h2 id="delete-title">Excluir cliente?</h2>
          <p>Você está prestes a excluir o cadastro abaixo:</p>
          <div class="delete-client-card">
            <strong>${client.name}</strong>
            <span>${client.cnpj}</span>
          </div>
          <p class="delete-warning"><strong>Atenção:</strong> essa ação não poderá ser desfeita.</p>
        </div>
        <div class="modal-actions delete-actions">
          <button class="secondary-button" id="cancel-delete" type="button">Cancelar</button>
          <button class="delete-confirm-button" id="confirm-delete" type="button">Excluir cliente</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function formField(label, placeholder, wide = false, id = '', value = '', readonly = false) {
  return `
    <div class="form-field ${wide ? 'wide' : ''}">
      <label for="${id}">${label}</label>
      <input id="${id}" placeholder="${placeholder}" value="${escapeHtml(value)}" ${readonly ? 'readonly' : ''}>
    </div>
  `;
}

function formSelectField(label, id, values, selectedValue = '') {
  const optionValues = selectedValue && !values.includes(selectedValue) ? [selectedValue, ...values] : values;
  return `
    <div class="form-field">
      <label for="${id}">${label}</label>
      <select id="${id}">
        <option value="">Selecionar</option>
        ${optionValues.map((value) => `<option value="${escapeHtml(value)}" ${selectedValue === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
      </select>
    </div>
  `;
}
