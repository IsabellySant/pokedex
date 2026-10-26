// ====== main.js ====== //
import { 
  quantidadePokemons, 
  LIMITE_ITENS, 
  LIMITE_ATAQUES, 
  pokedexRegioes, 
  idDaUrl, 
  getPokemon, 
  getDados 
} from './api.js';

import { 
  criarCardPokemonHTML,
  criarCardItemHTML,
  criarCardAtaqueHTML, 
  preencherDetalhesUI,
  fecharDetalhesUI
} from './ui.js';

// ===== Elementos do DOM =====
const listaPokemon = document.getElementById('pokedex-lista');
const contadorEl = document.getElementById('contador');
const campoBusca = document.getElementById('searchInput');
const filtroTipo = document.getElementById('filtroTipo');
const filtroGeracao = document.getElementById('filtroGeracao');
const filtroRegiao = document.getElementById('filtroRegiao');
const botaoLimpar = document.getElementById('limparFiltros');
const abaPokemon = document.getElementById('abaPokemon');
const abaFavoritos = document.getElementById('abaFavoritos');
const abaAtaques = document.getElementById('abaAtaques');
const abaItens = document.getElementById('abaItens');
const listaAtaques = document.getElementById('lista-ataques');
const listaItens = document.getElementById('lista-itens');
const tituloLista = document.getElementById('tituloLista');
const semFavoritos = document.getElementById('semFavoritos');

// ===== Estados (Variáveis Globais) =====
export const dadosPokemons = {};
const geracoes = {}; 
const regioes = {}; 

let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
let notasPokemons = JSON.parse(localStorage.getItem('notasPokemons')) || {};
let mostrandoFavoritos = false;

function salvarFavoritos() { localStorage.setItem('favoritos', JSON.stringify(favoritos)); }
function salvarNotas() { localStorage.setItem('notasPokemons', JSON.stringify(notasPokemons)); }

// ===== Funções de Inicialização (Pokémons) =====
async function buscarPokemonsLotes() {
  const tamanhoLote = 50;
  for (let i = 1; i <= quantidadePokemons; i += tamanhoLote) {
    const promessas = [];
    for (let j = i; j < i + tamanhoLote && j <= quantidadePokemons; j++) {
      promessas.push(getPokemon(j));
    }
    try {
      const listaDePokemons = await Promise.all(promessas);
      listaDePokemons.forEach(pokemon => {
        dadosPokemons[pokemon.id] = pokemon; // Guarda para usar nos detalhes
        const ehFavorito = favoritos.includes(pokemon.id);
        const card = criarCardPokemonHTML(pokemon, ehFavorito);
        
        card.hidden = !combinaComBusca(card); // Aplica filtros imediatamente
        listaPokemon.appendChild(card);
      });
      atualizarContador();
    } catch (erro) { console.error(erro); }
  }
}

async function carregarGeracoesERegioes() {
  const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  await Promise.all(numeros.map(async (g) => {
    const dados = await getDados(`https://pokeapi.co/api/v2/generation/${g}`);
    geracoes[g] = new Set(dados.pokemon_species.map(e => idDaUrl(e.url)));
  }));

  const nomesRegioes = Object.keys(pokedexRegioes);
  await Promise.all(nomesRegioes.map(async (regiao) => {
    const ids = new Set();
    await Promise.all(pokedexRegioes[regiao].map(async (nomePokedex) => {
      const dados = await getDados(`https://pokeapi.co/api/v2/pokedex/${nomePokedex}`);
      dados.pokemon_entries.forEach(e => ids.add(idDaUrl(e.pokemon_species.url)));
    }));
    regioes[regiao] = ids;
  }));
}

// ===== Funções de Filtros =====
function atualizarContador() {
  const exibidos = listaPokemon.querySelectorAll('.cartao-pokemon:not([hidden])').length;
  contadorEl.textContent = `Exibindo ${exibidos} de ${quantidadePokemons}`;
}

function pertence(id, conjuntos, valor) {
  if (!valor) return true;
  const conjunto = conjuntos[valor];
  if (!conjunto) return true;
  return conjunto.has(id);
}

function combinaComBusca(card) {
  const termo = campoBusca.value.trim().toLowerCase();
  const combinaTexto = card.querySelector('.nome-pokemon').textContent.toLowerCase().includes(termo) || card.querySelector('.numero').textContent.includes(termo);
  const combinaTipo = !filtroTipo.value || card.dataset.tipos.split(' ').includes(filtroTipo.value);
  const id = Number(card.dataset.id);
  const combinaGeracao = pertence(id, geracoes, filtroGeracao.value);
  const combinaRegiao = pertence(id, regioes, filtroRegiao.value);
  const combinaFavorito = !mostrandoFavoritos || favoritos.includes(id);

  return combinaTexto && combinaTipo && combinaGeracao && combinaRegiao && combinaFavorito;
}

function filtrarPokemons() {
  listaPokemon.querySelectorAll('.cartao-pokemon').forEach(card => {
    card.hidden = !combinaComBusca(card);
  });
  semFavoritos.hidden = !(mostrandoFavoritos && favoritos.length === 0);
  atualizarContador();
}

function limparFiltros() {
  campoBusca.value = '';
  filtroTipo.value = '';
  filtroGeracao.value = '';
  filtroRegiao.value = '';
  filtrarPokemons();
}

// ===== Lógica da Barra Lateral =====
function abrirDetalhes(id, card) {
  const pokemon = dadosPokemons[id];
  if (!pokemon) return;

  listaPokemon.querySelectorAll('.ativo').forEach(c => c.classList.remove('ativo'));
  card.classList.add('ativo');

  // Lógica enviada para o arquivo UI
  const notaAtual = notasPokemons[id];
  const callbackSalvarNota = (idPokemon, texto) => {
    notasPokemons[idPokemon] = texto;
    salvarNotas();
  };

  preencherDetalhesUI(pokemon, notaAtual, callbackSalvarNota);
}

function fecharDetalhes() {
  fecharDetalhesUI();
  listaPokemon.querySelectorAll('.ativo').forEach(c => c.classList.remove('ativo'));
}

// ===== Lógica dos Favoritos =====
function alternarFavorito(id, botao) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(f => f !== id);
  } else {
    favoritos.push(id);
  }
  salvarFavoritos();
  
  const favoritado = favoritos.includes(id);
  botao.classList.toggle('favoritado', favoritado);
  botao.setAttribute('aria-pressed', favoritado);
  if (mostrandoFavoritos) filtrarPokemons();
}

// ===== Lógica de Abas, Itens e Ataques =====
function mudarAba(aba) {
  listaPokemon.hidden = true;
  listaAtaques.hidden = true;
  listaItens.hidden = true;
  semFavoritos.hidden = true;

  abaPokemon.classList.remove('ativo');
  abaFavoritos.classList.remove('ativo');
  abaAtaques.classList.remove('ativo');
  abaItens.classList.remove('ativo');

  if (aba === 'pokemon') {
    mostrandoFavoritos = false;
    abaPokemon.classList.add('ativo');
    listaPokemon.hidden = false;
    tituloLista.textContent = 'Todos os pokémons';
    filtrarPokemons();
  } else if (aba === 'favoritos') {
    mostrandoFavoritos = true;
    abaFavoritos.classList.add('ativo');
    listaPokemon.hidden = false;
    tituloLista.textContent = 'Favoritos';
    filtrarPokemons();
  } else if (aba === 'ataques') {
    abaAtaques.classList.add('ativo');
    listaAtaques.hidden = false;
    tituloLista.textContent = 'Ataques';
    contadorEl.textContent = '';
    if (listaAtaques.innerHTML === '') buscarAtaques();
  } else if (aba === 'itens') {
    abaItens.classList.add('ativo');
    listaItens.hidden = false;
    tituloLista.textContent = 'Itens';
    contadorEl.textContent = '';
    if (listaItens.innerHTML === '') buscarItens();
  }
}

async function buscarItens() {
  listaItens.innerHTML = '<p>Carregando itens...</p>';
  try {
    const data = await getDados(`https://pokeapi.co/api/v2/item?limit=${LIMITE_ITENS}`);
    listaItens.innerHTML = '';
    
    data.results.forEach(async (item) => {
      const info = await getDados(item.url);
      listaItens.appendChild(criarCardItemHTML(info));
    });
  } catch (e) { console.error("Erro nos itens:", e); }
}

// Busca todos os ataques na primeira visita à aba
async function buscarAtaques() {
  listaAtaques.innerHTML = '<p>Carregando ataques...</p>';
  try {
    const data = await getDados(`https://pokeapi.co/api/v2/move?limit=${LIMITE_ATAQUES}`);
    listaAtaques.innerHTML = '';
    
    data.results.forEach(async (ataque) => {
      const info = await getDados(ataque.url);
      listaAtaques.appendChild(criarCardAtaqueHTML(info));
    });
  } catch (e) { console.error("Erro nos ataques:", e); }
}

// ===== Event Listeners =====
campoBusca.addEventListener('input', filtrarPokemons);
filtroTipo.addEventListener('change', filtrarPokemons);
filtroGeracao.addEventListener('change', filtrarPokemons);
filtroRegiao.addEventListener('change', filtrarPokemons);
botaoLimpar.addEventListener('click', limparFiltros);
document.getElementById('detalhesFechar').addEventListener('click', fecharDetalhes);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharDetalhes(); });

abaPokemon.addEventListener('click', () => mudarAba('pokemon'));
abaFavoritos.addEventListener('click', () => mudarAba('favoritos'));
abaAtaques.addEventListener('click', () => mudarAba('ataques'));
abaItens.addEventListener('click', () => mudarAba('itens'));

listaPokemon.addEventListener('click', (e) => {
  const coracao = e.target.closest('.botao-favorito');
  if (coracao) {
    const id = Number(coracao.closest('.cartao-pokemon').dataset.id);
    alternarFavorito(id, coracao);
    return;
  }
  const card = e.target.closest('.cartao-pokemon');
  if (card) abrirDetalhes(card.dataset.id, card);
});

// ===== Início =====
async function iniciar() {
  atualizarContador();
  buscarPokemonsLotes();
  await carregarGeracoesERegioes();
  filtrarPokemons();
}

iniciar();