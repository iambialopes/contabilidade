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

function renderOverview({ clientsHtml, lowerHtml, activeCount, totalCount }) {
  return `
    <section class="paper-card">
      <div class="hero-copy">
        <p class="eyebrow">Visão do escritório</p>
        <h2>O trabalho de hoje,<br><span>organizado por cliente.</span></h2>
        <p>Centralize as rotinas dos quatro departamentos e encontre rapidamente o próximo passo de cada empresa.</p>
        <button class="primary-button" data-action="new-client">＋ Cadastrar cliente</button>
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

function renderClientsSection(rowsHtml, filters, clients) {
  return `
    <section>
      <div class="section-heading">
        <div>
          <p class="eyebrow">Base de clientes</p>
          <h2>Empresas acompanhadas</h2>
        </div>
        <button class="text-button" data-action="new-client">＋ Adicionar cliente</button>
      </div>

      <div class="client-table">
        <div class="table-tools">
          <div class="search-wrap">
            <span>⌕</span>
            <input id="client-search" placeholder="Buscar por empresa, CNPJ ou cidade">
          </div>
          <button id="clear-client-filters" class="filter-button all" type="button">
            Limpar filtros
          </button>
        </div>
        <div class="filter-grid" aria-label="Filtros de clientes">
          ${clientFilterSelect('city', 'Cidade', filters.city, clients.map((client) => client.city))}
          ${clientFilterSelect('activity', 'Atividade', filters.activity, clients.map((client) => client.activity))}
          ${clientFilterSelect('tax', 'Tributação', filters.tax, clients.map((client) => client.tax))}
          ${clientFilterSelect('payroll', 'Folha', filters.payroll, clients.map((client) => client.payroll))}
          ${clientFilterSelect('status', 'Status', filters.status, ['Ativo', 'Inativo'])}
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente</th><th>CNPJ</th><th>Cidade</th><th>Tributação</th>
                <th>Atividade</th><th>Folha</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody id="client-rows">${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    </section>
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
    return '<tr><td colspan="9" style="text-align:center;padding:30px">Nenhum cliente encontrado.</td></tr>';
  }

  return clients.map((client) => `
    <tr class="${selectedClientCnpj === client.cnpj ? 'selected' : ''}" data-client="${client.cnpj}">
      <td><div class="client-name"><span class="initials ${client.tone}">${client.initials}</span>${client.name}</div></td>
      <td>${client.cnpj}</td>
      <td>${client.city}</td>
      <td><span class="tag">${client.tax}</span></td>
      <td>${client.activity}</td>
      <td>${client.payroll}</td>
      <td><span class="status ${client.active ? '' : 'inactive'}"><i></i>${client.active ? 'Ativo' : 'Inativo'}</span></td>
      <td class="client-actions"><button class="client-sheet-button" type="button" data-client-open="${client.cnpj}" title="Abrir ficha de ${client.name}">Ficha ↗</button><button class="delete-client" type="button" data-client-delete="${client.cnpj}" title="Excluir ${client.name}" aria-label="Excluir ${client.name}">×</button></td>
    </tr>
  `).join('');
}

function renderLowerPanels(selectedClient) {
  const progress = [['Fiscal', '82%'], ['Pessoal', '64%'], ['Contábil', '91%'], ['Societário', '48%']];
  return `
    <section class="lower-grid">
      <div class="panel">
        <p class="eyebrow">Rotinas por setor</p>
        <h3>Mapa de acompanhamento</h3>
        ${progress.map(([label, value]) => `
          <div class="progress-row">
            <label>${label}</label>
            <div class="progress-bar"><i style="width:${value}"></i></div>
            <span>${value}</span>
          </div>
        `).join('')}
      </div>

      <div class="panel client-focus">
        <p class="eyebrow">Cliente selecionado</p>
        <h4>${selectedClient.name}</h4>
        <small>${selectedClient.city} · ${selectedClient.tax}</small>
        <div class="focus-stats">
          <div class="focus-stat"><small>Pendências</small><strong>03</strong></div>
          <div class="focus-stat"><small>Em dia</small><strong>18</strong></div>
        </div>
        <button class="text-button" data-action="open-sheet">Ver ficha completa ↗</button>
      </div>
    </section>
  `;
}

function renderDepartment({ department, moduleData, selectedClient, clientsHtml, lowerHtml }) {
  return `
    <section class="dept-hero">
      <p class="eyebrow">${moduleData.eyebrow}</p>
      <h2>Departamento ${department.label}</h2>
      <p>${moduleData.intro}</p>
      <div class="client-context">
        <p class="eyebrow">Cliente em foco</p>
        <strong>${selectedClient.name}</strong>
        <small>${moduleData.metric} ${moduleData.metricLabel}</small>
      </div>
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

    ${clientsHtml}
    ${lowerHtml}
  `;
}

function renderModal() {
  return `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Nova ficha</p>
            <h2 id="modal-title">Cadastrar cliente</h2>
            <p class="modal-description">Preencha os dados principais para incluir a empresa na sua carteira.</p>
          </div>
          <button class="close" id="close-modal" aria-label="Fechar">×</button>
        </div>
        <p class="form-section-label">Dados cadastrais</p>
        <div class="form-grid">
          ${formField('Razão social', 'Nome da empresa', true, 'client-name')}
          ${formField('CNPJ ou CPF', '00.000.000/0000-00', false, 'client-cnpj')}
          ${formSelectField('Município', 'client-city', ['BALNEARIO CAMBORIU', 'BLUMENAU', 'CRICIUMA', 'FLORIANOPOLIS', 'GAROPABA', 'IMBITUBA', 'LAGUNA', 'TUBARÃO'])}
          ${formSelectField('Responsável contábil', 'client-accounting-responsible', ['ANA', 'GRACY', 'SEM CONTABILIDADE'])}
          ${formSelectField('Tributação', 'client-tax', ['MEI', 'PF', 'PRESUMIDO', 'SIMPLES NACIONAL', 'SN COM FATOR R'])}
          ${formSelectField('Atividade', 'client-activity', ['ASSOCIAÇÃO', 'COMERCIO', 'COMÉRCIO E SERVIÇO', 'CONDOMINIO', 'PESSOA FISICA', 'SERVIÇO'])}
        </div>

        <p class="form-section-label">Acompanhamento da planilha</p>
        <div class="form-grid">
          ${formSelectField('Informações folha', 'client-payroll-info', ['FUNCIONÁRIOS', 'PRÓ-LABORE', 'PRÓ-LABORE E FUNCIONÁRIOS', 'SEM FOLHA'])}
          ${formSelectField('Fechamento fiscal', 'client-fiscal-closing', ['EM ANÁLISE', 'ENVIADO', 'NÃO FEITO', 'SEM MOVIMENTO'])}
          ${formSelectField('Sintegra', 'client-sintegra', ['CLIENTE NOVO', 'DESOBRIGADO', 'ENVIAR', 'MEI - DESOBRIGADO', 'SIMPLES NACIONAL - SERVIÇO'])}
          ${formSelectField('DSTDA', 'client-dstda', ['CLIENTE NOVO', 'DESOBRIGADO', 'MEI - DESOBRIGADO', 'SIMPLES NACIONAL - SERVIÇO', 'VERIFICAR OBRIGATORIEDADE'])}
          ${formSelectField('Folha de pagamento', 'client-payroll-status', ['ENVIADO - DCTFWEB', 'ENVIADO- FUNCIONARIOS', 'ENVIADO- PRO LABORE', 'NÃO FEITO', 'SEM FOLHA'])}
          ${formSelectField('Balancete contábil', 'client-balance', ['NÃO FEITO MEI', 'NÃO FEITO PRESUMIDO', 'NÃO FEITO SN', 'SEM ESCRITURAÇÃO', 'SEM MOVIMENTO'])}
          ${formSelectField('EFD Reinf', 'client-efd-reinf', ['DISPENSA', 'VERIFICAR CONTÁBIL - DISTRIBUIÇÃO'])}
        </div>
        <p class="form-error" id="form-error" role="alert"></p>
        <div class="modal-actions">
          <button class="secondary-button" id="cancel-modal">Cancelar</button>
          <button class="primary-button" id="save-modal" style="margin:0">Salvar cliente</button>
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
        <div class="modal-actions"><button class="secondary-button" id="close-sheet-action" type="button">Fechar ficha</button></div>
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

function formField(label, placeholder, wide = false, id = '') {
  return `
    <div class="form-field ${wide ? 'wide' : ''}">
      <label for="${id}">${label}</label>
      <input id="${id}" placeholder="${placeholder}">
    </div>
  `;
}

function formSelectField(label, id, values, wide = false) {
  return `
    <div class="form-field ${wide ? 'wide' : ''}">
      <label for="${id}">${label}</label>
      <select id="${id}">
        <option value="">Selecionar</option>
        ${values.map((value) => `<option value="${value}">${value}</option>`).join('')}
      </select>
    </div>
  `;
}
