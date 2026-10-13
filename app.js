// ===== Elementos =====
const listaPokemon = document.getElementById('pokedex-lista');
const contadorEl = document.getElementById('contador');
const campoBusca = document.getElementById('searchInput');
const filtroTipo = document.getElementById('filtroTipo');
const filtroGeracao = document.getElementById('filtroGeracao');
const filtroRegiao = document.getElementById('filtroRegiao');
const botaoLimpar = document.getElementById('limparFiltros');

const quantidadePokemons = 1025;

// ===== Dados fixos =====

// Cores das etiquetas de tipo e da borda do card
const coresEtiquetas = {
  grass: '#78c850', fire: '#f08030', water: '#6890f0', bug: '#a8b820',
  normal: '#a8a878', poison: '#a040a0', electric: '#f8d030', ground: '#e0c068',
  fairy: '#ee99ac', fighting: '#c03028', psychic: '#f85888', rock: '#b8a038',
  ghost: '#705898', ice: '#98d8d8', dragon: '#7038f8'
};

// Faixa de IDs de cada geração
const geracoes = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025]
};

// Faixa de IDs de cada região
const regioes = {
  kanto: [1, 151],
  johto: [152, 251],
  hoenn: [252, 386],
  sinnoh: [387, 493],
  unova: [494, 649],
  kalos: [650, 721],
  alola: [722, 809],
  galar: [810, 905],
  paldea: [906, 1025]
};

// ===== Busca na API =====
async function buscarPokemons() {
  for (let i = 1; i <= quantidadePokemons; i++) {
    try {
      const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const pokemon = await resposta.json();
      criarCardPokemon(pokemon);
    } catch (erro) {
      console.error(`Erro ao buscar o Pokémon de ID ${i}:`, erro);
    }
  }
}

// ===== Criação do card =====
function criarCardPokemon(pokemon) {
  const card = document.createElement('div');
  card.classList.add('cartao-pokemon');

  // Tipo principal define a cor da borda
  const tipoPrincipal = pokemon.types[0].type.name;
  card.style.borderColor = coresEtiquetas[tipoPrincipal] || '#a8a878';

  // Guarda id e tipos no card para os filtros usarem
  card.dataset.id = pokemon.id;
  card.dataset.tipos = pokemon.types.map(t => t.type.name).join(' ');

  // Formata o número (1 vira #001)
  const idFormatado = String(pokemon.id).padStart(3, '0');

  // Etiquetas de tipo
  const etiquetasTiposHTML = pokemon.types.map(infoTipo => {
    const nomeTipo = infoTipo.type.name;
    const corEtiqueta = coresEtiquetas[nomeTipo] || '#a8a878';
    return `<span class="tipo" style="background-color: ${corEtiqueta}">${nomeTipo}</span>`;
  }).join('');

  const imagemUrl = pokemon.sprites.front_default;

  card.innerHTML = `
    <div class="numero">#${idFormatado}</div>
    <img src="${imagemUrl}" alt="${pokemon.name}" class="imagem-pokemon">
    <h2 class="nome-pokemon">${pokemon.name}</h2>
    <div class="tipos">
      ${etiquetasTiposHTML}
    </div>
  `;

  // Respeita os filtros ativos enquanto os cards ainda chegam
  card.hidden = !combinaComBusca(card);

  listaPokemon.appendChild(card);
  atualizarContador();
}

// ===== Contador =====
function atualizarContador() {
  const exibidos = listaPokemon.querySelectorAll('.cartao-pokemon:not([hidden])').length;
  contadorEl.textContent = `Exibindo ${exibidos} de ${quantidadePokemons}`;
}

// ===== Filtros =====

// Verifica se o id está dentro de uma faixa (sem faixa = sem filtro)
function dentroDaFaixa(id, faixa) {
  if (!faixa) return true;
  return id >= faixa[0] && id <= faixa[1];
}

// Retorna true se o card passa em todos os filtros
function combinaComBusca(card) {
  const termo = campoBusca.value.trim().toLowerCase();
  const nome = card.querySelector('.nome-pokemon').textContent.toLowerCase();
  const numero = card.querySelector('.numero').textContent;
  const combinaTexto = nome.includes(termo) || numero.includes(termo);

  const tipo = filtroTipo.value;
  const combinaTipo = !tipo || card.dataset.tipos.split(' ').includes(tipo);

  const id = Number(card.dataset.id);
  const combinaGeracao = dentroDaFaixa(id, geracoes[filtroGeracao.value]);
  const combinaRegiao = dentroDaFaixa(id, regioes[filtroRegiao.value]);

  return combinaTexto && combinaTipo && combinaGeracao && combinaRegiao;
}

// Mostra ou esconde os cards conforme os filtros
function filtrarPokemons() {
  const cards = listaPokemon.querySelectorAll('.cartao-pokemon');

  cards.forEach((card) => {
    card.hidden = !combinaComBusca(card);
  });

  atualizarContador();
}

// Volta todos os filtros ao estado inicial
function limparFiltros() {
  campoBusca.value = '';
  filtroTipo.value = '';
  filtroGeracao.value = '';
  filtroRegiao.value = '';

  filtrarPokemons();
}

// ===== Eventos =====
campoBusca.addEventListener('input', filtrarPokemons);
filtroTipo.addEventListener('change', filtrarPokemons);
filtroGeracao.addEventListener('change', filtrarPokemons);
filtroRegiao.addEventListener('change', filtrarPokemons);
botaoLimpar.addEventListener('click', limparFiltros);

// ===== Início =====
atualizarContador();
buscarPokemons();