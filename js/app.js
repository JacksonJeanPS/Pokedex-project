import {
  getPokemon,
  getPokemonList,
  getPokemonDetailsFromList,
  getPokemonByType,
  getPokemonSpecies,
  getEvolutionChain,
  normalizeSearchQuery,
  isNumeric,
} from './services/pokeApiService.js';

import {
  renderPokemonList,
  renderLoading,
  renderError,
  renderEmpty,
  clearContainer,
} from './ui/renderCards.js';

import {
  renderPokemonModal,
  closeModal,
} from './ui/renderModal.js';

const POKEMON_PER_PAGE = 20;
const DEBOUNCE_DELAY = 350;

const state = {
  pokemons: [],
  offset: 0,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  currentQuery: '',
  currentType: null,
  favorites: new Set(),
  isShowingFavorites: false,
};

const dom = {
  pokedex: null,
  searchInput: null,
  searchBtn: null,
  loadMoreBtn: null,
  loadingEl: null,
  errorEl: null,
  emptyState: null,
  modal: null,
  modalBody: null,
  typeFilters: null,
  favoritesBtn: null,
};

function initDom() {
  dom.pokedex = document.querySelector('[data-js="pokedex"]');
  dom.searchInput = document.getElementById('searchInput');
  dom.searchBtn = document.getElementById('searchBtn');
  dom.loadMoreBtn = document.getElementById('loadMoreBtn');
  dom.loadingEl = document.getElementById('loading');
  dom.errorEl = document.getElementById('error');
  dom.emptyState = document.getElementById('emptyState');
  dom.modal = document.getElementById('modal');
  dom.modalBody = document.getElementById('modalBody');
  dom.typeFilters = document.getElementById('typeFilters');
  dom.favoritesBtn = document.getElementById('favoritesBtn');
}

function loadFavorites() {
  try {
    const stored = localStorage.getItem('pokedex-favorites');
    if (stored) {
      const parsed = JSON.parse(stored);
      state.favorites = new Set(parsed);
    }
  } catch (e) {
    state.favorites = new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('pokedex-favorites', JSON.stringify([...state.favorites]));
  } catch (e) {
    // localStorage not available
  }
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  saveFavorites();
}

function isFavorite(id) {
  return state.favorites.has(id);
}

function showLoading() {
  dom.loadingEl.classList.remove('hidden');
}

function hideLoading() {
  dom.loadingEl.classList.add('hidden');
}

function showError(message) {
  dom.errorEl.textContent = message;
  dom.errorEl.classList.remove('hidden');
  dom.errorEl.setAttribute('role', 'alert');
}

function hideError() {
  dom.errorEl.classList.add('hidden');
}

function showEmpty() {
  dom.emptyState.classList.remove('hidden');
}

function hideEmpty() {
  dom.emptyState.classList.add('hidden');
}

function hideAllStatus() {
  hideLoading();
  hideError();
  hideEmpty();
}

async function fetchAndRenderPokemon(idOrName) {
  hideAllStatus();
  showLoading();
  try {
    const pokemon = await getPokemon(idOrName);
    hideAllStatus();
    state.pokemons = [pokemon];
    state.hasMore = false;
    dom.loadMoreBtn.classList.add('hidden');
    renderPokemonList(state.pokemons, dom.pokedex, handleFavoriteToggle, handleCardClick);
  } catch (error) {
    hideAllStatus();
    showError(error.message || 'Erro desconhecido ao carregar Pokémon.');
  } finally {
    hideLoading();
  }
}

async function loadInitialPokemons() {
  hideAllStatus();
  showLoading();
  state.offset = 0;
  state.pokemons = [];
  state.hasMore = true;
  state.currentQuery = '';
  state.currentType = null;
  dom.loadMoreBtn.classList.remove('hidden');

  try {
    const listData = await getPokemonList(POKEMON_PER_PAGE, 0);
    const details = await Promise.all(
      listData.results.map(item => getPokemonDetailsFromList(item))
    );
    state.pokemons = details;
    state.offset = POKEMON_PER_PAGE;
    state.hasMore = !!listData.next;
    if (!state.hasMore || state.pokemons.length >= listData.count) {
      dom.loadMoreBtn.classList.add('hidden');
    }
    hideAllStatus();
    renderPokemonList(state.pokemons, dom.pokedex, handleFavoriteToggle, handleCardClick);
  } catch (error) {
    hideAllStatus();
    showError(error.message || 'Erro ao carregar a lista de Pokémon.');
  } finally {
    hideLoading();
  }
}

async function loadMorePokemons() {
  if (state.isLoadingMore || !state.hasMore) return;
  state.isLoadingMore = true;
  dom.loadMoreBtn.disabled = true;
  dom.loadMoreBtn.textContent = 'Carregando...';

  try {
    const listData = await getPokemonList(POKEMON_PER_PAGE, state.offset);
    const details = await Promise.all(
      listData.results.map(item => getPokemonDetailsFromList(item))
    );
    state.pokemons = [...state.pokemons, ...details];
    state.offset += POKEMON_PER_PAGE;
    state.hasMore = !!listData.next;
    if (!state.hasMore) {
      dom.loadMoreBtn.classList.add('hidden');
    } else {
      dom.loadMoreBtn.classList.remove('hidden');
    }
    dom.loadMoreBtn.disabled = false;
    dom.loadMoreBtn.textContent = 'Carregar Mais';
    renderPokemonList(state.pokemons, dom.pokedex, handleFavoriteToggle, handleCardClick);
  } catch (error) {
    dom.loadMoreBtn.disabled = false;
    dom.loadMoreBtn.textContent = 'Carregar Mais';
    showError(error.message || 'Erro ao carregar mais Pokémon.');
  } finally {
    state.isLoadingMore = false;
  }
}

async function filterByType(type) {
  hideAllStatus();
  showLoading();
  state.currentType = type;
  state.currentQuery = '';
  dom.loadMoreBtn.classList.add('hidden');

  try {
    const typePokemons = await getPokemonByType(type);
    const details = await Promise.all(
      typePokemons.map(item => getPokemon(item.name))
    );
    state.pokemons = details;
    state.hasMore = false;
    hideAllStatus();
    renderPokemonList(state.pokemons, dom.pokedex, handleFavoriteToggle, handleCardClick);
  } catch (error) {
    hideAllStatus();
    showError(error.message || 'Erro ao filtrar por tipo.');
  } finally {
    hideLoading();
  }
}

function handleSearch(query) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    loadInitialPokemons();
    return;
  }
  state.currentQuery = normalized;
  state.currentType = null;
  state.isShowingFavorites = false;
  dom.loadMoreBtn.classList.add('hidden');
  fetchAndRenderPokemon(normalized);
}

const debouncedSearch = debounce((query) => {
  handleSearch(query);
}, DEBOUNCE_DELAY);

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function handleFavoriteToggle(e) {
  const btn = e.target.closest('.favorite-btn');
  if (!btn) return;
  e.stopPropagation();
  const id = parseInt(btn.dataset.pokemonId, 10);
  toggleFavorite(id);
  const pokemon = state.pokemons.find(p => p.id === id);
  if (pokemon) {
    pokemon._isFavorite = isFavorite(id);
    renderPokemonList(state.pokemons, dom.pokedex, handleFavoriteToggle, handleCardClick);
  }
}

function handleCardClick(e) {
  const card = e.target.closest('.card');
  if (!card || e.target.closest('.favorite-btn')) return;
  const id = parseInt(card.dataset.pokemonId, 10);
  openPokemonModal(id);
}

async function openPokemonModal(id) {
  try {
    const pokemon = await getPokemon(id);
    let speciesData = null;
    let evolutionChain = null;
    try {
      speciesData = await getPokemonSpecies(id);
      const chainData = await getEvolutionChain(speciesData.evolutionChainUrl);
      evolutionChain = chainData;
    } catch (e) {
      // Evolution data is optional
    }
    dom.modalBody.innerHTML = renderPokemonModal(pokemon, speciesData, evolutionChain, closeModal);
    dom.modal.classList.remove('hidden');
    dom.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = dom.modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.focus();
    }
  } catch (error) {
    dom.modalBody.innerHTML = `
      <div class="modal-detail">
        <p class="error-message">Erro ao carregar detalhes: ${error.message}</p>
      </div>
    `;
    dom.modal.classList.remove('hidden');
    dom.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function setupEventListeners() {
  dom.searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.trim() === '') {
      loadInitialPokemons();
      return;
    }
    debouncedSearch(query);
  });

  dom.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = dom.searchInput.value;
      if (query.trim() !== '') {
        handleSearch(query);
      }
    }
  });

  dom.searchBtn.addEventListener('click', () => {
    const query = dom.searchInput.value;
    if (query.trim() !== '') {
      handleSearch(query);
    } else {
      loadInitialPokemons();
    }
  });

  dom.loadMoreBtn.addEventListener('click', loadMorePokemons);

  dom.favoritesBtn.addEventListener('click', () => {
    state.isShowingFavorites = !state.isShowingFavorites;
    dom.favoritesBtn.setAttribute('aria-pressed', state.isShowingFavorites);
    if (state.isShowingFavorites) {
      const favorites = state.pokemons.filter(p => isFavorite(p.id));
      if (favorites.length === 0) {
        clearContainer(dom.pokedex);
        showEmpty();
      } else {
        hideEmpty();
        renderPokemonList(favorites, dom.pokedex, handleFavoriteToggle, handleCardClick);
      }
    } else {
      loadInitialPokemons();
    }
  });

  dom.modal.addEventListener('click', (e) => {
    if (e.target === dom.modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dom.modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  dom.pokedex.addEventListener('click', (e) => {
    const favoriteBtn = e.target.closest('.favorite-btn');
    if (favoriteBtn) {
      handleFavoriteToggle(e);
      return;
    }
    const card = e.target.closest('.card');
    if (card) {
      handleCardClick(e);
    }
  });

  dom.pokedex.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.card');
      if (card && !e.target.closest('.favorite-btn')) {
        e.preventDefault();
        const id = parseInt(card.dataset.pokemonId, 10);
        openPokemonModal(id);
      }
    }
  });
}

function renderTypeFilters() {
  const types = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
    'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
    'dragon', 'dark', 'steel', 'fairy',
  ];
  const buttons = types.map(type => `
    <button class="type-filter-btn type-${type}" data-type="${type}" aria-label="Filtrar por tipo ${type}">${type}</button>
  `).join('');
  dom.typeFilters.innerHTML = `
    <button class="type-filter-btn active" data-type="all" aria-label="Mostrar todos os Pokémon">Todos</button>
    ${buttons}
  `;

  dom.typeFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.type-filter-btn');
    if (!btn) return;
    const type = btn.dataset.type;
    document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (type === 'all') {
      state.currentType = null;
      loadInitialPokemons();
    } else {
      filterByType(type);
    }
  });
}

async function init() {
  initDom();
  loadFavorites();
  renderTypeFilters();
  setupEventListeners();
  await loadInitialPokemons();
}

init();