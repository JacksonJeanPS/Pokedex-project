const BASE_URL = 'https://pokeapi.co/api/v2';

function getPokemonUrl(idOrName) {
  return `${BASE_URL}/pokemon/${idOrName}`;
}

function getPokemonSpeciesUrl(idOrName) {
  return `${BASE_URL}/pokemon-species/${idOrName}`;
}

function getPokemonListUrl(limit, offset) {
  return `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
}

function getPokemonTypeUrl(type) {
  return `${BASE_URL}/type/${type}`;
}

function getEvolutionChainUrl(url) {
  return url;
}

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pokémon não encontrado');
      }
      if (response.status === 429) {
        throw new Error('Limite de requisições da API atingido. Tente novamente em alguns segundos.');
      }
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Tempo de conexão excedido. Verifique sua internet.');
    }
    throw error;
  }
}

export async function getPokemon(idOrName) {
  const data = await fetchWithTimeout(getPokemonUrl(idOrName));
  return {
    id: data.id,
    name: data.name,
    types: data.types.map(t => t.type.name),
    stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
    abilities: data.abilities.map(a => a.ability.name),
    sprite: data.sprites.other.dream_world.front_default || data.sprites.front_default,
    spriteFront: data.sprites.front_default,
    spriteBack: data.sprites.back_default,
    height: data.height,
    weight: data.weight,
  };
}

export async function getPokemonList(limit = 20, offset = 0) {
  const data = await fetchWithTimeout(getPokemonListUrl(limit, offset));
  return {
    results: data.results,
    count: data.count,
    next: data.next,
    previous: data.previous,
  };
}

export async function getPokemonDetailsFromList(listItem) {
  const data = await fetchWithTimeout(listItem.url);
  return {
    id: data.id,
    name: data.name,
    types: data.types.map(t => t.type.name),
    stats: data.stats.map(s => ({ name: s.stat.name, value: s.base_stat })),
    abilities: data.abilities.map(a => a.ability.name),
    sprite: data.sprites.other.dream_world.front_default || data.sprites.front_default,
    spriteFront: data.sprites.front_default,
    spriteBack: data.sprites.back_default,
    height: data.height,
    weight: data.weight,
  };
}

export async function getPokemonByType(type) {
  const data = await fetchWithTimeout(getPokemonTypeUrl(type));
  return data.pokemon.map(p => ({
    name: p.pokemon.name,
    url: p.pokemon.url,
    slot: p.slot,
  }));
}

export async function getPokemonSpecies(idOrName) {
  const data = await fetchWithTimeout(getPokemonSpeciesUrl(idOrName));
  return {
    evolutionChainUrl: data.evolution_chain.url,
    captures: data.capture_rate,
    growthRate: data.growth_rate.name,
    habitat: data.habitat ? data.habitat.name : null,
    isLegendary: data.is_legendary,
    isMythical: data.is_mythical,
  };
}

export async function getEvolutionChain(url) {
  const data = await fetchWithTimeout(getEvolutionChainUrl(url));
  return data;
}

export function extractEvolutionChain(chainData) {
  const chain = [];
  function traverse(node) {
    chain.push(node.species.name);
    if (node.evolves_to && node.evolves_to.length > 0) {
      node.evolves_to.forEach(traverse);
    }
  }
  traverse(chainData.chain);
  return chain;
}

export function normalizeSearchQuery(query) {
  return query.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

export function isNumeric(str) {
  return /^\d+$/.test(str);
}