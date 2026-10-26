// ====== ui.js ====== //
import { idDaUrl, getDados } from './api.js';

// CONFIGURAÇÕES E TABELAS DE TRADUÇÃO

export const coresEtiquetas = {
  grass: '#78c850', fire: '#f08030', water: '#6890f0', bug: '#a8b820',
  normal: '#a8a878', poison: '#a040a0', electric: '#f8d030', ground: '#e0c068',
  fairy: '#ee99ac', fighting: '#c03028', psychic: '#f85888', rock: '#b8a038',
  ghost: '#705898', ice: '#98d8d8', dragon: '#7038f8'
};

const nomesStatus = {
  'hp': 'HP', 
  'attack': 'Ataque', 
  'defense': 'Defesa',
  'special-attack': 'Ataque Esp.', 
  'special-defense': 'Defesa Esp.', 
  'speed': 'Velocidade'
};

// FUNÇÕES AUXILIARES DE FORMATAÇÃO

// Gera as etiquetas coloridas de tipos
function gerarEtiquetasTipos(types) {
  return types.map(({ type }) => {
    const cor = coresEtiquetas[type.name] || '#a8a878';
    return `<span class="tipo" style="background-color: ${cor}">${type.name}</span>`;
  }).join('');
}

// Gera as barras e valores dos status base
function gerarBarrasStatus(stats) {
  return stats.map(({ stat, base_stat }) => {
    const nome = nomesStatus[stat.name] || stat.name;
    const largura = Math.min((base_stat / 150) * 100, 100);
    return `
      <div class="stat">
        <div class="stat-topo">
          <span>${nome}</span><b>${base_stat}</b>
        </div>
        <div class="stat-barra">
          <span style="width: ${largura}%"></span>
        </div>
      </div>
    `;
  }).join('');
}

// Retorna a marcação de gênero com base no gender_rate da PokéAPI
function determinarSexoHTML(genderRate) {
  if (genderRate === -1) return 'Sem gênero';
  if (genderRate === 8) return '<span style="color: #8d0202;">♀</span> (Fêmea)';
  if (genderRate === 0) return '<span style="color: blue;">♂</span> (Macho)';
  return '<span style="color: blue;">♂</span> <span style="color: #8d0202;">♀</span>';
}

// Monta recursivamente a lista da linha evolutiva
function extrairEvolucoes(chain, lista = []) {
  const { species, evolves_to } = chain;
  lista.push({ nome: species.name, id: idDaUrl(species.url) });

  if (evolves_to.length > 0) {
    extrairEvolucoes(evolves_to[0], lista);
  }
  return lista;
}

// CRIAÇÃO DOS CARDS DE LISTAGEM

export function criarCardPokemonHTML(pokemon, ehFavorito) {
  const { id, name, types, sprites } = pokemon;
  const primeiroTipo = types[0].type.name;
  
  const card = document.createElement('div');
  card.classList.add('cartao-pokemon');
  card.style.borderColor = coresEtiquetas[primeiroTipo] || '#a8a878';
  card.dataset.id = id;
  card.dataset.tipos = types.map(({ type }) => type.name).join(' ');
  card.tabIndex = 0;

  const numeroFormatado = String(id).padStart(3, '0');
  const classeFavorito = ehFavorito ? ' favoritado' : '';

  card.innerHTML = `
    <div class="numero">#${numeroFormatado}</div>
    <button type="button" class="botao-favorito${classeFavorito}" aria-label="Favoritar ${name}" aria-pressed="${ehFavorito}">
      <svg viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </button>
    <img src="${sprites.front_default}" alt="${name}" class="imagem-pokemon">
    <h2 class="nome-pokemon">${name}</h2>
    <div class="tipos">${gerarEtiquetasTipos(types)}</div>
  `;

  return card;
}

export function criarCardItemHTML({ name, sprites, effect_entries }) {
  const card = document.createElement('div');
  card.classList.add('cartao-item');
  
  const efeito = effect_entries.find(({ language }) => language.name === 'en');
  const nomeFormatado = name.replace(/-/g, ' ');
  
  card.innerHTML = `
    <img src="${sprites.default}" alt="${name}">
    <h3>${nomeFormatado}</h3>
    <p>${efeito ? efeito.short_effect : 'Sem descrição'}</p>
  `;

  return card;
}

export function criarCardAtaqueHTML({ name, type, power, accuracy }) {
  const card = document.createElement('div');
  card.classList.add('cartao-ataque');
  
  const cor = coresEtiquetas[type.name] || '#a8a878';
  const nomeFormatado = name.replace(/-/g, ' ');
  
  card.innerHTML = `
    <h3>${nomeFormatado}</h3>
    <span class="tipo" style="background-color: ${cor}">${type.name}</span>
    <div class="stats-ataque">
      <p>Poder: <b>${power || '-'}</b></p>
      <p>Precisão: <b>${accuracy || '-'}</b></p>
    </div>
  `;

  return card;
}

// PAINEL LATERAL DE DETALHES

export async function preencherDetalhesUI(pokemon, notaAtual, callbackSalvarNota) {
  const { id, name, height, weight, types, abilities, stats, sprites, species } = pokemon;
  const detalhes = document.getElementById('detalhes');
  
  // 1. Preenchimento instantâneo (dados síncronos)
  document.getElementById('detImagem').src = sprites.front_default;
  document.getElementById('detNumero').textContent = '#' + String(id).padStart(3, '0');
  document.getElementById('detNome').textContent = name;
  document.getElementById('detAltura').textContent = (height / 10) + ' m';
  document.getElementById('detPeso').textContent = (weight / 10) + ' kg';

  document.getElementById('detTipos').innerHTML = gerarEtiquetasTipos(types);
  document.getElementById('detStats').innerHTML = gerarBarrasStatus(stats);

  document.getElementById('detHabilidades').innerHTML = abilities.map(({ ability, is_hidden }) => 
    ability.name.replace('-', ' ') + (is_hidden ? ' <i>(Oculta)</i>' : '')
  ).join('<br>');

  // Imagem da versão Shiny
  const imgShiny = document.getElementById('detShiny');
  if (sprites.front_shiny) {
    imgShiny.src = sprites.front_shiny;
    imgShiny.hidden = false;
  } else {
    imgShiny.hidden = true;
  }

  // Anotações pessoais
  const campoNota = document.getElementById('detNota');
  campoNota.value = notaAtual || '';
  campoNota.oninput = (e) => callbackSalvarNota(id, e.target.value);

  // Exibe a barra na tela
  detalhes.classList.add('aberta');
  detalhes.setAttribute('aria-hidden', 'false');

  // Placeholders para requisições assíncronas
  document.getElementById('detCategoria').textContent = '...';
  document.getElementById('detSexo').innerHTML = '...';
  document.getElementById('detFraquezas').innerHTML = '...';
  document.getElementById('detEvolucoes').innerHTML = '...';

  // Preenchimento assíncrono (requisições extras da API)
  try {
    // Busca e calcula fraquezas
    const promessasTipos = types.map(({ type }) => getDados(type.url));
    const dadosTipos = await Promise.all(promessasTipos);
    const fraquezasSet = new Set();
    
    dadosTipos.forEach(tipoData => {
      tipoData.damage_relations.double_damage_from.forEach(({ name: nomeFraqueza }) => {
        fraquezasSet.add(nomeFraqueza);
      });
    });
    
    document.getElementById('detFraquezas').innerHTML = Array.from(fraquezasSet).map(f => 
      `<span class="tipo" style="background-color: ${coresEtiquetas[f] || '#a8a878'}">${f}</span>`
    ).join('');

    // Busca dados da espécie (categoria e sexo)
    const dadosEspecie = await getDados(species.url);
    const categoriaEn = dadosEspecie.genera.find(({ language }) => language.name === 'en');
    
    document.getElementById('detCategoria').textContent = categoriaEn ? categoriaEn.genus.replace(' Pokémon', '') : '???';
    document.getElementById('detSexo').innerHTML = determinarSexoHTML(dadosEspecie.gender_rate);

    // Busca e monta a linha evolutiva completa
    const dadosEvolucao = await getDados(dadosEspecie.evolution_chain.url);
    const cadeia = extrairEvolucoes(dadosEvolucao.chain);
    
    document.getElementById('detEvolucoes').innerHTML = cadeia.map(({ id: idEvo, nome }, index) => {
      const temProximaSeta = index < cadeia.length - 1 ? '<div class="evo-seta">❯</div>' : '';
      return `
        <div class="evo-item">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idEvo}.png" alt="${nome}">
          <p>${nome}</p>
        </div>
        ${temProximaSeta}
      `;
    }).join('');

  } catch (erro) { 
    console.error("Erro ao carregar detalhes extras:", erro); 
  }
}

export function fecharDetalhesUI() {
  const detalhes = document.getElementById('detalhes');
  detalhes.classList.remove('aberta');
  detalhes.setAttribute('aria-hidden', 'true');
}