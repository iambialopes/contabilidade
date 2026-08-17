/* Corrêa Controle Interno — Estado simples da aplicação. */
window.CorreaState = {
  currentPage: getPageFromHash(),
  selectedClientCnpj: '12.345.678/0001-90',
  activeOnly: true,
  searchTerm: ''
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
