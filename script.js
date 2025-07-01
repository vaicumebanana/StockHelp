let board = null;
let game = new Chess();
let engine = STOCKFISH();

const eloSlider = document.getElementById('eloRange');
const depthSlider = document.getElementById('depthRange');
const eloValue = document.getElementById('eloValue');
const depthValue = document.getElementById('depthValue');

eloSlider.oninput = () => eloValue.textContent = eloSlider.value;
depthSlider.oninput = () => depthValue.textContent = depthSlider.value;

board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDrop: onDrop
});

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  updateBoard();
}

function updateBoard() {
  board.position(game.fen());
}

function makePlayerMove() {
  const mv = document.getElementById('move').value;
  const move = game.move({ from: mv.slice(0,2), to: mv.slice(2,4), promotion: 'q' });
  if (!move) return alert('Movimento inválido.');
  updateBoard();
}

function engineMove() {
  engine.postMessage('uci');
  engine.postMessage('isready');
  engine.postMessage('setoption name UCI_LimitStrength value true');
  engine.postMessage(`setoption name UCI_Elo value ${eloSlider.value}`);
  engine.postMessage(`position fen ${game.fen()}`);
  engine.postMessage(`go depth ${depthSlider.value}`);
  engine.onmessage = event => {
    const line = event.data;
    if (line.startsWith('bestmove')) {
      const mv = line.split(' ')[1];
      game.move({ from: mv.slice(0,2), to: mv.slice(2,4), promotion: 'q' });
      updateBoard();
    }
  };
}

function sendMessage() {
  const msg = document.getElementById('userMessage').value.toLowerCase();
  const chat = document.getElementById('chat');
  const u = document.createElement('div');
  u.innerHTML = `<strong>Você:</strong> ${msg}`;
  chat.appendChild(u);

  let bot = "Desculpe, não entendi.";
  if (msg.includes('rocar')) bot = "Roque é uma jogada especial: rei+torre. Ex: O-O (pequeno) ou O-O-O (grande).";
  if (msg.includes('dica')) bot = "Dica: controle o centro, desenvolva peças e proteja o rei.";
  if (msg.includes('abertura')) bot = "A abertura italiana (e4 e5 Cf3 Cc6 Bc4) é clara e eficiente.";

  const b = document.createElement('div');
  b.innerHTML = `<strong>Assistente:</strong> ${bot}`;
  chat.appendChild(b);
  chat.scrollTop = chat.scrollHeight;
}
