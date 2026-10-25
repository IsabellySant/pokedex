// Usa os Pokémon que o script.js já buscou na API (dadosPokemons)

const botaoQuiz = document.querySelector('button.quiz');
const quizQtdOpcoes = 4;

let quizCerto = null;
let quizAcertos = 0;
let quizRodadas = 0;

const telaQuiz = document.createElement('div');
telaQuiz.className = 'jogo-tela';
telaQuiz.hidden = true;
telaQuiz.setAttribute('role', 'dialog');
telaQuiz.setAttribute('aria-modal', 'true');
telaQuiz.setAttribute('aria-labelledby', 'jogoTitulo');

telaQuiz.innerHTML = `
  <div class="jogo-caixa">
    <button type="button" class="jogo-fechar" id="jogoFechar" aria-label="Fechar quiz">✕</button>

    <h2 class="jogo-titulo" id="jogoTitulo">Quem é esse Pokémon?</h2>
    <p class="jogo-placar">Acertos: <span id="jogoAcertos">0</span> / <span id="jogoTotal">0</span></p>

<div class="jogo-moldura">
      <img id="jogoImagem" class="jogo-imagem silhueta" src="" alt="Silhueta de um Pokémon">
    </div>

    <p class="jogo-mensagem" id="jogoMensagem" aria-live="polite"></p>

    <div class="jogo-opcoes" id="jogoOpcoes"></div>

    <button type="button" class="jogo-proximo" id="jogoProximo" hidden>Próximo</button>
  </div>
`;

document.body.appendChild(telaQuiz);

// Elementos de dentro da tela
const jogoFechar = document.getElementById('jogoFechar');
const jogoAcertos = document.getElementById('jogoAcertos');
const jogoTotal = document.getElementById('jogoTotal');
const jogoImagem = document.getElementById('jogoImagem');
const jogoMensagem = document.getElementById('jogoMensagem');
const jogoOpcoes = document.getElementById('jogoOpcoes');
const jogoProximo = document.getElementById('jogoProximo');


// Embaralha uma lista sem alterar a original
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function pokemonsDisponiveis() {
  return Object.values(dadosPokemons).filter(p => p.sprites.front_default);
}

function novaPergunta() {
  const disponiveis = pokemonsDisponiveis();

  jogoOpcoes.innerHTML = '';
  jogoProximo.hidden = true;

  // Ainda não carregou Pokémon suficientes
  if (disponiveis.length < quizQtdOpcoes) {
    jogoImagem.removeAttribute('src');
    jogoMensagem.textContent = 'Carregando Pokémon... tente de novo em instantes.';
    return;
  }

  // Sorteia as opções e escolhe a certa entre elas
  const sorteados = embaralhar(disponiveis).slice(0, quizQtdOpcoes);
  quizCerto = sorteados[Math.floor(Math.random() * sorteados.length)];

  // Mostra a imagem como silhueta
  jogoImagem.src = quizCerto.sprites.front_default;
  jogoImagem.alt = 'Silhueta de um Pokémon';
  jogoImagem.classList.add('silhueta');
  jogoMensagem.textContent = '';

  // Cria um botão para cada opção
  sorteados.forEach(pokemon => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'jogo-opcao';
    botao.textContent = pokemon.name;
    botao.dataset.id = pokemon.id;
    botao.addEventListener('click', () => responder(pokemon, botao));
    jogoOpcoes.appendChild(botao);
  });
}

function responder(escolhido, botaoClicado) {
  quizRodadas++;

  // Revela o Pokémon
  jogoImagem.classList.remove('silhueta');
  jogoImagem.alt = quizCerto.name;

  if (escolhido.id === quizCerto.id) {
    quizAcertos++;
    jogoMensagem.textContent = `Acertou! É o ${quizCerto.name}!`;
  } else {
    jogoMensagem.textContent = `Errou! Era o ${quizCerto.name}.`;
    botaoClicado.classList.add('errada');
  }

  // Marca a certa e bloqueia todos os botões
  jogoOpcoes.querySelectorAll('.jogo-opcao').forEach(botao => {
    if (Number(botao.dataset.id) === quizCerto.id) {
      botao.classList.add('certa');
    }
    botao.disabled = true;
  });

  jogoAcertos.textContent = quizAcertos;
  jogoTotal.textContent = quizRodadas;
  jogoProximo.hidden = false;
  jogoProximo.focus();
}

// abre e fecha
function abrirQuiz() {
  quizAcertos = 0;
  quizRodadas = 0;
  jogoAcertos.textContent = 0;
  jogoTotal.textContent = 0;

  telaQuiz.hidden = false;
  novaPergunta();
  jogoFechar.focus();
}

function fecharQuiz() {
  telaQuiz.hidden = true;
  botaoQuiz.focus();
}

botaoQuiz.addEventListener('click', abrirQuiz);
jogoFechar.addEventListener('click', fecharQuiz);
jogoProximo.addEventListener('click', novaPergunta);

// Clicar no fundo escuro também fecha
telaQuiz.addEventListener('click', (e) => {
  if (e.target === telaQuiz) fecharQuiz();
});

// Esc fecha o quiz
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !telaQuiz.hidden) fecharQuiz();
});