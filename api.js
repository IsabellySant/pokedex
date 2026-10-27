// ====== api.js ====== //

// Quantidades e limites para busca completa na PokéAPI
export const quantidadePokemons = 1025;
export const limiteItens = 2100;
export const limiteAtaques = 950;

export const pokedexRegioes = {
  kanto:  ['kanto'],
  johto:  ['original-johto'],
  hoenn:  ['hoenn'],
  sinnoh: ['original-sinnoh'],
  unova:  ['original-unova'],
  kalos:  ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
  alola:  ['updated-alola'],
  galar:  ['galar'],
  paldea: ['paldea']
};

// Extrai o número do final de uma URL da API
// Ex.: ".../pokemon-species/25/" -> 25
export function idDaUrl(url) {
  return Number(url.split('/').filter(Boolean).pop());
}

// Cache: guarda as respostas já buscadas para não repetir requisições
const cache = {};

export async function getDados(url) {
  if (cache[url]) return cache[url];

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao buscar ${url}`);

  cache[url] = await res.json();
  return cache[url];
}

export function getPokemon(id) {
  return getDados(`https://pokeapi.co/api/v2/pokemon/${id}`);
}