  const listaPokemon = document.getElementById('pokedex-lista');
  const contadorEl = document.getElementById('contador');
  const campoBusca = document.getElementById('searchInput');
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroGeracao = document.getElementById('filtroGeracao');
  const filtroRegiao = document.getElementById('filtroRegiao');
  const botaoLimpar = document.getElementById('limparFiltros');
  const detalhes = document.getElementById('detalhes');
  const abaPokemon = document.getElementById('abaPokemon');
  const abaFavoritos = document.getElementById('abaFavoritos');
  const tituloLista = document.getElementById('tituloLista');
  const semFavoritos = document.getElementById('semFavoritos');

  const quantidadePokemons = 1025;

  // Guarda os dados de cada Pokémon para a barra de detalhes usar
  const dadosPokemons = {};

  // Lê a lista salva no navegador (se não existir, começa vazia)
  let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  let mostrandoFavoritos = false;

  function salvarFavoritos() {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }


  // Cores das etiquetas de tipo e da borda do card
  const coresEtiquetas = {
    grass: '#78c850', fire: '#f08030', water: '#6890f0', bug: '#a8b820',
    normal: '#a8a878', poison: '#a040a0', electric: '#f8d030', ground: '#e0c068',
    fairy: '#ee99ac', fighting: '#c03028', psychic: '#f85888', rock: '#b8a038',
    ghost: '#705898', ice: '#98d8d8', dragon: '#7038f8'
  };

  // Nomes dos status em português
  const nomesStatus = {
    'hp': 'HP',
    'attack': 'Ataque',
    'defense': 'Defesa',
    'special-attack': 'Ataque Esp.',
    'special-defense': 'Defesa Esp.',
    'speed': 'Velocidade'
  };

  // Conjuntos de IDs (preenchidos pela API)
  const geracoes = {};   // ex: geracoes[1] = Set de ids da geração 1
  const regioes = {};    // ex: regioes.johto = Set de ids que aparecem em Johto

  // Pokédex da PokeAPI que formam cada região
  const pokedexRegioes = {
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

// busca api  
async function buscarPokemons() {
    const tamanhoLote = 50; // Quantidade de requisições simultâneas por vez

    // O loop avança pulando de 50 em 50
    for (let i = 1; i <= quantidadePokemons; i += tamanhoLote) {
      const promessas = [];

      // Cria as requisições apenas para o lote atual
      for (let j = i; j < i + tamanhoLote && j <= quantidadePokemons; j++) {
        const promessa = fetch(`https://pokeapi.co/api/v2/pokemon/${j}`)
          .then(resposta => {
            if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
            return resposta.json();
          });
        
        promessas.push(promessa);
      }

      try {
        // Dispara o lote atual e espera TODOS os 50 terminarem
        const listaDePokemons = await Promise.all(promessas);
        
        // Cria os cards deste lote na ordem correta
        listaDePokemons.forEach(pokemon => {
          criarCardPokemon(pokemon);
        });
      } catch (erro) {
        console.error(`Erro ao buscar o lote iniciando no ID ${i}:`, erro);
      }
    }
  }

  // Extrai o id do final da URL (".../pokemon-species/25/" vira 25)
  function idDaUrl(url) {
    return Number(url.split('/').filter(Boolean).pop());
  }

  async function carregarGeracoes() {
    const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    await Promise.all(numeros.map(async (g) => {
      try {
        const resposta = await fetch(`https://pokeapi.co/api/v2/generation/${g}`);
        const dados = await resposta.json();
        geracoes[g] = new Set(dados.pokemon_species.map(e => idDaUrl(e.url)));
      } catch (erro) {
        console.error(`Erro ao carregar a geração ${g}:`, erro);
      }
    }));
  }

  // Carrega quais Pokémon aparecem em cada região (todas ao mesmo tempo)
  async function carregarRegioes() {
    const nomesRegioes = Object.keys(pokedexRegioes);

    await Promise.all(nomesRegioes.map(async (regiao) => {
      const ids = new Set();

      // Uma região pode ter vários pokédex (ex: Kalos), então busca todos juntos
      await Promise.all(pokedexRegioes[regiao].map(async (nomePokedex) => {
        try {
          const resposta = await fetch(`https://pokeapi.co/api/v2/pokedex/${nomePokedex}`);
          const dados = await resposta.json();
          dados.pokemon_entries.forEach(e => ids.add(idDaUrl(e.pokemon_species.url)));
        } catch (erro) {
          console.error(`Erro ao carregar o pokédex ${nomePokedex}:`, erro);
        }
      }));

      regioes[regiao] = ids;
    }));
  }

  // Carrega quais Pokémon aparecem em cada região
  async function carregarRegioes() {
    const nomesRegioes = Object.keys(pokedexRegioes);
    await Promise.all(nomesRegioes.map(async (regiao) => {
      const ids = new Set();
      await Promise.all(pokedexRegioes[regiao].map(async (nomePokedex) => {
        try {
          const resposta = await fetch(`https://pokeapi.co/api/v2/pokedex/${nomePokedex}`);
          const dados = await resposta.json();
          dados.pokemon_entries.forEach(e => ids.add(idDaUrl(e.pokemon_species.url)));
        } catch (erro) {
          console.error(`Erro ao carregar o pokédex ${nomePokedex}:`, erro);
        }
      }));
      regioes[regiao] = ids;
    }));
  }

// cria card
  function criarCardPokemon(pokemon) {
    const card = document.createElement('div');
    card.classList.add('cartao-pokemon');

    // Tipo principal define a cor da borda
    const tipoPrincipal = pokemon.types[0].type.name;
    card.style.borderColor = coresEtiquetas[tipoPrincipal] || '#a8a878';

    // Guarda id e tipos no card para os filtros usarem
    card.dataset.id = pokemon.id;
    card.dataset.tipos = pokemon.types.map(t => t.type.name).join(' ');

    // Guarda os dados completos para a barra de detalhes
    dadosPokemons[pokemon.id] = pokemon;

    // Permite focar e abrir o card com o teclado
    card.tabIndex = 0;

    // Formata o número (1 vira #001)
    const idFormatado = String(pokemon.id).padStart(3, '0');

    // Etiquetas de tipo
    const etiquetasTiposHTML = pokemon.types.map(infoTipo => {
      const nomeTipo = infoTipo.type.name;
      const corEtiqueta = coresEtiquetas[nomeTipo] || '#a8a878';
      return `<span class="tipo" style="background-color: ${corEtiqueta}">${nomeTipo}</span>`;
    }).join('');

    const imagemUrl = pokemon.sprites.front_default;

    // Confere se este Pokémon já está na lista de favoritos
    const ehFavorito = favoritos.includes(pokemon.id);

    card.innerHTML = `
      <div class="numero">#${idFormatado}</div>
      <button type="button" class="botao-favorito${ehFavorito ? ' favoritado' : ''}" aria-label="Favoritar ${pokemon.name}" aria-pressed="${ehFavorito}">
        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>
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

// contaodor
  function atualizarContador() {
    const exibidos = listaPokemon.querySelectorAll('.cartao-pokemon:not([hidden])').length;
    contadorEl.textContent = `Exibindo ${exibidos} de ${quantidadePokemons}`;
  }


  // Verifica se o id está no conjunto escolhido (sem filtro = passa)
  function pertence(id, conjuntos, valor) {
    if (!valor) return true;                // nenhum filtro selecionado
    const conjunto = conjuntos[valor];
    if (!conjunto) return true;             // lista ainda carregando
    return conjunto.has(id);
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
    const combinaGeracao = pertence(id, geracoes, filtroGeracao.value);
    const combinaRegiao = pertence(id, regioes, filtroRegiao.value);

    // Na aba Favoritos, só passa quem está na lista de favoritos
    const combinaFavorito = !mostrandoFavoritos || favoritos.includes(id);

    return combinaTexto && combinaTipo && combinaGeracao && combinaRegiao && combinaFavorito;
  }

  // Mostra ou esconde os cards conforme os filtros
  function filtrarPokemons() {
    const cards = listaPokemon.querySelectorAll('.cartao-pokemon');

    cards.forEach((card) => {
      card.hidden = !combinaComBusca(card);
    });

    // Mensagem para quando não há nenhum favorito
    semFavoritos.hidden = !(mostrandoFavoritos && favoritos.length === 0);

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

  function abrirDetalhes(id, card) {
    const pokemon = dadosPokemons[id];
    if (!pokemon) return;

    // Destaca o card selecionado
    listaPokemon.querySelectorAll('.ativo').forEach(c => c.classList.remove('ativo'));
    card.classList.add('ativo');

    const imagem = pokemon.sprites.front_default;

    document.getElementById('detImagem').src = imagem;
    document.getElementById('detImagem').alt = pokemon.name;
    document.getElementById('detNumero').textContent = '#' + String(pokemon.id).padStart(3, '0');
    document.getElementById('detNome').textContent = pokemon.name;
    document.getElementById('detAltura').textContent = (pokemon.height / 10) + ' m';
    document.getElementById('detPeso').textContent = (pokemon.weight / 10) + ' kg';

    document.getElementById('detTipos').innerHTML = pokemon.types.map(t => {
      const nome = t.type.name;
      const cor = coresEtiquetas[nome] || '#a8a878';
      return `<span class="tipo" style="background-color: ${cor}">${nome}</span>`;
    }).join('');

    document.getElementById('detStats').innerHTML = pokemon.stats.map(s => {
      const nome = nomesStatus[s.stat.name] || s.stat.name;
      const largura = Math.min(s.base_stat / 150 * 100, 100);
      return `
        <div class="stat">
          <div class="stat-topo"><span>${nome}</span><b>${s.base_stat}</b></div>
          <div class="stat-barra"><span style="width: ${largura}%"></span></div>
        </div>`;
    }).join('');

    detalhes.classList.add('aberta');            // expande a barra
    detalhes.setAttribute('aria-hidden', 'false');
  }

  function fecharDetalhes() {
    detalhes.classList.remove('aberta');         // recolhe a barra
    detalhes.setAttribute('aria-hidden', 'true');
    listaPokemon.querySelectorAll('.ativo').forEach(c => c.classList.remove('ativo'));
  }

  campoBusca.addEventListener('input', filtrarPokemons);
  filtroTipo.addEventListener('change', filtrarPokemons);
  filtroGeracao.addEventListener('change', filtrarPokemons);
  filtroRegiao.addEventListener('change', filtrarPokemons);
  botaoLimpar.addEventListener('click', limparFiltros);

  // Clique (ou Enter) em qualquer card abre a barra de detalhes
  listaPokemon.addEventListener('click', (e) => {
    // Clicou no coração: só favorita, não abre os detalhes
    const coracao = e.target.closest('.botao-favorito');
    if (coracao) {
      const cardDoCoracao = coracao.closest('.cartao-pokemon');
      alternarFavorito(Number(cardDoCoracao.dataset.id), coracao);
      return;
    }

    const card = e.target.closest('.cartao-pokemon');
    if (card) abrirDetalhes(card.dataset.id, card);
  });

  listaPokemon.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.closest('.botao-favorito')) return;
    const card = e.target.closest('.cartao-pokemon');
    if (card) abrirDetalhes(card.dataset.id, card);
  });

  document.getElementById('detalhesFechar').addEventListener('click', fecharDetalhes);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharDetalhes();
  });


  // Marca ou desmarca o favorito e salva no navegador
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

    // Na aba Favoritos, o card desmarcado some da lista
    if (mostrandoFavoritos) filtrarPokemons();
  }

  // Troca entre a aba Pokémon e a aba Favoritos
  function mudarAba(abrirFavoritos) {
    mostrandoFavoritos = abrirFavoritos;

    abaPokemon.classList.toggle('ativo', !abrirFavoritos);
    abaFavoritos.classList.toggle('ativo', abrirFavoritos);
    tituloLista.textContent = abrirFavoritos ? 'Favoritos' : 'Todos os pokemons';

    filtrarPokemons();
  }

  abaPokemon.addEventListener('click', () => mudarAba(false));
  abaFavoritos.addEventListener('click', () => mudarAba(true));

// inciio
  async function iniciar() {
    atualizarContador();
    buscarPokemons();              // os cards continuam chegando normalmente

    await Promise.all([carregarGeracoes(), carregarRegioes()]);
    filtrarPokemons();             // reaplica os filtros quando as listas chegarem
  }

  iniciar();