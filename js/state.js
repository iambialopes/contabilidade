/* Corrêa Controle Interno — Estado simples da aplicação. */
window.CorreaState = {
  currentPage: getPageFromHash(),
  selectedClientCnpj: '42.910.621/0001-52',
  fiscalSelectedClientCnpj: '',
  selectedMonth: 'AGOSTO 26',
  activeOnly: true,
  clientListExpanded: false,
  searchTerm: '',
  filters: {
    city: '',
    activity: '',
    tax: '',
    payroll: '',
    fiscalClosing: '',
    status: 'active'
  },
  fiscalFilters: { search: '', status: '', tax: '', city: '', obligation: '' }
};

function getPageFromHash() {
  const page = window.location.hash.replace('#/', '');
  return ['fiscal', 'pessoal', 'contabil', 'societario'].includes(page) ? page : 'overview';
}

window.CorreaState.setPage = function setPage(page) {
  window.CorreaState.currentPage = page;
  window.location.hash = page === 'overview' ? '' : `/${page}`;
};

window.CorreaState.syncPageFromHash = function syncPageFromHash() {
  window.CorreaState.currentPage = getPageFromHash();
};
