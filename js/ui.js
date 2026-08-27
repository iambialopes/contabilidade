/* Corrêa Controle Interno — Renderização e eventos de interface. */

const { clients, departments, departmentsData, monthHistory = {}, months = [] } = window.CorreaData;
const originalMonthKeys = new Set(months);
const state = window.CorreaState;
const fiscalFocusStorageKey = 'correa-controle-interno-fiscal-focus-client';
const fiscalCompetenceStorageKey = 'correa-controle-interno-fiscal-competence';
state.fiscalSelectedClientCnpj ||= localStorage.getItem(fiscalFocusStorageKey) || '';
state.fiscalSelectedMonth = localStorage.getItem(fiscalCompetenceStorageKey) || state.fiscalSelectedMonth || state.selectedMonth;
let competenceDraft = null;
let competenceTargetMonth = '';
let fiscalClientPickerOutsideHandler = null;
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
const clientCompetencesStorageKey = 'correa-controle-interno-client-competences';
const savedCompetencies = loadSavedCompetencies();
Object.entries(savedCompetencies).forEach(([month, snapshot]) => {
  monthHistory[month] = snapshot;
  if (!months.includes(month)) months.push(month);
});
const savedClients = loadSavedClients();
const clientCompetences = loadClientCompetences();
const deletedClientCnpjs = loadDeletedClientCnpjs();
savedClients.forEach((savedClient) => {
  const existingClient = clients.find((client) => client.cnpj === savedClient.cnpj);
  if (existingClient) Object.assign(existingClient, savedClient);
  else clients.push(savedClient);
});
for (let index = clients.length - 1; index >= 0; index -= 1) {
  if (deletedClientCnpjs.includes(clients[index].cnpj)) clients.splice(index, 1);
}
savedClients.forEach((savedClient) => {
  if (!Array.isArray(clientCompetences[savedClient.cnpj]) || !clientCompetences[savedClient.cnpj].length) clientCompetences[savedClient.cnpj] = [state.selectedMonth];
});
saveClientCompetences(clientCompetences);
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

function getFiscalMonth() {
  const candidate = state.fiscalSelectedMonth || state.selectedMonth;
  return months.includes(candidate) ? candidate : state.selectedMonth;
}

function getVisibleClients(month = state.selectedMonth) {
  const snapshots = monthHistory[month];
  if (!snapshots) return clients;
  const snapshotCnpjs = new Set(snapshots.map((snapshot) => normalizeDocument(snapshot.cnpj)));
  const snapshotClients = snapshots.map((snapshot) => {
    const current = clients.find((client) => normalizeDocument(client.cnpj) === normalizeDocument(snapshot.cnpj) || client.name.toLowerCase() === snapshot.name.toLowerCase());
    return { ...current, ...snapshot, tone: current?.tone || snapshot.tone, initials: current?.initials || snapshot.initials };
  });
  const addedForMonth = clients.filter((client) => clientCompetences[client.cnpj]?.includes(month) && !snapshotCnpjs.has(normalizeDocument(client.cnpj)));
  return [...snapshotClients, ...addedForMonth].sort((firstClient, secondClient) => clientNameCollator.compare(firstClient.name, secondClient.name));
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
  bindFiscalControls();
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

const fiscalStorageKey = 'correa-controle-interno-fiscal';
function loadFiscalStore() { try { return JSON.parse(localStorage.getItem(fiscalStorageKey) || '{}'); } catch (error) { return {}; } }
function saveFiscalStore(store) { localStorage.setItem(fiscalStorageKey, JSON.stringify(store)); }
function fiscalStatus(value) {
  const text = String(value || '').toUpperCase();
  if (!text) return 'Aguardando';
  if (/DESOBRIGADO|DISPENSA|SEM MOVIMENTO|SEM FOLHA/.test(text)) return 'Desobrigado';
  if (/ENVIADO|FEITO|CONCLU/.test(text)) return 'Concluído';
  if (/ANÁLISE|ANALISE|VERIFICAR|AGUARD/.test(text)) return 'Em análise';
  if (/NÃO FEITO|NAO FEITO|CLIENTE NOVO|PENDENTE/.test(text)) return 'Pendente';
  return 'Aguardando';
}
function getFiscalRows() {
  const store = loadFiscalStore();
  const month = getFiscalMonth();
  return getVisibleClients(month).map((client) => {
    const defaults = { notas: 'Aguardando', apuracao: fiscalStatus(client.fiscalClosing), pgdas: ['MEI', 'PF'].includes(String(client.tax).toUpperCase()) ? 'Não se aplica' : fiscalStatus(client.fiscalClosing), guia: fiscalStatus(client.fiscalClosing), sintegra: fiscalStatus(client.sintegra), dstda: fiscalStatus(client.dstda), livroEletronico: fiscalStatus(client.balance), efdReinf: fiscalStatus(client.efdReinf) };
    const overrides = store[month]?.[client.cnpj]?.fields || {};
    const values = { ...defaults, ...overrides };
    const obligationFields = Object.keys(values);
    const overall = obligationFields.every((field) => ['Concluído', 'Desobrigado', 'Não se aplica'].includes(values[field])) ? 'Em dia' : obligationFields.some((field) => ['Pendente', 'Em análise'].includes(values[field])) ? 'Atenção' : 'Aguardando';
    return { ...client, ...values, overall };
  });
}
function getFiscalSummary(rows) {
  const fields = ['notas', 'apuracao', 'pgdas', 'guia', 'sintegra', 'dstda', 'livroEletronico', 'efdReinf'];
  const completedObligations = rows.reduce((total, row) => total + fields.filter((field) => ['Concluído', 'Desobrigado', 'Não se aplica'].includes(row[field])).length, 0);
  return { total: rows.length, done: rows.filter((row) => row.overall === 'Em dia').length, attention: rows.filter((row) => row.overall === 'Atenção').length, completedObligations, totalObligations: rows.length * fields.length };
}
function getFiscalHistory() { return loadFiscalStore()[getFiscalMonth()]?.history || []; }
function getFiscalDeadlines(month = getFiscalMonth(), clientCnpj = '', row) {
  const details = getFiscalRoutineDetailsForClient(month, clientCnpj, row);
  const scheduled = Object.values(details).filter((detail) => detail.dueDate).sort((first, second) => first.dueState.days - second.dueState.days);
  if (scheduled.length) return scheduled.slice(0, 4).map((detail) => ({ name: detail.title, detail: detail.description || 'Acompanhar a rotina fiscal da competência', due: detail.dueState.key === 'vencido' ? `Vencido · ${detail.displayDue}` : detail.dueState.key === 'hoje' ? 'Hoje' : `Em ${detail.dueState.days} dias · ${detail.displayDue}` }));
  return [{ name: 'Defina o próximo prazo da rotina', detail: 'Abra cada rotina para escolher o dia exato e ativar os alertas', due: 'Sem data' }];
}
function getFiscalFilteredRows(rows) { const filters = state.fiscalFilters || { search: '', status: '', tax: '', city: '', obligation: '' }; const fields = ['notas', 'apuracao', 'pgdas', 'guia', 'sintegra', 'dstda', 'livroEletronico', 'efdReinf']; return rows.filter((row) => { const search = String(filters.search || '').toLowerCase(); const matchesStatus = !filters.status || row.overall === filters.status || fields.some((field) => row[field] === filters.status); const matchesObligation = !filters.obligation || row[filters.obligation] === filters.status || !filters.status; return (!search || `${row.name} ${row.cnpj} ${row.city}`.toLowerCase().includes(search)) && matchesStatus && matchesObligation && (!filters.tax || row.tax === filters.tax) && (!filters.city || row.city === filters.city); }); }

function getPageTemplate() {
  const selectedClient = state.currentPage === 'fiscal' ? getFiscalSelectedClient() : getSelectedClient();
  const clientsSection = state.currentPage === 'overview' ? getClientsSection() : '';
  const lowerPanels = state.currentPage === 'overview' ? renderLowerPanels(selectedClient) : '';

  if (state.currentPage === 'overview') {
    return renderOverview({
      clientsHtml: clientsSection,
      lowerHtml: lowerPanels,
      activeCount: getVisibleClients().filter((client) => client.active).length,
      totalCount: getVisibleClients().length,
      selectedMonth: state.selectedMonth,
      selectedYear: getCompetenceYear(state.selectedMonth),
      months: [...months].sort((a, b) => monthSortValue(a) - monthSortValue(b)),
      canDeleteSelectedMonth: !originalMonthKeys.has(state.selectedMonth)
    });
  }

  if (state.currentPage === 'fiscal') {
    const fiscalRows = getFiscalRows();
    const fiscalMonth = getFiscalMonth();
    const filters = state.fiscalFilters || { search: '', status: '', tax: '', city: '', obligation: '' };
    return renderFiscalDashboard({
      clients: getVisibleClients(fiscalMonth),
      fiscalRows,
      selectedClient,
      selectedMonth: fiscalMonth,
      months: [...months].sort((a, b) => monthSortValue(a) - monthSortValue(b)),
      filteredRows: getFiscalFilteredRows(fiscalRows),
      filters,
      summary: getFiscalSummary(fiscalRows),
      deadlines: getFiscalDeadlines(fiscalMonth, selectedClient?.cnpj || '', fiscalRows.find((row) => row.cnpj === selectedClient?.cnpj) || fiscalRows[0]),
      history: getFiscalHistory(),
      routineItems: getFiscalRoutineItems(fiscalMonth, selectedClient?.cnpj || ''),
      routineDetails: getFiscalRoutineDetailsForClient(fiscalMonth, selectedClient?.cnpj || '', fiscalRows.find((row) => row.cnpj === selectedClient?.cnpj) || fiscalRows[0]),
      routineAlerts: getFiscalRoutineAlerts(fiscalMonth, selectedClient?.cnpj || '', fiscalRows.find((row) => row.cnpj === selectedClient?.cnpj) || fiscalRows[0])
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
  return renderClientsSection(renderClientRows(getFilteredClients(), state.selectedClientCnpj), state.filters, visibleClients, state.clientListExpanded);
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
function getFiscalSelectedClient(month = getFiscalMonth()) {
  const visibleClients = getVisibleClients(month);
  if (!state.fiscalSelectedClientCnpj || !visibleClients.some((client) => client.cnpj === state.fiscalSelectedClientCnpj)) state.fiscalSelectedClientCnpj = visibleClients[0]?.cnpj || clients[0]?.cnpj || '';
  return visibleClients.find((client) => client.cnpj === state.fiscalSelectedClientCnpj) || visibleClients[0] || clients[0];
}

function loadRoutineProgress() {
  try { return JSON.parse(localStorage.getItem(routineProgressStorageKey) || '{}'); } catch (error) { return {}; }
}

const fiscalRoutineDetailsStorageKey = 'correa-controle-interno-fiscal-routine-details';
const fiscalRoutineDefinitions = {
  notas: { title: 'Importação das notas', description: 'Receber XML, validar o período e organizar os documentos fiscais.', due: 'Hoje', responsible: '', checklist: [{ text: 'Documentos recebidos', done: false }, { text: 'Período conferido', done: false }, { text: 'Arquivos organizados', done: false }] },
  apuracao: { title: 'Apuração na Domínio', description: 'Conferir impostos, bases de cálculo e documentos antes da transmissão.', due: '20 AGO', responsible: '', checklist: [{ text: 'Movimento conferido', done: false }, { text: 'Impostos apurados', done: false }, { text: 'Memória de cálculo revisada', done: false }] },
  pgdas: { title: 'Transmissão PGDAS', description: 'Transmitir a declaração e salvar o protocolo do cliente.', due: '21 AGO', responsible: '', checklist: [{ text: 'Faturamento conferido', done: false }, { text: 'PGDAS transmitido', done: false }, { text: 'Protocolo arquivado', done: false }] },
  guia: { title: 'Envio da guia', description: 'Enviar a guia pelo canal combinado e registrar a confirmação do cliente.', due: '22 AGO', responsible: '', checklist: [{ text: 'Guia gerada', done: false }, { text: 'Guia enviada', done: false }, { text: 'Confirmação registrada', done: false }] },
  sintegra: { title: 'Sintegra', description: 'Validar a obrigação estadual conforme a atividade e o enquadramento da empresa.', due: '25 AGO', responsible: '', checklist: [{ text: 'Obrigatoriedade verificada', done: false }, { text: 'Arquivo conferido', done: false }, { text: 'Recibo arquivado', done: false }] },
  dstda: { title: 'DSTDA', description: 'Verificar a obrigatoriedade, preparar a declaração e registrar o envio.', due: '25 AGO', responsible: '', checklist: [{ text: 'Obrigatoriedade verificada', done: false }, { text: 'Dados conferidos', done: false }, { text: 'Comprovante arquivado', done: false }] },
  livroEletronico: { title: 'Livro eletrônico', description: 'Revisar os arquivos do período, recibos e eventuais pendências de retorno.', due: '27 AGO', responsible: '', checklist: [{ text: 'Movimento importado', done: false }, { text: 'Livro revisado', done: false }, { text: 'Recibo arquivado', done: false }] },
  efdReinf: { title: 'EFD Reinf', description: 'Conferir os eventos, transmitir quando aplicável e acompanhar o retorno.', due: '27 AGO', responsible: '', checklist: [{ text: 'Eventos verificados', done: false }, { text: 'Transmissão realizada', done: false }, { text: 'Retorno conferido', done: false }] }
};
const fiscalRoutineLabels = Object.fromEntries(Object.entries(fiscalRoutineDefinitions).map(([key, detail]) => [key, detail.title]));
function loadFiscalRoutineDetailsStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(fiscalRoutineDetailsStorageKey) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch (error) { return {}; }
}
function saveFiscalRoutineDetailsStore(store) { localStorage.setItem(fiscalRoutineDetailsStorageKey, JSON.stringify(store)); }
function cloneChecklist(items) { return (items || []).map((item) => ({ text: item.text, done: Boolean(item.done) })); }
function getFiscalRoutineDetail(month, clientCnpj, routineKey, status = 'Aguardando') {
  const fallback = fiscalRoutineDefinitions[routineKey] || { title: 'Nova rotina fiscal', description: '', due: 'Sem prazo', responsible: '', checklist: [] };
  const saved = loadFiscalRoutineDetailsStore()[month]?.[clientCnpj]?.[routineKey] || {};
  const merged = { ...fallback, ...saved };
  const responsible = ['Ana Cristina', 'Adriele'].includes(merged.responsible) ? merged.responsible : '';
  return { ...merged, responsible, status: fiscalRoutineDefinitions[routineKey] ? status : (saved.status || status), checklist: Array.isArray(saved.checklist) ? cloneChecklist(saved.checklist) : cloneChecklist(fallback.checklist), attachments: Array.isArray(saved.attachments) ? saved.attachments : [] };
}
function getFiscalRoutineItems(month, clientCnpj) {
  const custom = loadFiscalRoutineDetailsStore()[month]?.[clientCnpj] || {};
  const base = Object.entries(fiscalRoutineDefinitions).map(([key, detail]) => [key, detail.title]);
  const customItems = Object.entries(custom).filter(([key]) => !fiscalRoutineDefinitions[key]).map(([key, detail]) => [key, detail.title || 'Nova rotina fiscal']);
  return [...base, ...customItems];
}
function parseFiscalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatFiscalDate(value) {
  const date = parseFiscalDate(value);
  if (!date) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).replace('.', '');
}
function getFiscalDueState(value, today = new Date()) {
  const dueDate = parseFiscalDate(value);
  if (!dueDate) return { key: 'sem-data', label: 'Data pendente', icon: '◷', days: null };
  const reference = new Date(today);
  reference.setHours(0, 0, 0, 0);
  const days = Math.round((dueDate - reference) / 86400000);
  if (days < 0) return { key: 'vencido', label: 'Vencido', icon: '!', days };
  if (days === 0) return { key: 'hoje', label: 'Vence hoje', icon: '!', days };
  if (days <= 7) return { key: 'proximo', label: 'Próximo do vencimento', icon: '◷', days };
  return { key: 'futuro', label: 'Programado', icon: '◷', days };
}
function getFiscalRoutineDetailWithDue(month, clientCnpj, routineKey, status = 'Aguardando') {
  const detail = getFiscalRoutineDetail(month, clientCnpj, routineKey, status);
  const dueState = getFiscalDueState(detail.dueDate);
  return { ...detail, dueState, displayDue: detail.dueDate ? formatFiscalDate(detail.dueDate) : 'Sem data' };
}
function getFiscalRoutineDetailsForClient(month, clientCnpj, row) {
  return Object.fromEntries(getFiscalRoutineItems(month, clientCnpj).map(([key]) => [key, getFiscalRoutineDetailWithDue(month, clientCnpj, key, row?.[key] || 'Aguardando')]));
}
function getFiscalRoutineAlerts(month, clientCnpj, row) {
  const details = getFiscalRoutineDetailsForClient(month, clientCnpj, row);
  return Object.entries(details).map(([key, detail]) => ({ key, ...detail })).filter((detail) => detail.dueDate && ['vencido', 'hoje', 'proximo'].includes(detail.dueState.key) && !['Concluído', 'Desobrigado', 'Não se aplica'].includes(detail.status)).sort((first, second) => first.dueState.days - second.dueState.days);
}
function recordFiscalRoutineStatus(month, clientCnpj, routineKey, status) {
  if (!fiscalRoutineDefinitions[routineKey]) return;
  const store = loadFiscalStore();
  store[month] ||= { history: [] };
  store[month][clientCnpj] ||= { fields: {} };
  store[month][clientCnpj].fields ||= {};
  store[month][clientCnpj].fields[routineKey] = status;
  store[month].history ||= [];
  const client = getVisibleClients(month).find((item) => item.cnpj === clientCnpj);
  store[month].history.unshift({ text: `${client?.name || 'Cliente'}: ${fiscalRoutineDefinitions[routineKey].title} atualizado para ${status}.`, date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()) });
  saveFiscalStore(store);
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

function openDeleteCompetenceConfirmation() {
  const month = state.selectedMonth;
  if (originalMonthKeys.has(month)) {
    showToast('As competências importadas da planilha não podem ser excluídas.');
    return;
  }
  modalRoot.innerHTML = renderDeleteCompetenceConfirmation(month);
  const close = () => closeModal();
  document.querySelector('#cancel-delete-competence')?.addEventListener('click', close);
  document.querySelector('#delete-competence-backdrop')?.addEventListener('click', (event) => {
    if (event.target.id === 'delete-competence-backdrop') close();
  });
  document.querySelector('#confirm-delete-competence')?.addEventListener('click', () => {
    delete monthHistory[month];
    const monthIndex = months.indexOf(month);
    if (monthIndex >= 0) months.splice(monthIndex, 1);
    saveCompetenciesToStorage();
    const sortedMonths = [...months].sort((a, b) => monthSortValue(a) - monthSortValue(b));
    state.selectedMonth = sortedMonths[sortedMonths.length - 1] || '';
    state.selectedClientCnpj = getVisibleClients()[0]?.cnpj || '';
    close();
    renderApp();
    showToast(`${month} foi excluída.`);
  });
  document.querySelector('#cancel-delete-competence')?.focus();
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
    element.addEventListener('click', () => openModal());
  });

  document.querySelectorAll('[data-action="toggle-client-list"]').forEach((element) => {
    element.addEventListener('click', () => {
      state.clientListExpanded = !state.clientListExpanded;
      renderApp();
    });
  });

  document.querySelectorAll('[data-action="new-competence"]').forEach((element) => {
    element.addEventListener('click', openNewCompetenceModal);
  });

  document.querySelectorAll('[data-action="delete-competence"]').forEach((element) => {
    element.addEventListener('click', openDeleteCompetenceConfirmation);
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
  const yearSelectElement = document.querySelector('#overview-year-select');
  const monthSelectElement = document.querySelector('#overview-month-select');
  const resetClientFilters = () => {
    state.searchTerm = '';
    state.filters = { city: '', activity: '', tax: '', payroll: '', fiscalClosing: '', status: 'active' };
  };

  yearSelectElement?.addEventListener('change', (event) => {
    const selectedYear = Number(event.target.value);
    const yearMonths = [...months]
      .filter((month) => getCompetenceYear(month) === selectedYear)
      .sort((a, b) => monthSortValue(a) - monthSortValue(b));
    if (!yearMonths.length) return;
    state.selectedMonth = yearMonths[0];
    resetClientFilters();
    const visibleClients = getVisibleClients();
    if (!visibleClients.some((client) => client.cnpj === state.selectedClientCnpj)) state.selectedClientCnpj = visibleClients[0]?.cnpj || '';
    renderApp();
  });

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

function loadClientCompetences() {
  try {
    const saved = JSON.parse(localStorage.getItem(clientCompetencesStorageKey) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch (error) { return {}; }
}
function saveClientCompetences(value) { localStorage.setItem(clientCompetencesStorageKey, JSON.stringify(value)); }

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
  delete clientCompetences[client.cnpj];
  saveClientCompetences(clientCompetences);
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
  clientCompetences[client.cnpj] = [...new Set([...(clientCompetences[client.cnpj] || []), state.selectedMonth])];
  saveClientCompetences(clientCompetences);
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

function bindFiscalControls() {
  if (state.currentPage !== 'fiscal') return;
  const store = loadFiscalStore();
  const month = getFiscalMonth();
  const resetFiscalFilters = () => { state.fiscalFilters = { search: '', status: '', tax: '', city: '', obligation: '' }; };
  store[month] ||= { history: [] };
  const recordChange = (clientCnpj, field, value) => {
    store[month][clientCnpj] ||= { fields: {} };
    store[month][clientCnpj].fields ||= {};
    store[month][clientCnpj].fields[field] = value;
    store[month].history ||= [];
    const client = getVisibleClients(month).find((item) => item.cnpj === clientCnpj);
    store[month].history.unshift({ text: `${client?.name || 'Cliente'}: ${field} alterado para ${value}.`, date: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()) });
    saveFiscalStore(store);
  };
  document.querySelector('#fiscal-year-select')?.addEventListener('change', (event) => {
    const selectedYear = Number(event.target.value);
    const yearMonths = [...months].filter((item) => getCompetenceYear(item) === selectedYear).sort((a, b) => monthSortValue(a) - monthSortValue(b));
    if (!yearMonths.length) return;
    state.fiscalSelectedMonth = yearMonths[0];
    localStorage.setItem(fiscalCompetenceStorageKey, state.fiscalSelectedMonth);
    resetFiscalFilters();
    renderApp();
  });
  document.querySelector('#fiscal-month-select')?.addEventListener('change', (event) => {
    state.fiscalSelectedMonth = event.target.value;
    localStorage.setItem(fiscalCompetenceStorageKey, state.fiscalSelectedMonth);
    resetFiscalFilters();
    renderApp();
  });
  if (fiscalClientPickerOutsideHandler) {
    document.removeEventListener('click', fiscalClientPickerOutsideHandler);
    fiscalClientPickerOutsideHandler = null;
  }
  const clientPicker = document.querySelector('[data-fiscal-client-picker]');
  const clientPickerTrigger = document.querySelector('#fiscal-focus-client-trigger');
  const clientPickerMenu = document.querySelector('#fiscal-focus-client-options');
  const clientPickerSearch = document.querySelector('#fiscal-focus-client-search');
  const clientPickerOptions = [...document.querySelectorAll('[data-fiscal-focus-client]')];
  const closeClientPicker = () => {
    clientPicker?.classList.remove('is-open');
    clientPickerTrigger?.setAttribute('aria-expanded', 'false');
  };
  clientPickerTrigger?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = clientPicker?.classList.toggle('is-open');
    clientPickerTrigger.setAttribute('aria-expanded', String(Boolean(isOpen)));
    if (isOpen) window.setTimeout(() => clientPickerSearch?.focus(), 0);
    else clientPickerSearch?.blur();
  });
  clientPickerSearch?.addEventListener('input', (event) => {
    const search = event.target.value.toLowerCase().trim();
    clientPickerOptions.forEach((option) => { option.hidden = !option.dataset.fiscalClientName.includes(search); });
  });
  clientPickerOptions.forEach((option) => option.addEventListener('click', () => {
    state.fiscalSelectedClientCnpj = option.dataset.fiscalFocusClient;
    localStorage.setItem(fiscalFocusStorageKey, state.fiscalSelectedClientCnpj);
    renderApp();
  }));
  fiscalClientPickerOutsideHandler = (event) => {
    if (clientPicker && !clientPicker.contains(event.target)) closeClientPicker();
  };
  document.addEventListener('click', fiscalClientPickerOutsideHandler);
  clientPickerMenu?.addEventListener('click', (event) => event.stopPropagation());
  document.querySelector('#fiscal-search')?.addEventListener('input', (event) => { state.fiscalFilters.search = event.target.value; renderApp(); });
  document.querySelectorAll('[data-fiscal-filter]').forEach((select) => select.addEventListener('change', (event) => { state.fiscalFilters[event.target.dataset.fiscalFilter] = event.target.value; renderApp(); }));
  document.querySelector('[data-action="clear-fiscal-filters"]')?.addEventListener('click', () => { state.fiscalFilters = { search: '', status: '', tax: '', city: '', obligation: '' }; renderApp(); });
  document.querySelector('[data-action="export-fiscal-pdf"]')?.addEventListener('click', () => exportFiscalPdf(getFiscalFilteredRows(getFiscalRows())));
  document.querySelectorAll('[data-fiscal-status]').forEach((select) => select.addEventListener('change', (event) => { recordChange(event.target.dataset.fiscalClient, event.target.dataset.fiscalStatus, event.target.value); renderApp(); showToast('Situação fiscal atualizada.'); }));
  document.querySelectorAll('[data-action="open-fiscal-routine"]').forEach((card) => card.addEventListener('click', () => openFiscalRoutineModal(card.dataset.routine, card.dataset.client)));
  document.querySelector('[data-action="new-fiscal-routine"]')?.addEventListener('click', (event) => openFiscalRoutineModal('', event.currentTarget.dataset.client, true));
}

function exportFiscalPdf(rows) {
  const focus = getFiscalSelectedClient(getFiscalMonth());
  const labels = { notas: 'Notas', apuracao: 'Apuração', pgdas: 'PGDAS', guia: 'Guia', sintegra: 'Sintegra', dstda: 'DSTDA', livroEletronico: 'Livro eletrônico', efdReinf: 'EFD Reinf' };
  const fields = Object.keys(labels);
  printRoot.innerHTML = `<article class="print-report fiscal-print-report"><header class="print-report-header"><div><p class="eyebrow">Corrêa Controle Interno</p><h1>Relatório fiscal</h1><p>Competência ${getFiscalMonth()} · Cliente em foco: ${focus?.name || 'não selecionado'}</p></div><div class="print-report-date">Emitido em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</div></header><section class="print-filters"><strong>Resumo do cliente em foco</strong><span><b>Empresa:</b> ${focus?.name || '—'}</span><span><b>Documento:</b> ${focus?.cnpj || '—'}</span><span><b>Cidade:</b> ${focus?.city || '—'}</span><span><b>Tributação:</b> ${focus?.tax || '—'}</span></section><p class="print-report-count">${rows.length} empresa${rows.length === 1 ? '' : 's'} no controle fiscal</p><table><thead><tr><th>Cliente</th><th>Tributação</th>${fields.map((field) => `<th>${labels[field]}</th>`).join('')}<th>Situação geral</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.name}<br><small>${row.cnpj} · ${row.city}</small></td><td>${row.tax || '—'}</td>${fields.map((field) => `<td>${row[field] || 'Aguardando'}</td>`).join('')}<td>${row.overall}</td></tr>`).join('')}</tbody></table></article>`;
  document.body.classList.add('printing-report');
  showToast('Relatório fiscal pronto. Na impressão, escolha “Salvar como PDF”.');
  const cleanup = () => { printRoot.innerHTML = ''; document.body.classList.remove('printing-report'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
  window.setTimeout(cleanup, 3000);
}

function openFiscalRoutineModal(routineKey, clientCnpj, isNew = false) {
  const month = getFiscalMonth();
  const client = getVisibleClients(month).find((item) => item.cnpj === clientCnpj) || getFiscalSelectedClient(month);
  const row = getFiscalRows().find((item) => item.cnpj === client?.cnpj);
  const actualKey = isNew ? `custom-${Date.now()}` : routineKey;
  const detail = isNew
    ? { title: '', description: '', due: 'Sem prazo', responsible: '', status: 'Aguardando', checklist: [{ text: 'Documentos necessários recebidos', done: false }, { text: 'Conferência realizada', done: false }, { text: 'Comprovante arquivado', done: false }], attachments: [], notes: '' }
    : getFiscalRoutineDetail(month, client?.cnpj || '', routineKey, row?.[routineKey] || 'Aguardando');
  const statusOptions = ['Concluído', 'Pendente', 'Em análise', 'Aguardando', 'Não se aplica', 'Desobrigado'];
  modalRoot.innerHTML = renderFiscalRoutineModal({ client, month, routineKey: actualKey, detail, statusOptions, isNew });
  const closeRoutine = () => {
    modalRoot.innerHTML = '';
    window.removeEventListener('keydown', handleEscape);
  };
  const handleEscape = (event) => { if (event.key === 'Escape') closeRoutine(); };
  const fileInput = document.querySelector('#fiscal-routine-files');
  const pendingFiles = [];
  const pendingFilesRoot = document.querySelector('#fiscal-routine-pending-files');
  fileInput?.addEventListener('change', () => {
    pendingFiles.splice(0, pendingFiles.length, ...(fileInput.files ? [...fileInput.files] : []));
    if (pendingFilesRoot) pendingFilesRoot.innerHTML = pendingFiles.map((file) => `<span>${file.name} · ${formatFileSize(file.size)}</span>`).join('');
  });
  document.querySelectorAll('[data-fiscal-attachment-index]').forEach((attachmentButton) => {
    attachmentButton.addEventListener('click', () => {
      const attachment = detail.attachments?.[Number(attachmentButton.dataset.fiscalAttachmentIndex)];
      const attachmentUrl = attachment?.dataUrl || attachment?.url;
      if (!attachmentUrl) {
        showToast('Este anexo não possui conteúdo para visualização.');
        return;
      }
      const openedWindow = window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
      if (!openedWindow) showToast('O navegador bloqueou a abertura do anexo. Permita pop-ups para este site.');
    });
  });
  document.querySelectorAll('[data-fiscal-attachment-delete-index]').forEach((deleteButton) => {
    deleteButton.addEventListener('click', () => {
      const index = Number(deleteButton.dataset.fiscalAttachmentDeleteIndex);
      const attachment = detail.attachments?.[index];
      if (!attachment || !window.confirm(`Excluir o arquivo "${attachment.name}"?`)) return;
      detail.attachments.splice(index, 1);
      deleteButton.closest('.fiscal-routine-attachment')?.remove();
      const attachmentsRoot = document.querySelector('.fiscal-routine-attachments');
      if (!attachmentsRoot) return;
      if (!detail.attachments.length) {
        attachmentsRoot.innerHTML = '<p class="fiscal-empty-copy">Nenhum arquivo anexado a esta rotina.</p>';
      } else {
        attachmentsRoot.querySelectorAll('[data-fiscal-attachment-index]').forEach((button, nextIndex) => {
          button.dataset.fiscalAttachmentIndex = String(nextIndex);
          button.setAttribute('aria-label', `Abrir anexo ${detail.attachments[nextIndex].name}`);
        });
        attachmentsRoot.querySelectorAll('[data-fiscal-attachment-delete-index]').forEach((button, nextIndex) => {
          button.dataset.fiscalAttachmentDeleteIndex = String(nextIndex);
          button.setAttribute('aria-label', `Excluir anexo ${detail.attachments[nextIndex].name}`);
        });
      }
      showToast('Anexo removido. Clique em “Salvar rotina” para confirmar.');
    });
  });
  document.querySelector('#close-fiscal-routine')?.addEventListener('click', closeRoutine);
  document.querySelector('#cancel-fiscal-routine')?.addEventListener('click', closeRoutine);
  document.querySelector('#fiscal-routine-backdrop')?.addEventListener('click', (event) => { if (event.target.id === 'fiscal-routine-backdrop') closeRoutine(); });
  document.querySelector('#save-fiscal-routine')?.addEventListener('click', async () => {
    const error = document.querySelector('#fiscal-routine-error');
    const title = document.querySelector('#fiscal-routine-title')?.value.trim();
    if (!title) { error.textContent = 'Informe o nome da rotina para salvar.'; return; }
    if (pendingFiles.some((file) => file.size > 2 * 1024 * 1024)) { error.textContent = 'Cada arquivo deve ter no máximo 2 MB nesta versão local.'; return; }
    const existingSize = (detail.attachments || []).reduce((total, file) => total + Number(file.size || 0), 0);
    const pendingSize = pendingFiles.reduce((total, file) => total + file.size, 0);
    if (existingSize + pendingSize > 4 * 1024 * 1024) { error.textContent = 'O conjunto de anexos desta rotina deve ter no máximo 4 MB.'; return; }
    const checklist = [...document.querySelectorAll('[data-fiscal-check]')].map((input) => ({ text: input.dataset.fiscalCheckText || input.nextElementSibling?.textContent || '', done: input.checked }));
    try {
      const newAttachments = await Promise.all(pendingFiles.map(async (file) => ({ name: file.name, type: file.type, size: file.size, sizeLabel: formatFileSize(file.size), dataUrl: await readFileAsDataUrl(file) })));
      const dueDate = document.querySelector('#fiscal-routine-due-date')?.value || '';
      const responsible = document.querySelector('#fiscal-routine-responsible')?.value || '';
      if (!['Ana Cristina', 'Adriele'].includes(responsible)) { error.textContent = 'Selecione Ana Cristina ou Adriele como responsável.'; return; }
      const updated = { ...detail, title, status: document.querySelector('#fiscal-routine-status')?.value || 'Aguardando', dueDate, due: dueDate ? formatFiscalDate(dueDate) : 'Sem data', responsible, description: document.querySelector('#fiscal-routine-description')?.value.trim() || '', notes: document.querySelector('#fiscal-routine-notes')?.value.trim() || '', checklist, attachments: [...(detail.attachments || []), ...newAttachments], updatedAt: new Date().toISOString() };
      const store = loadFiscalRoutineDetailsStore();
      store[month] ||= {};
      store[month][client.cnpj] ||= {};
      store[month][client.cnpj][actualKey] = updated;
      saveFiscalRoutineDetailsStore(store);
      recordFiscalRoutineStatus(month, client.cnpj, actualKey, updated.status);
      closeRoutine();
      renderApp();
      showToast(isNew ? 'Nova rotina fiscal criada.' : 'Detalhes da rotina salvos.');
    } catch (saveError) {
      error.textContent = 'Não foi possível ler um dos arquivos selecionados. Tente novamente.';
    }
  });
  window.addEventListener('keydown', handleEscape);
  document.querySelector('#close-fiscal-routine')?.focus();
}
