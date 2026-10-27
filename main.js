// ====== main.js ====== //
import {
  quantidadePokemons,
  limiteItens,
  limiteAtaques,
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
const listaAtaques = document.getElementById('lista-ataques');
const listaItens = document.getElementById('lista-itens');
const contadorEl = document.getElementById('contador');
const campoBusca = document.getElementById('searchInput');
const filtroTipo = document.getElementById('filtroTipo');
const filtroGeracao = document.getElementById('filtroGeracao');
const filtroRegiao = document.getElementById('filtroRegiao');
const botaoLimpar = document.getElementById('limparFiltros');
const tituloLista = document.getElementById('tituloLista');
const semFavoritos = document.getElementById('semFavoritos');

// ===== Estados =====
export const dadosPokemons = {};
const geracoes = {};
const regioes = {};
const tamanhoLote = 50;

let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
let notasPokemons = JSON.parse(localStorage.getItem('notasPokemons')) || {};
let mostrandoFavoritos = false;
let abaAtual = 'pokemon';

function salvarFavoritos() { localStorage.setItem('favoritos', JSON.stringify(favoritos)); }
function salvarNotas() { localStorage.setItem('notasPokemons', JSON.stringify(notasPokemons)); }

// ===== Configuração das abas =====
// Para criar uma aba nova, basta adicionar uma linha aqui e adicionar o botao no html
// Abas com "url" carregam uma lista da API na primeira vez que são abertas.
const abas = {
  pokemon: {
    botao: document.getElementById('abaPokemon'),
    lista: listaPokemon,
    titulo: 'Todos os pokémons'
  },
  favoritos: {
    botao: document.getElementById('abaFavoritos'),
    lista: listaPokemon,
    titulo: 'Favoritos'
  },
  ataques: {
    botao: document.getElementById('abaAtaques'),
    lista: listaAtaques,
    titulo: 'Ataques',
    nome: 'ataques',
    url: `https://pokeapi.co/api/v2/move?limit=${limiteAtaques}`,
    criarCard: criarCardAtaqueHTML,
    carregado: false
  },
  itens: {
    botao: document.getElementById('abaItens'),
    lista: listaItens,
    titulo: 'Itens',
    nome: 'itens',
    url: `https://pokeapi.co/api/v2/item?limit=${limiteItens}`,
    criarCard: criarCardItemHTML,
    carregado: false
  }
};

// ===== Carregamento inicial dos Pokémons =====
async function buscarPokemonsLotes() {
  for (let i = 1; i <= quantidadePokemons; i += tamanhoLote) {
    const promessas = [];
    for (let j = i; j < i + tamanhoLote && j <= quantidadePokemons; j++) {
      promessas.push(getPokemon(j));
    }

    try {
      const listaDePokemons = await Promise.all(promessas);
      listaDePokemons.forEach(pokemon => {
        dadosPokemons[pokemon.id] = pokemon;
        const ehFavorito = favoritos.includes(pokemon.id);
        const card = criarCardPokemonHTML(pokemon, ehFavorito);

        card.hidden = !combinaComBusca(card);
        listaPokemon.appendChild(card);
      });
      atualizarContador();
    } catch (erro) {
      console.error(erro);
    }
  }
}

async function carregarGeracoesERegioes() {
  const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  await Promise.all(numeros.map(async (g) => {
    const dados = await getDados(`https://pokeapi.co/api/v2/generation/${g}`);
    geracoes[g] = new Set(dados.pokemon_species.map(e => idDaUrl(e.url)));
  }));

  await Promise.all(Object.keys(pokedexRegioes).map(async (regiao) => {
    const ids = new Set();
    await Promise.all(pokedexRegioes[regiao].map(async (nomePokedex) => {
      const dados = await getDados(`https://pokeapi.co/api/v2/pokedex/${nomePokedex}`);
      dados.pokemon_entries.forEach(e => ids.add(idDaUrl(e.pokemon_species.url)));
    }));
    regioes[regiao] = ids;
  }));
}

// ===== Filtros =====
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
  const combinaTexto =
    card.querySelector('.nome-pokemon').textContent.toLowerCase().includes(termo) ||
    card.querySelector('.numero').textContent.includes(termo);
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

// Busca simples por texto, usada nas listas de ataques e itens.
function filtrarPorTexto(lista) {
  const termo = campoBusca.value.trim().toLowerCase();
  [...lista.children].forEach(card => {
    if (card.tagName === 'P') return; // mensagens de "carregando" / "erro"
    card.hidden = !card.textContent.toLowerCase().includes(termo);
  });
}

// Decide qual filtro usar conforme a aba aberta
function aplicarFiltros() {
  const aba = abas[abaAtual];
  if (aba.url) {
    filtrarPorTexto(aba.lista);
  } else {
    filtrarPokemons();
  }
}

function limparFiltros() {
  campoBusca.value = '';
  filtroTipo.value = '';
  filtroGeracao.value = '';
  filtroRegiao.value = '';
  aplicarFiltros();
}

// ===== Painel de detalhes =====
function abrirDetalhes(id, card) {
  const pokemon = dadosPokemons[id];
  if (!pokemon) return;

  listaPokemon.querySelectorAll('.ativo').forEach(c => c.classList.remove('ativo'));
  card.classList.add('ativo');

  const callbackSalvarNota = (idPokemon, texto) => {
    notasPokemons[idPokemon] = texto;
    salvarNotas();
  };

  preencherDetalhesUI(pokemon, notasPokemons[id], callbackSalvarNota);
}

function fecharDetalhes() {
  fecharDetalhesUI();
  listaPokemon.querySelectorAll('.ativo').forEach(c => c.classList.remove('ativo'));
}

// ===== Favoritos =====
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

// ===== Abas =====
function mudarAba(nome) {
  abaAtual = nome;

  // Esconde todas as listas e desmarca todos os botões
  Object.values(abas).forEach(({ botao, lista }) => {
    botao.classList.remove('ativo');
    lista.hidden = true;
  });

  // Mostra a aba escolhida
  const aba = abas[nome];
  aba.botao.classList.add('ativo');
  aba.lista.hidden = false;
  tituloLista.textContent = aba.titulo;

  mostrandoFavoritos = nome === 'favoritos';
  semFavoritos.hidden = true;

  if (aba.url) {
    // Aba de ataques ou itens
    contadorEl.textContent = '';
    if (!aba.carregado) {
      carregarLista(aba);
    } else {
      filtrarPorTexto(aba.lista);
    }
  } else {
    // Aba de Pokémons ou Favoritos
    filtrarPokemons();
  }
}

// Carrega uma lista da API (ataques ou itens) em lotes de 50
async function carregarLista(aba) {
  const { lista, url, criarCard, nome } = aba;

  aba.carregado = true;
  lista.innerHTML = `<p>Carregando ${nome}...</p>`;

  try {
    const { results } = await getDados(url);
    lista.innerHTML = '';

    for (let i = 0; i < results.length; i += tamanhoLote) {
      const lote = results.slice(i, i + tamanhoLote);

      try {
        const dados = await Promise.all(lote.map(r => getDados(r.url)));
        dados.forEach(info => lista.appendChild(criarCard(info)));
        filtrarPorTexto(lista); // respeita o que já foi digitado na busca
      } catch (erroLote) {
        console.error(`Erro ao carregar lote de ${nome} (${i} a ${i + tamanhoLote}):`, erroLote);
      }
    }
  } catch (erro) {
    console.error(`Erro geral em ${nome}:`, erro);
    lista.innerHTML = `<p>Erro ao carregar ${nome}.</p>`;
    aba.carregado = false; // permite tentar de novo ao clicar na aba
  }
}

// ===== Event Listeners =====
campoBusca.addEventListener('input', aplicarFiltros);
filtroTipo.addEventListener('change', aplicarFiltros);
filtroGeracao.addEventListener('change', aplicarFiltros);
filtroRegiao.addEventListener('change', aplicarFiltros);
botaoLimpar.addEventListener('click', limparFiltros);
document.getElementById('detalhesFechar').addEventListener('click', fecharDetalhes);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharDetalhes(); });

// Um listener para cada aba, criado a partir da tabela
Object.keys(abas).forEach(nome => {
  abas[nome].botao.addEventListener('click', () => mudarAba(nome));
});

// Clique na lista de Pokémons (delegação de eventos)
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
  buscarPokemonsLotes(); // roda em paralelo, sem await

  try {
    await carregarGeracoesERegioes();
  } catch (erro) {
    console.error('Erro ao carregar gerações e regiões:', erro);
  }

  filtrarPokemons();
}

iniciar();