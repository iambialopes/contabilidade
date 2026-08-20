/* Corrêa Controle Interno — Renderização e eventos de interface. */

const { clients, departments, departmentsData } = window.CorreaData;
const state = window.CorreaState;
const pageContent = document.querySelector('#page-content');
const navigation = document.querySelector('#department-nav');
const pageTitle = document.querySelector('#page-title');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
const customClientsStorageKey = 'correa-controle-interno-custom-clients';
const deletedClientsStorageKey = 'correa-controle-interno-deleted-clients';
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
  const clientsSection = getClientsSection();
  const lowerPanels = renderLowerPanels(selectedClient);

  if (state.currentPage === 'overview') {
    return renderOverview({
      clientsHtml: clientsSection,
      lowerHtml: lowerPanels,
      activeCount: clients.filter((client) => client.active).length,
      totalCount: clients.length
    });
  }

  return renderDepartment({
    department: departments.find((item) => item.key === state.currentPage),
    moduleData: departmentsData[state.currentPage],
    selectedClient,
    clientsHtml: clientsSection,
    lowerHtml: lowerPanels
  });
}

function getClientsSection() {
  return renderClientsSection(renderClientRows(getFilteredClients(), state.selectedClientCnpj), state.filters, clients);
}

function getFilteredClients() {
  const search = state.searchTerm.toLowerCase().trim();
  const filters = state.filters;
  return clients.filter((client) => {
    const matchesStatus = !filters.status || (filters.status === 'active' ? client.active : !client.active);
    const searchableText = `${client.name} ${client.cnpj} ${client.city}`.toLowerCase();
    return matchesStatus
      && searchableText.includes(search)
      && (!filters.city || client.city === filters.city)
      && (!filters.activity || client.activity === filters.activity)
      && (!filters.tax || client.tax === filters.tax)
      && (!filters.payroll || client.payroll === filters.payroll);
  });
}

function getSelectedClient() {
  return clients.find((client) => client.cnpj === state.selectedClientCnpj) || clients[0];
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

  document.querySelectorAll('[data-action="open-sheet"]').forEach((element) => {
    element.addEventListener('click', () => {
      const client = getSelectedClient();
      if (client) openClientSheet(client);
    });
  });
}

function bindClientControls() {
  const searchInput = document.querySelector('#client-search');
  const filterSelects = document.querySelectorAll('.client-filter');
  const clearFiltersButton = document.querySelector('#clear-client-filters');

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
    state.filters = { city: '', activity: '', tax: '', payroll: '', status: '' };
    renderApp();
  });

  bindClientRows();
}

function bindClientRows() {
  document.querySelectorAll('[data-client-open]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const client = clients.find((item) => item.cnpj === button.dataset.clientOpen);
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
      const client = clients.find((item) => item.cnpj === button.dataset.clientDelete);
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

function showToast(message) {
  toastRoot.innerHTML = `<div class="toast">${message}</div>`;
  window.setTimeout(() => { toastRoot.innerHTML = ''; }, 3200);
}

window.addEventListener('hashchange', () => {
  state.syncPageFromHash();
  renderApp();
});
