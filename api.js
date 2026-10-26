// ====== api.js ====== //

// Quantidades e limites para busca completa na PokéAPI
export const quantidadePokemons = 1025;
export const LIMITE_ITENS = 2100;
export const LIMITE_ATAQUES = 950; 

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

export function idDaUrl(url) {
  return Number(url.split('/').filter(Boolean).pop());
}

export async function getPokemon(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
  return res.json();
}

export async function getDados(url) {
  const res = await fetch(url);
  return res.json();
}