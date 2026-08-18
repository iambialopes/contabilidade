/* Corrêa Controle Interno — Renderização e eventos de interface. */

const { clients, departments, departmentsData } = window.CorreaData;
const state = window.CorreaState;
const pageContent = document.querySelector('#page-content');
const navigation = document.querySelector('#department-nav');
const pageTitle = document.querySelector('#page-title');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
const menuToggle = document.querySelector('#menu-toggle');
const menuClose = document.querySelector('#menu-close');
const mobileOverlay = document.querySelector('#mobile-overlay');

function renderApp() {
  renderPageTitle();
  navigation.innerHTML = renderNavigation(departments, state.currentPage);
  pageContent.innerHTML = getPageTemplate();
  bindNavigation();
  bindActions();
  bindClientControls();
}

function renderPageTitle() {
  if (state.currentPage === 'overview') {
    pageTitle.textContent = 'Bom dia, Ihara';
    return;
  }
  const department = departments.find((item) => item.key === state.currentPage);
  pageTitle.textContent = `Departamento ${department.label}`;
}

function getPageTemplate() {
  const selectedClient = getSelectedClient();
  const clientsSection = getClientsSection();
  const lowerPanels = renderLowerPanels(selectedClient);

  if (state.currentPage === 'overview') {
    return renderOverview({ clientsHtml: clientsSection, lowerHtml: lowerPanels });
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
  document.querySelectorAll('[data-client]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedClientCnpj = row.dataset.client;
      renderApp();
    });
  });
}

function openModal() {
  modalRoot.innerHTML = renderModal();
  document.querySelector('#close-modal').addEventListener('click', closeModal);
  document.querySelector('#cancel-modal').addEventListener('click', closeModal);
  document.querySelector('#save-modal').addEventListener('click', () => {
    closeModal();
    showToast('Ficha criada como rascunho. Conecte o banco de dados para persistir o cadastro.');
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
