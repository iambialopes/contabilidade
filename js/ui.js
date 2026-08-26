/* Corrêa Controle Interno — Renderização e eventos de interface. */

const { clients, departments, departmentsData, monthHistory = {}, months = [] } = window.CorreaData;
const originalMonthKeys = new Set(months);
const state = window.CorreaState;
let competenceDraft = null;
let competenceTargetMonth = '';
const pageContent = document.querySelector('#page-content');
const navigation = document.querySelector('#department-nav');
const pageTitle = document.querySelector('#page-title');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
const printRoot = document.querySelector('#print-root');
const customClientsStorageKey = 'correa-controle-interno-custom-clients';
const deletedClientsStorageKey = 'correa-controle-interno-deleted-clients';
const routineProgressStorageKey = 'correa-controle-interno-routine-progress';
const customCompetenciesStorageKey = 'correa-controle-interno-custom-competencies';
const savedCompetencies = loadSavedCompetencies();
Object.entries(savedCompetencies).forEach(([month, snapshot]) => {
  monthHistory[month] = snapshot;
  if (!months.includes(month)) months.push(month);
});
const savedClients = loadSavedClients();
const deletedClientCnpjs = loadDeletedClientCnpjs();
savedClients.forEach((savedClient) => {
  const existingClient = clients.find((client) => client.cnpj === savedClient.cnpj);
  if (existingClient) Object.assign(existingClient, savedClient);
  else clients.push(savedClient);
});
for (let index = clients.length - 1; index >= 0; index -= 1) {
  if (deletedClientCnpjs.includes(clients[index].cnpj)) clients.splice(index, 1);
}
const menuToggle = document.querySelector('#menu-toggle');
const menuClose = document.querySelector('#menu-close');
const mobileOverlay = document.querySelector('#mobile-overlay');
const clientNameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

function sortClients() {
  clients.sort((firstClient, secondClient) => clientNameCollator.compare(firstClient.name, secondClient.name));
}

function normalizeDocument(value) {
  return String(value || '').replace(/\D/g, '');
}

function getVisibleClients() {
  const snapshots = monthHistory[state.selectedMonth];
  if (!snapshots) return clients;
  return snapshots.map((snapshot) => {
    const current = clients.find((client) => normalizeDocument(client.cnpj) === normalizeDocument(snapshot.cnpj) || client.name.toLowerCase() === snapshot.name.toLowerCase());
    return { ...current, ...snapshot, tone: current?.tone || snapshot.tone, initials: current?.initials || snapshot.initials };
  });
}

function getClientByCnpj(cnpj) {
  return getVisibleClients().find((client) => client.cnpj === cnpj) || clients.find((client) => client.cnpj === cnpj);
}

function renderApp() {
  sortClients();
  renderCurrentDate();
  renderPageTitle();
  navigation.innerHTML = renderNavigation(departments, state.currentPage);
  pageContent.innerHTML = getPageTemplate();
  bindNavigation();
  bindActions();
  bindClientControls();
}

function renderPageTitle() {
  if (state.currentPage === 'overview') {
    pageTitle.textContent = 'Olá, Ihara';
    return;
  }
  const department = departments.find((item) => item.key === state.currentPage);
  pageTitle.textContent = `Departamento ${department.label}`;
}

function renderCurrentDate() {
  const dateLabel = document.querySelector('#date-label');
  if (!dateLabel) return;

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  dateLabel.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function getPageTemplate() {
  const selectedClient = getSelectedClient();
  const clientsSection = state.currentPage === 'overview' ? getClientsSection() : '';
  const lowerPanels = state.currentPage === 'overview' ? renderLowerPanels(selectedClient) : '';

  if (state.currentPage === 'overview') {
    return renderOverview({
      clientsHtml: clientsSection,
      lowerHtml: lowerPanels,
      activeCount: getVisibleClients().filter((client) => client.active).length,
      totalCount: getVisibleClients().length,
      selectedMonth: state.selectedMonth,
      months: [...months].sort((a, b) => monthSortValue(a) - monthSortValue(b))
    });
  }

  return renderDepartment({
    department: departments.find((item) => item.key === state.currentPage),
    moduleData: departmentsData[state.currentPage],
    selectedClient,
    clients
  });
}

function getClientsSection() {
  const visibleClients = getVisibleClients();
  return renderClientsSection(renderClientRows(getFilteredClients(), state.selectedClientCnpj), state.filters, visibleClients);
}

function monthSortValue(label) {
  const monthsOrder = { JAN: 1, FEV: 2, MAR: 3, ABR: 4, ABRIL: 4, MAI: 5, MAIO: 5, JUN: 6, JUNHO: 6, JUL: 7, JULHO: 7, AGO: 8, AGOSTO: 8, SET: 9, SETEMBRO: 9, OUT: 10, OUTUBRO: 10, NOV: 11, NOVEMBRO: 11, DEZ: 12, DEZEMBRO: 12 };
  const match = String(label).toUpperCase().match(/^[A-ZÇ]+\s*(\d{2})?$/);
  if (!match) return 0;
  const parts = String(label).toUpperCase().split(/\s+/);
  const month = monthsOrder[parts[0]] || 0;
  const year = Number(parts[1] || '26');
  return (2000 + year) * 100 + month;
}

function getFilteredClients() {
  const search = state.searchTerm.toLowerCase().trim();
  const filters = state.filters;
  return getVisibleClients().filter((client) => {
    const matchesStatus = !filters.status || (filters.status === 'active' ? client.active : !client.active);
    const searchableText = `${client.name} ${client.cnpj} ${client.city}`.toLowerCase();
    return matchesStatus
      && searchableText.includes(search)
      && (!filters.city || client.city === filters.city)
      && (!filters.activity || client.activity === filters.activity)
      && (!filters.tax || client.tax === filters.tax)
      && (!filters.payroll || client.payroll === filters.payroll)
      && (!filters.fiscalClosing || client.fiscalClosing === filters.fiscalClosing);
  });
}

function getSelectedClient() {
  const visibleClients = getVisibleClients();
  return visibleClients.find((client) => client.cnpj === state.selectedClientCnpj) || visibleClients[0] || clients[0];
}

function loadRoutineProgress() {
  try { return JSON.parse(localStorage.getItem(routineProgressStorageKey) || '{}'); } catch (error) { return {}; }
}

function loadSavedCompetencies() {
  try {
    const saved = JSON.parse(localStorage.getItem(customCompetenciesStorageKey) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch (error) {
    return {};
  }
}

function saveCompetenciesToStorage() {
  const customCompetencies = {};
  months.filter((month) => !originalMonthKeys.has(month)).forEach((month) => {
    customCompetencies[month] = monthHistory[month];
  });
  localStorage.setItem(customCompetenciesStorageKey, JSON.stringify(customCompetencies));
}

function getNextCompetenceLabel(sourceMonth) {
  const parts = String(sourceMonth).trim().toUpperCase().split(/\s+/);
  const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  const aliases = { JAN: 0, JANEIRO: 0, FEV: 1, FEVEREIRO: 1, MAR: 2, MARÇO: 2, ABR: 3, ABRIL: 3, MAI: 4, MAIO: 4, JUN: 5, JUNHO: 5, JUL: 6, JULHO: 6, AGO: 7, AGOSTO: 7, SET: 8, SETEMBRO: 8, OUT: 9, OUTUBRO: 9, NOV: 10, NOVEMBRO: 10, DEZ: 11, DEZEMBRO: 11 };
  const monthIndex = aliases[parts[0]] ?? 0;
  const parsedYear = Number(parts[1] || '26');
  const year = parsedYear + (monthIndex === 11 ? 1 : 0);
  return `${monthNames[(monthIndex + 1) % 12]} ${String(year).slice(-2)}`;
}

function normalizeCompetenceLabel(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function openNewCompetenceModal() {
  const sourceMonth = state.selectedMonth;
  competenceDraft = getVisibleClients().map((client) => ({ ...client }));
  competenceTargetMonth = getNextCompetenceLabel(sourceMonth);
  renderCompetenceReview(sourceMonth);
}

function renderCompetenceReview(sourceMonth = state.selectedMonth) {
  modalRoot.innerHTML = renderNewCompetenceModal({ sourceMonth, targetMonth: competenceTargetMonth, clients: competenceDraft || [] });
  const close = () => { competenceDraft = null; competenceTargetMonth = ''; closeModal(); };
  document.querySelector('#close-competence-modal')?.addEventListener('click', close);
  document.querySelector('#cancel-competence-modal')?.addEventListener('click', close);
  document.querySelector('#competence-target-month')?.addEventListener('input', (event) => {
    competenceTargetMonth = event.target.value;
  });
  document.querySelectorAll('.competence-review-select').forEach((select) => {
    select.addEventListener('change', (event) => {
      const index = Number(event.target.dataset.reviewIndex);
      const field = event.target.dataset.reviewField;
      if (!competenceDraft[index]) return;
      competenceDraft[index][field] = field === 'active' ? event.target.value === 'ATIVO' : event.target.value;
      if (field === 'payrollInfo') competenceDraft[index].payroll = event.target.value === 'SEM FOLHA' ? 'Não' : 'Sim';
    });
  });
  document.querySelectorAll('[data-competence-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      competenceDraft.splice(Number(button.dataset.competenceRemove), 1);
      renderCompetenceReview(sourceMonth);
    });
  });
  document.querySelector('#competence-add-client')?.addEventListener('click', openCompetenceClientModal);
  document.querySelector('#confirm-competence-modal')?.addEventListener('click', () => confirmNewCompetence(sourceMonth));
  document.querySelector('#competence-target-month')?.focus();
}

function openCompetenceClientModal() {
  modalRoot.innerHTML = renderModal();
  const close = () => renderCompetenceReview(state.selectedMonth);
  document.querySelector('#close-modal')?.addEventListener('click', close);
  document.querySelector('#cancel-modal')?.addEventListener('click', close);
  document.querySelector('#save-modal')?.addEventListener('click', () => {
    const client = collectClientFromForm();
    if (!client) return;
    const duplicated = competenceDraft.some((item) => normalizeDocument(item.cnpj) === normalizeDocument(client.cnpj));
    if (duplicated) {
      document.querySelector('#form-error').textContent = 'Este cliente já está na revisão da nova competência.';
      return;
    }
    competenceDraft.push(client);
    renderCompetenceReview(state.selectedMonth);
  });
  document.querySelector('#client-name')?.focus();
}

function confirmNewCompetence(sourceMonth) {
  const errorElement = document.querySelector('#competence-error');
  const targetMonth = normalizeCompetenceLabel(competenceTargetMonth);
  if (!/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ|JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+\d{2,4}$/.test(targetMonth)) {
    errorElement.textContent = 'Informe a competência no formato OUTUBRO 26.';
    return;
  }
  if (months.includes(targetMonth)) {
    errorElement.textContent = 'Essa competência já existe. Escolha outro mês ou ano.';
    return;
  }
  monthHistory[targetMonth] = competenceDraft.map((client) => ({ ...client }));
  months.push(targetMonth);
  saveCompetenciesToStorage();
  state.selectedMonth = targetMonth;
  state.selectedClientCnpj = competenceDraft[0]?.cnpj || '';
  competenceDraft = null;
  competenceTargetMonth = '';
  closeModal();
  renderApp();
  showToast(`${targetMonth} foi criada com a situação revisada.`);
}

function getDashboardData(selectedClient) {
  const progress = loadRoutineProgress()[selectedClient.cnpj] || {};
  const departmentItems = Object.entries(departmentsData).map(([key, moduleData]) => {
    const department = departments.find((item) => item.key === key);
    const tasks = moduleData.tasks.map((task, index) => ({
      ...task,
      status: progress[`${key}.${index}`] || 'Pendente'
    }));
    const done = tasks.filter((task) => task.status === 'Concluído').length;
    const inProgress = tasks.filter((task) => task.status === 'Em andamento').length;
    return { key, label: department.label, eyebrow: moduleData.eyebrow, tasks, done, inProgress, pending: tasks.length - done, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  });
  const total = departmentItems.reduce((sum, department) => sum + department.tasks.length, 0);
  const done = departmentItems.reduce((sum, department) => sum + department.done, 0);
  const inProgress = departmentItems.reduce((sum, department) => sum + department.inProgress, 0);
  return { total, done, inProgress, pending: total - done, percent: total ? Math.round((done / total) * 100) : 0, departments: departmentItems };
}

function bindNavigation() {
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      state.setPage(button.dataset.page);
      closeMobileMenu();
    });
  });
}

function openMobileMenu() {
  document.body.classList.add('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  document.body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}

menuToggle?.addEventListener('click', openMobileMenu);
menuClose?.addEventListener('click', closeMobileMenu);
mobileOverlay?.addEventListener('click', closeMobileMenu);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileMenu();
});

function bindActions() {
  document.querySelectorAll('[data-action="toast"]').forEach((element) => {
    element.addEventListener('click', () => showToast(element.dataset.message));
  });

  document.querySelectorAll('[data-action="new-client"]').forEach((element) => {
    element.addEventListener('click', openModal);
  });

  document.querySelectorAll('[data-action="new-competence"]').forEach((element) => {
    element.addEventListener('click', openNewCompetenceModal);
  });

  document.querySelectorAll('[data-action="open-sheet"]').forEach((element) => {
    element.addEventListener('click', () => {
      const client = getSelectedClient();
      if (client) openClientSheet(client);
    });
  });

  const departmentClientSearch = document.querySelector('#department-client-search');
  const departmentClientResults = document.querySelector('#department-client-results');
  departmentClientSearch?.addEventListener('input', (event) => {
    const term = event.target.value.toLowerCase().trim();
    departmentClientResults?.querySelectorAll('[data-department-client]').forEach((result) => {
      result.hidden = term && !result.dataset.searchText.includes(term);
    });
  });
  departmentClientResults?.querySelectorAll('[data-department-client]').forEach((result) => {
    result.addEventListener('click', () => {
      state.selectedClientCnpj = result.dataset.departmentClient;
      renderApp();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  });

  document.querySelectorAll('[data-action="routine-toast"]').forEach((element) => {
    element.addEventListener('click', () => showToast('Selecione o status de uma rotina para registrar o andamento deste cliente.'));
  });

  document.querySelectorAll('[data-routine-status]').forEach((select) => {
    select.addEventListener('change', (event) => {
      const progress = loadRoutineProgress();
      progress[event.target.dataset.client] ||= {};
      progress[event.target.dataset.client][`${event.target.dataset.department}.${event.target.dataset.routineIndex}`] = event.target.value;
      localStorage.setItem(routineProgressStorageKey, JSON.stringify(progress));
      renderApp();
      showToast('Andamento da rotina atualizado.');
    });
  });
}

function bindClientControls() {
  const searchInput = document.querySelector('#client-search');
  const filterSelects = document.querySelectorAll('.client-filter');
  const clearFiltersButton = document.querySelector('#clear-client-filters');
  const exportPdfButton = document.querySelector('#export-clients-pdf');
  const monthSelectElement = document.querySelector('#overview-month-select');

  monthSelectElement?.addEventListener('change', (event) => {
    state.selectedMonth = event.target.value;
    state.searchTerm = '';
    state.filters = { city: '', activity: '', tax: '', payroll: '', fiscalClosing: '', status: 'active' };
    const visibleClients = getVisibleClients();
    if (!visibleClients.some((client) => client.cnpj === state.selectedClientCnpj)) state.selectedClientCnpj = visibleClients[0]?.cnpj || '';
    renderApp();
  });

  searchInput?.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    document.querySelector('#client-rows').innerHTML = renderClientRows(getFilteredClients(), state.selectedClientCnpj);
    bindClientRows();
  });

  filterSelects.forEach((select) => {
    select.addEventListener('change', (event) => {
      state.filters[event.target.dataset.filter] = event.target.value;
      renderApp();
    });
  });

  clearFiltersButton?.addEventListener('click', () => {
    state.searchTerm = '';
    state.filters = { city: '', activity: '', tax: '', payroll: '', fiscalClosing: '', status: '' };
    renderApp();
  });

  exportPdfButton?.addEventListener('click', openExportOptions);
  bindClientRows();
}

function bindClientRows() {
  document.querySelectorAll('[data-client-open]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const client = getClientByCnpj(button.dataset.clientOpen);
      if (client) openClientSheet(client);
    });
  });

  document.querySelectorAll('[data-client]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedClientCnpj = row.dataset.client;
      renderApp();
    });
  });

  document.querySelectorAll('[data-client-delete]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const client = getClientByCnpj(button.dataset.clientDelete);
      if (!client) return;

      openDeleteConfirmation(client);
    });
  });
}

function openClientSheet(client) {
  modalRoot.innerHTML = renderClientSheet(client);

  const closeSheet = () => {
    modalRoot.innerHTML = '';
    window.removeEventListener('keydown', handleEscape);
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') closeSheet();
  };

  document.querySelector('#close-sheet').addEventListener('click', closeSheet);
  document.querySelector('#close-sheet-action').addEventListener('click', closeSheet);
  document.querySelector('#edit-sheet-action').addEventListener('click', () => {
    closeSheet();
    openModal(client);
  });
  document.querySelector('#sheet-backdrop').addEventListener('click', (event) => {
    if (event.target.id === 'sheet-backdrop') closeSheet();
  });

  window.addEventListener('keydown', handleEscape);
  document.querySelector('#close-sheet').focus();
}

function openDeleteConfirmation(client) {
  modalRoot.innerHTML = renderDeleteConfirmation(client);

  const closeConfirmation = () => {
    modalRoot.innerHTML = '';
    window.removeEventListener('keydown', handleEscape);
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') closeConfirmation();
  };

  document.querySelector('#cancel-delete').addEventListener('click', closeConfirmation);
  document.querySelector('#delete-backdrop').addEventListener('click', (event) => {
    if (event.target.id === 'delete-backdrop') closeConfirmation();
  });
  document.querySelector('#confirm-delete').addEventListener('click', () => {
    const clientIndex = clients.indexOf(client);
    if (clientIndex >= 0) clients.splice(clientIndex, 1);
    deleteClientFromStorage(client);

    if (state.selectedClientCnpj === client.cnpj) {
      state.selectedClientCnpj = clients[0]?.cnpj || '';
    }

    closeConfirmation();
    renderApp();
    showToast(`${client.name} foi excluído da lista.`);
  });

  window.addEventListener('keydown', handleEscape);
  document.querySelector('#cancel-delete').focus();
}

function loadSavedClients() {
  try {
    const saved = JSON.parse(localStorage.getItem(customClientsStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveClientToStorage(client) {
  const saved = loadSavedClients();
  const existingIndex = saved.findIndex((savedClient) => savedClient.cnpj === client.cnpj);
  if (existingIndex >= 0) saved[existingIndex] = client;
  else saved.push(client);
  localStorage.setItem(customClientsStorageKey, JSON.stringify(saved));
  removeDeletedClientCnpj(client.cnpj);
}

function deleteClientFromStorage(client) {
  const saved = loadSavedClients().filter((savedClient) => savedClient.cnpj !== client.cnpj);
  if (saved.length) {
    localStorage.setItem(customClientsStorageKey, JSON.stringify(saved));
  } else {
    localStorage.removeItem(customClientsStorageKey);
  }

  const deleted = loadDeletedClientCnpjs();
  if (!deleted.includes(client.cnpj)) deleted.push(client.cnpj);
  localStorage.setItem(deletedClientsStorageKey, JSON.stringify(deleted));
}

function loadDeletedClientCnpjs() {
  try {
    const deleted = JSON.parse(localStorage.getItem(deletedClientsStorageKey) || '[]');
    return Array.isArray(deleted) ? deleted : [];
  } catch (error) {
    return [];
  }
}

function removeDeletedClientCnpj(cnpj) {
  const remaining = loadDeletedClientCnpjs().filter((deletedCnpj) => deletedCnpj !== cnpj);
  if (remaining.length) {
    localStorage.setItem(deletedClientsStorageKey, JSON.stringify(remaining));
  } else {
    localStorage.removeItem(deletedClientsStorageKey);
  }
}

function collectClientFromForm(existingClient = null) {
  const name = document.querySelector('#client-name').value.trim();
  const cnpj = document.querySelector('#client-cnpj').value.trim();
  const city = document.querySelector('#client-city').value;
  const accountingResponsible = document.querySelector('#client-accounting-responsible').value;
  const tax = document.querySelector('#client-tax').value;
  const activity = document.querySelector('#client-activity').value;
  const payrollInfo = document.querySelector('#client-payroll-info').value;
  const fiscalClosing = document.querySelector('#client-fiscal-closing').value;
  const sintegra = document.querySelector('#client-sintegra').value;
  const dstda = document.querySelector('#client-dstda').value;
  const payrollStatus = document.querySelector('#client-payroll-status').value;
  const balance = document.querySelector('#client-balance').value;
  const efdReinf = document.querySelector('#client-efd-reinf').value;
  const active = document.querySelector('#client-active').value === 'ATIVO';
  const errorElement = document.querySelector('#form-error');

  if (!name || !cnpj || !city || !accountingResponsible || !tax || !activity || !payrollInfo || !fiscalClosing || !sintegra || !dstda || !payrollStatus || !balance || !efdReinf) {
    errorElement.textContent = 'Preencha todos os campos para salvar a ficha.';
    return null;
  }

  const normalizedCnpj = cnpj.replace(/\D/g, '');
  if (clients.some((client) => client !== existingClient && client.cnpj.replace(/\D/g, '') === normalizedCnpj)) {
    errorElement.textContent = 'Já existe outro cliente cadastrado com este CNPJ ou CPF.';
    return null;
  }

  const initials = name.split(/\\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const updatedClient = {
    ...(existingClient || {}),
    name,
    cnpj,
    city,
    accountingResponsible,
    tax,
    activity,
    payrollInfo,
    fiscalClosing,
    sintegra,
    dstda,
    payrollStatus,
    balance,
    efdReinf,
    payroll: payrollInfo === 'SEM FOLHA' ? 'Não' : 'Sim',
    active,
    initials: initials || existingClient?.initials || 'CL',
    tone: existingClient?.tone || 'mint'
  };

  return updatedClient;
}

function createClientFromForm() {
  const client = collectClientFromForm();
  if (!client) return null;
  clients.push(client);
  saveClientToStorage(client);
  return client;
}

function updateClientFromForm(existingClient) {
  const updatedClient = collectClientFromForm(existingClient);
  if (!updatedClient) return null;
  const clientIndex = clients.indexOf(existingClient);
  if (clientIndex >= 0) clients[clientIndex] = updatedClient;
  saveClientToStorage(updatedClient);
  return updatedClient;
}

function openModal(existingClient = null) {
  modalRoot.innerHTML = renderModal(existingClient);
  document.querySelector('#close-modal').addEventListener('click', closeModal);
  document.querySelector('#cancel-modal').addEventListener('click', closeModal);
  document.querySelector('#save-modal').addEventListener('click', () => {
    const client = existingClient ? updateClientFromForm(existingClient) : createClientFromForm();
    if (!client) return;
    closeModal();
    state.selectedClientCnpj = client.cnpj;
    renderApp();
    showToast(existingClient ? `${client.name} foi atualizado.` : `${client.name} foi adicionado à lista de empresas.`);
  });
}

function closeModal() {
  modalRoot.innerHTML = '';
}

function openExportOptions() {
  modalRoot.innerHTML = renderExportOptions();
  const closeOptions = () => { modalRoot.innerHTML = ''; };
  document.querySelector('#close-export-options').addEventListener('click', closeOptions);
  document.querySelector('#cancel-export-options').addEventListener('click', closeOptions);
  document.querySelector('#export-options-backdrop').addEventListener('click', (event) => {
    if (event.target.id === 'export-options-backdrop') closeOptions();
  });
  document.querySelector('#select-all-export-columns').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[name="export-column"]');
    const shouldSelect = [...checkboxes].some((checkbox) => !checkbox.checked);
    checkboxes.forEach((checkbox) => { checkbox.checked = shouldSelect; });
  });
  document.querySelector('#confirm-export-pdf').addEventListener('click', () => {
    const selectedKeys = [...document.querySelectorAll('input[name="export-column"]:checked')].map((checkbox) => checkbox.value);
    if (!selectedKeys.length) {
      showToast('Selecione pelo menos uma coluna para gerar o PDF.');
      return;
    }
    closeOptions();
    exportClientsPdf(selectedKeys);
  });
  document.querySelector('#close-export-options').focus();
}

function exportClientsPdf(selectedKeys) {
  const filteredClients = getFilteredClients();
  printRoot.innerHTML = renderPrintReport(filteredClients, state.filters, state.searchTerm, selectedKeys);
  document.body.classList.add('printing-report');
  showToast('Relatório pronto. Na janela de impressão, escolha “Salvar como PDF”.');

  const cleanup = () => {
    printRoot.innerHTML = '';
    document.body.classList.remove('printing-report');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
  window.setTimeout(cleanup, 3000);
}

function showToast(message) {
  toastRoot.innerHTML = `<div class="toast">${message}</div>`;
  window.setTimeout(() => { toastRoot.innerHTML = ''; }, 3200);
}

window.addEventListener('hashchange', () => {
  state.syncPageFromHash();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  renderApp();
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
});
