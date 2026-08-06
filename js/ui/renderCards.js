export function renderPokemonCard(pokemon, isFavorite, onToggleFavorite, onClick) {
  const typeBadges = pokemon.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');
  const heartClass = isFavorite ? 'favorite-btn active' : 'favorite-btn';
  const heartSymbol = isFavorite ? '★' : '☆';

  return `
    <li class="card" role="listitem" tabindex="0" data-pokemon-id="${pokemon.id}" aria-label="${pokemon.name} - Pokémon número ${pokemon.id}">
      <button class="${heartClass}" data-pokemon-id="${pokemon.id}" aria-label="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} ${pokemon.name}" aria-pressed="${isFavorite}">${heartSymbol}</button>
      <img class="card-image" src="${pokemon.sprite}" alt="Sprite de ${pokemon.name}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png'">
      <h2 class="card-title">${pokemon.id}. ${pokemon.name}</h2>
      <div class="card-types">${typeBadges}</div>
    </li>
  `;
}

export function renderPokemonList(pokemons, container, onToggleFavorite, onClick) {
  if (!pokemons || pokemons.length === 0) {
    container.innerHTML = '';
    return;
  }
  const html = pokemons.map(p => renderPokemonCard(p, p._isFavorite, onToggleFavorite, onClick)).join('');
  container.innerHTML = html;
}

export function renderLoading(container) {
  const skeletons = Array(12).fill('').map(() => `
    <li class="card skeleton" aria-hidden="true">
      <div class="skeleton-image"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-subtitle"></div>
    </li>
  `).join('');
  container.innerHTML = skeletons;
}

export function renderError(container, message) {
  container.innerHTML = `
    <li class="card error-card" role="alert">
      <span class="error-icon">⚠️</span>
      <p class="error-message">${message}</p>
    </li>
  `;
}

export function renderEmpty(container) {
  container.innerHTML = `
    <li class="card empty-card">
      <p>Nenhum Pokémon encontrado.</p>
    </li>
  `;
}

export function clearContainer(container) {
  container.innerHTML = '';
}