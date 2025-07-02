document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const eloSlider = document.getElementById('eloRange');
    const depthSlider = document.getElementById('depthRange');
    const eloValue = document.getElementById('eloValue');
    const depthValue = document.getElementById('depthValue');
    const moveInput = document.getElementById('move');
    const moveBtn = document.getElementById('moveBtn');
    const engineBtn = document.getElementById('engineBtn');
    const resetBtn = document.getElementById('resetBtn');
    const userMessage = document.getElementById('userMessage');
    const sendBtn = document.getElementById('sendBtn');
    const chat = document.getElementById('chat');

    // Inicializa o jogo
    let board = null;
    let game = new Chess();
    let engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/16.0.0/stockfish.js');

    // Atualiza os valores dos sliders
    eloSlider.addEventListener('input', () => eloValue.textContent = eloSlider.value);
    depthSlider.addEventListener('input', () => depthValue.textContent = depthSlider.value);

    // Configura o tabuleiro
    board = Chessboard('board', {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });

    // Funções do tabuleiro
    function onDragStart(source, piece) {
        if (game.isGameOver()) return false;
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        try {
            const move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            if (move === null) return 'snapback';
            updateBoard();
            
            // Verifica se o jogo terminou
            if (game.isGameOver()) {
                let result = 'Empate';
                if (game.isCheckmate()) {
                    result = `Xeque-mate! ${game.turn() === 'w' ? 'Pretas' : 'Brancas'} ganharam.`;
                }
                addToChat(`Assistente: ${result}`);
            }
        } catch (e) {
            console.error(e);
            return 'snapback';
        }
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateBoard() {
        board.position(game.fen());
    }

    // Movimento manual
    moveBtn.addEventListener('click', () => {
        const moveText = moveInput.value.trim();
        if (!moveText) return;

        try {
            const move = game.move({
                from: moveText.slice(0, 2),
                to: moveText.slice(2, 4),
                promotion: moveText.length > 4 ? moveText[4] : 'q'
            });

            if (!move) {
                alert('Movimento inválido!');
                return;
            }

            moveInput.value = '';
            updateBoard();
            
            if (game.isGameOver()) {
                let result = 'Empate';
                if (game.isCheckmate()) {
                    result = `Xeque-mate! ${game.turn() === 'w' ? 'Pretas' : 'Brancas'} ganharam.`;
                }
                addToChat(`Assistente: ${result}`);
            }
        } catch (e) {
            alert('Formato inválido! Use notação como "e2e4" ou "g1f3"');
        }
    });

    // Jogada da engine
    engineBtn.addEventListener('click', engineMove);

    function engineMove() {
        if (game.isGameOver()) {
            addToChat('Assistente: O jogo já terminou! Reinicie para jogar novamente.');
            return;
        }

        engine.postMessage('uci');
        engine.postMessage('isready');
        engine.postMessage('setoption name UCI_LimitStrength value true');
        engine.postMessage(`setoption name UCI_Elo value ${eloSlider.value}`);
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage(`go depth ${depthSlider.value}`);

        engine.onmessage = (event) => {
            const line = event.data;
            if (line.startsWith('bestmove')) {
                const moveStr = line.split(' ')[1];
                if (moveStr && moveStr !== '(none)') {
                    const move = game.move({
                        from: moveStr.substring(0, 2),
                        to: moveStr.substring(2, 4),
                        promotion: moveStr.length > 4 ? moveStr[4] : 'q'
                    });

                    if (move) {
                        updateBoard();
                        
                        if (game.isGameOver()) {
                            let result = 'Empate';
                            if (game.isCheckmate()) {
                                result = `Xeque-mate! ${game.turn() === 'w' ? 'Pretas' : 'Brancas'} ganharam.`;
                            }
                            addToChat(`Assistente: ${result}`);
                        }
                    }
                }
            }
        };
    }

    // Reiniciar o jogo
    resetBtn.addEventListener('click', () => {
        game = new Chess();
        board.start();
        addToChat('Assistente: Jogo reiniciado. Boa sorte!');
    });

    // Sistema de chat
    sendBtn.addEventListener('click', sendMessage);
    userMessage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const msg = userMessage.value.trim();
        if (!msg) return;

        addToChat(`Você: ${msg}`);
        userMessage.value = '';

        // Respostas do assistente
        let response = "Desculpe, não entendi. Você pode perguntar sobre: roque, aberturas ou estratégias.";
        
        if (msg.toLowerCase().includes('roque') || msg.toLowerCase().includes('rocar')) {
            response = "Roque é uma jogada especial envolvendo o rei e a torre. Notação: O-O (roque pequeno) ou O-O-O (roque grande). Requisitos: rei e torre não podem ter se movido, sem peças entre eles, rei não pode estar em xeque.";
        } else if (msg.toLowerCase().includes('abertura')) {
            response = "Algumas aberturas populares: 1. Italiana (e4 e5 Cf3 Cc6 Bc4), 2. Siciliana (e4 c5), 3. Ruy López (e4 e5 Cf3 Cc6 Bb5). Controle o centro e desenvolva suas peças rapidamente!";
        } else if (msg.toLowerCase().includes('estratégia') || msg.toLowerCase().includes('dica')) {
            response = "Dicas: 1) Controle o centro, 2) Desenvolva todas as peças, 3) Proteja seu rei, 4) Evite mover a mesma peça múltiplas vezes na abertura, 5) Conecte suas torres.";
        } else if (msg.toLowerCase().includes('xeque') || msg.toLowerCase().includes('mate')) {
            response = "Xeque-mate ocorre quando o rei está em xeque sem escapatória. Pratique padrões de mate como: mate do pastor, mate da torre, mate de Boden.";
        }

        // Resposta simulada com atraso
        setTimeout(() => {
            addToChat(`Assistente: ${response}`);
        }, 500);
    }

    function addToChat(message) {
        const msgElement = document.createElement('div');
        msgElement.innerHTML = message;
        chat.appendChild(msgElement);
        chat.scrollTop = chat.scrollTop + 500;
    }

    // Mensagem inicial
    setTimeout(() => {
        addToChat('Assistente: Bem-vindo ao Assistente de Xadrez! Você pode me perguntar sobre regras, estratégias ou pedir dicas.');
    }, 1000);
});
