export function renderPokemonModal(pokemon, speciesData, evolutionChain, onClose) {
  const typeBadges = pokemon.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');
  const statsBars = pokemon.stats.map(s => {
    const percentage = Math.min((s.value / 255) * 100, 100);
    return `
      <div class="stat-row">
        <span class="stat-name">${s.name}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width: ${percentage}%" data-type="${s.name}"></div>
        </div>
        <span class="stat-value">${s.value}</span>
      </div>
    `;
  }).join('');

  const abilitiesList = pokemon.abilities.map(a => `<li>${a}</li>`).join('');
  const evolutionHtml = renderEvolutionChain(evolutionChain);

  return `
    <div class="modal-detail">
      <div class="modal-header">
        <span class="modal-id">#${String(pokemon.id).padStart(3, '0')}</span>
        <h2 class="modal-name">${pokemon.name}</h2>
        <div class="modal-types">${typeBadges}</div>
      </div>
      <div class="modal-body">
        <div class="modal-sprites">
          <img src="${pokemon.spriteFront || pokemon.sprite}" alt="Sprite frontal de ${pokemon.name}">
          <img src="${pokemon.spriteBack || pokemon.sprite}" alt="Sprite costas de ${pokemon.name}">
        </div>
        <div class="modal-info">
          <div class="modal-info-item">
            <span class="info-label">Altura</span>
            <span class="info-value">${(pokemon.height / 10).toFixed(1)} m</span>
          </div>
          <div class="modal-info-item">
            <span class="info-label">Peso</span>
            <span class="info-value">${(pokemon.weight / 10).toFixed(1)} kg</span>
          </div>
          ${speciesData ? `
          <div class="modal-info-item">
            <span class="info-label">Taxa de captura</span>
            <span class="info-value">${speciesData.captures}</span>
          </div>
          <div class="modal-info-item">
            <span class="info-label">Crescimento</span>
            <span class="info-value">${speciesData.growthRate}</span>
          </div>
          ${speciesData.isLegendary ? '<div class="modal-info-item"><span class="info-label">Lendário</span><span class="info-value">⭐</span></div>' : ''}
          ` : ''}
        </div>
      </div>
      <div class="modal-stats">
        <h3>Stats</h3>
        ${statsBars}
      </div>
      <div class="modal-abilities">
        <h3>Habilidades</h3>
        <ul>${abilitiesList}</ul>
      </div>
      ${evolutionHtml ? `
      <div class="modal-evolution">
        <h3>Evolução</h3>
        <div class="evolution-chain">${evolutionHtml}</div>
      </div>
      ` : ''}
    </div>
  `;
}

function renderEvolutionChain(chainData) {
  if (!chainData) return '';
  const names = extractEvolutionNames(chainData.chain);
  if (names.length <= 1) return '';
  return names.map(name => `
    <span class="evolution-stage">${name}</span>
  `).join(' <span class="evolution-arrow">→</span> ');
}

function extractEvolutionNames(chain) {
  const names = [];
  function traverse(node) {
    names.push(node.species.name);
    if (node.evolves_to && node.evolves_to.length > 0) {
      node.evolves_to.forEach(traverse);
    }
  }
  traverse(chain);
  return names;
}

export function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}