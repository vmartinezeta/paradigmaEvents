const EventEmitter = require('events');

// 🎯 NÚCLEO DEL JUEGO - Sin lógica de UI
class TicTacToeCore extends EventEmitter {
  constructor() {
    super();
    this.board = [
      [' ', ' ', ' '],
      [' ', ' ', ' '],
      [' ', ' ', ' ']
    ];
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.movesHistory = [];
  }

  makeMove(row, col) {
    if (!this.gameActive) {
      this.emit('gameInactive');
      return false;
    }

    if (this.board[row][col] !== ' ') {
      this.emit('invalidMove', { row, col, player: this.currentPlayer });
      return false;
    }

    // Movimiento válido
    this.board[row][col] = this.currentPlayer;
    this.movesHistory.push({ player: this.currentPlayer, row, col });
    
    this.emit('moveMade', { 
      player: this.currentPlayer, 
      row, 
      col,
      board: this.getBoardSnapshot()
    });

    // Verificar estado del juego
    this.checkGameState();
    return true;
  }

  checkGameState() {
    const winner = this.checkWinner();
    if (winner) {
      this.gameActive = false;
      this.emit('gameWon', { 
        winner, 
        moves: this.movesHistory.length,
        finalBoard: this.getBoardSnapshot()
      });
      return;
    }

    if (this.isBoardFull()) {
      this.gameActive = false;
      this.emit('gameTied', {
        moves: this.movesHistory.length,
        finalBoard: this.getBoardSnapshot()
      });
      return;
    }

    // Cambiar turno
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.emit('turnChanged', { nextPlayer: this.currentPlayer });
  }

  checkWinner() {
    const b = this.board;
    // Lógica de verificación (filas, columnas, diagonales)
    for (let i = 0; i < 3; i++) {
      if (b[i][0] !== ' ' && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return b[i][0];
      if (b[0][i] !== ' ' && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return b[0][i];
    }
    if (b[0][0] !== ' ' && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return b[0][0];
    if (b[0][2] !== ' ' && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return b[0][2];
    return null;
  }

  isBoardFull() {
    return this.board.flat().every(cell => cell !== ' ');
  }

  getBoardSnapshot() {
    return this.board.map(row => [...row]);
  }

  reset() {
    this.board = [[' ', ' ', ' '], [' ', ' ', ' '], [' ', ' ', ' ']];
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.movesHistory = [];
    this.emit('gameReset');
  }
}

// 🌐 CAPA DE IDIOMAS - Estrategias de localización
class LanguageStrategy {
  static getStrategy(language) {
    const strategies = {
      es: SpanishLanguage,
      en: EnglishLanguage, 
      fr: FrenchLanguage,
      pt: PortugueseLanguage
    };
    return strategies[language] || EnglishLanguage;
  }
}

class EnglishLanguage {
  static translations = {
    welcome: "🎮 TIC TAC TOE - Multi-UI System",
    turn: player => `🧩 ${player}'s turn`,
    invalidMove: "❌ Invalid position! Try again.",
    winner: player => `🏆 ${player} WINS! Congratulations!`,
    tied: "🤝 It's a TIE! Well played both!",
    boardHeader: "  0   1   2",
    cellSeparator: "-----------",
    reset: "🔄 Game reset",
    moveMade: (player, row, col) => `✅ ${player} placed at [${row},${col}]`
  };
}

class SpanishLanguage {
  static translations = {
    welcome: "🎮 TRES EN RAYA - Sistema Multi-UI",
    turn: player => `🧩 Turno de ${player}`,
    invalidMove: "❌ ¡Posición inválida! Intenta de nuevo.",
    winner: player => `🏆 ¡${player} GANA! ¡Felicidades!`,
    tied: "🤝 ¡Es un EMPATE! ¡Bien jugado!",
    boardHeader: "  0   1   2", 
    cellSeparator: "-----------",
    reset: "🔄 Juego reiniciado",
    moveMade: (player, row, col) => `✅ ${player} colocó en [${row},${col}]`
  };
}

class FrenchLanguage {
  static translations = {
    welcome: "🎮 MORPION - Système Multi-UI",
    turn: player => `🧩 Tour de ${player}`,
    invalidMove: "❌ Position invalide ! Réessayez.",
    winner: player => `🏆 ${player} GAGNE ! Félicitations !`,
    tied: "🤝 Match NUL ! Bien joué !",
    boardHeader: "  0   1   2",
    cellSeparator: "-----------", 
    reset: "🔄 Jeu réinitialisé",
    moveMade: (player, row, col) => `✅ ${player} placé à [${row},${col}]`
  };
}

class PortugueseLanguage {
  static translations = {
    welcome: "🎮 JOGO DA VELHA - Sistema Multi-UI",
    turn: player => `🧩 Vez de ${player}`,
    invalidMove: "❌ Posição inválida! Tente novamente.",
    winner: player => `🏆 ${player} GANHOU! Parabéns!`,
    tied: "🤝 É um EMPATE! Bem jogado!",
    boardHeader: "  0   1   2",
    cellSeparator: "-----------",
    reset: "🔄 Jogo reiniciado", 
    moveMade: (player, row, col) => `✅ ${player} colocou em [${row},${col}]`
  };
}

// 🎨 CAPA BASE DE UI - Abstracta
class BaseUI {
  constructor(gameCore, language = 'en') {
    this.game = gameCore;
    this.language = LanguageStrategy.getStrategy(language);
    this.setupEventListeners();
  }

  setupEventListeners() {
    throw new Error('Método setupEventListeners debe ser implementado');
  }

  displayBoard(board) {
    throw new Error('Método displayBoard debe ser implementado');
  }

  destroy() {
    // Limpiar event listeners
    this.game.removeAllListeners();
  }
}

// 🖥️ IMPLEMENTACIONES ESPECÍFICAS DE UI

// 1. UI Minimalista - Solo lo esencial
class MinimalistUI extends BaseUI {
  setupEventListeners() {
    this.game.on('turnChanged', (data) => {
      console.log(this.language.translations.turn(data.nextPlayer));
    });

    this.game.on('invalidMove', () => {
      console.log(this.language.translations.invalidMove);
    });

    this.game.on('gameWon', (data) => {
      console.log(this.language.translations.winner(data.winner));
    });

    this.game.on('gameTied', () => {
      console.log(this.language.translations.tied);
    });

    this.game.on('moveMade', (data) => {
      console.log(this.language.translations.moveMade(data.player, data.row, data.col));
      this.displayBoard(data.board);
    });

    this.game.on('gameReset', () => {
      console.log(this.language.translations.reset);
    });
  }

  displayBoard(board) {
    console.log(this.language.translations.boardHeader);
    console.log(this.language.translations.cellSeparator);
    board.forEach((row, index) => {
      console.log(`${index}| ${row.join(' | ')} |`);
      console.log(this.language.translations.cellSeparator);
    });
  }
}

// 2. UI Decorada - Con colores y emojis
class DecoratedUI extends BaseUI {
  setupEventListeners() {
    this.game.on('turnChanged', (data) => {
      console.log(`✨ ${this.language.translations.turn(data.nextPlayer)} ✨`);
    });

    this.game.on('invalidMove', () => {
      console.log(`🚫 ${this.language.translations.invalidMove} 🚫`);
    });

    this.game.on('gameWon', (data) => {
      console.log('🎊'.repeat(20));
      console.log(`🎉 ${this.language.translations.winner(data.winner)} 🎉`);
      console.log(`📊 Moves: ${data.moves}`);
      console.log('🎊'.repeat(20));
    });

    this.game.on('gameTied', (data) => {
      console.log('🌟'.repeat(15));
      console.log(`💫 ${this.language.translations.tied} 💫`);
      console.log(`📊 Total moves: ${data.moves}`);
      console.log('🌟'.repeat(15));
    });

    this.game.on('moveMade', (data) => {
      console.log(`🎯 ${this.language.translations.moveMade(data.player, data.row, data.col)}`);
      this.displayBoard(data.board);
    });

    this.game.on('gameReset', () => {
      console.log(`🔄 ${this.language.translations.reset} 🔄`);
    });
  }

  displayBoard(board) {
    console.log('\n' + '═'.repeat(20));
    console.log('    0     1     2');
    console.log('  ┌─────┬─────┬─────┐');
    board.forEach((row, i) => {
      const decoratedRow = row.map(cell => {
        if (cell === 'X') return '❌';
        if (cell === 'O') return '⭕';
        return '🔲';
      });
      console.log(`${i} │ ${decoratedRow.join('  │  ')} │`);
      if (i < 2) console.log('  ├─────┼─────┼─────┤');
    });
    console.log('  └─────┴─────┴─────┘');
    console.log('═'.repeat(20) + '\n');
  }
}

// 3. UI de Depuración - Con información técnica
class DebugUI extends BaseUI {
  setupEventListeners() {
    this.game.on('turnChanged', (data) => {
      console.log(`[DEBUG] ${this.language.translations.turn(data.nextPlayer)}`);
      console.log(`[DEBUG] Board state: ${JSON.stringify(this.game.getBoardSnapshot())}`);
    });

    this.game.on('invalidMove', (data) => {
      console.log(`[DEBUG] INVALID MOVE - Player: ${data.player}, Position: [${data.row},${data.col}]`);
      console.log(`[DEBUG] Current board: ${JSON.stringify(this.game.getBoardSnapshot())}`);
    });

    this.game.on('gameWon', (data) => {
      console.log(`[DEBUG] GAME WON - Winner: ${data.winner}, Total moves: ${data.moves}`);
      console.log(`[DEBUG] Final board: ${JSON.stringify(data.finalBoard)}`);
      console.log(`[DEBUG] Move history:`, this.game.movesHistory);
    });

    this.game.on('gameTied', (data) => {
      console.log(`[DEBUG] GAME TIED - Total moves: ${data.moves}`);
      console.log(`[DEBUG] Final board: ${JSON.stringify(data.finalBoard)}`);
    });

    this.game.on('moveMade', (data) => {
      console.log(`[DEBUG] MOVE EXECUTED - Player: ${data.player}, Position: [${data.row},${data.col}]`);
      this.displayBoard(data.board);
    });
  }

  displayBoard(board) {
    console.log('[DEBUG] Board visualization:');
    console.log(this.language.translations.boardHeader);
    console.log(this.language.translations.cellSeparator);
    board.forEach((row, index) => {
      console.log(`${index}| ${row.join(' | ')} |`);
      console.log(this.language.translations.cellSeparator);
    });
    console.log('[DEBUG] Board array:', JSON.stringify(board));
  }
}

// 4. UI Silenciosa - Solo registra en archivo (simulado)
class SilentUI extends BaseUI {
  constructor(gameCore, language = 'en') {
    super(gameCore, language);
    this.log = [];
  }

  setupEventListeners() {
    this.game.on('moveMade', (data) => {
      this.log.push(`MOVE: ${data.player} -> [${data.row},${data.col}]`);
    });

    this.game.on('gameWon', (data) => {
      this.log.push(`WIN: ${data.winner} in ${data.moves} moves`);
      this.printLog();
    });

    this.game.on('gameTied', (data) => {
      this.log.push(`TIE: after ${data.moves} moves`);
      this.printLog();
    });
  }

  displayBoard() {
    // No muestra el tablero visualmente
  }

  printLog() {
    console.log('📋 GAME LOG:');
    console.log('─'.repeat(30));
    this.log.forEach(entry => console.log(entry));
    console.log('─'.repeat(30));
    this.log = [];
  }
}

// 🚀 SISTEMA DE GESTIÓN MULTI-UI
class UIManager {
  constructor(gameCore) {
    this.game = gameCore;
    this.activeUIs = new Map();
  }

  registerUI(uiType, language = 'en', name = 'default') {
    const uiClasses = {
      minimalist: MinimalistUI,
      decorated: DecoratedUI,
      debug: DebugUI,
      silent: SilentUI
    };

    const UIClass = uiClasses[uiType];
    if (!UIClass) {
      throw new Error(`UI type '${uiType}' not supported`);
    }

    const ui = new UIClass(this.game, language);
    this.activeUIs.set(name, ui);
    
    console.log(`✅ Registered UI: ${name} (${uiType} - ${language})`);
    return ui;
  }

  unregisterUI(name) {
    const ui = this.activeUIs.get(name);
    if (ui) {
      ui.destroy();
      this.activeUIs.delete(name);
      console.log(`❌ Unregistered UI: ${name}`);
    }
  }

  listUIs() {
    console.log('\n📱 ACTIVE UIs:');
    console.log('─'.repeat(40));
    this.activeUIs.forEach((ui, name) => {
      console.log(`• ${name}: ${ui.constructor.name} (${ui.language.name})`);
    });
    console.log('─'.repeat(40));
  }

  broadcastToUIs(event, data) {
    this.activeUIs.forEach(ui => {
      if (ui[event]) {
        ui[event](data);
      }
    });
  }
}

// 💎 EJEMPLO DE USO COMPLETO
function demonstrateMultiUI() {
  console.log('\n' + '🌟'.repeat(50));
  console.log('🚀 DEMONSTRACIÓN: SISTEMA MULTI-UI/MULTI-IDIOMA');
  console.log('🌟'.repeat(50));

  // 1. Crear núcleo del juego
  const game = new TicTacToeCore();

  // 2. Crear gestor de UIs
  const uiManager = new UIManager(game);

  // 3. Registrar múltiples UIs en diferentes idiomas
  uiManager.registerUI('minimalist', 'es', 'es-minimal');
  uiManager.registerUI('decorated', 'en', 'en-decorated');
  uiManager.registerUI('debug', 'fr', 'fr-debug');
  uiManager.registerUI('silent', 'pt', 'pt-silent');

  // 4. Mostrar UIs activas
  uiManager.listUIs();

  // 5. Simular partida
  console.log('\n🎮 INICIANDO PARTIDA DE DEMOSTRACIÓN...\n');

  // Movimientos válidos
  game.makeMove(0, 0); // X
  game.makeMove(1, 1); // O
  game.makeMove(0, 1); // X
  game.makeMove(1, 2); // O

  // Movimiento inválido (debería mostrar mensaje en todos los UIs)
  game.makeMove(0, 0); // Posición ocupada

  // Continuar movimientos hasta ganar
  game.makeMove(0, 2); // X - GANA

  console.log('\n📊 PARTIDA TERMINADA\n');

  // 6. Reiniciar y mostrar cambio
  console.log('\n🔄 REINICIANDO JUEGO...\n');
  game.reset();

  // 7. Remover algunas UIs
  uiManager.unregisterUI('fr-debug');
  uiManager.listUIs();

  // 8. Segunda partida con menos UIs
  console.log('\n🎮 SEGUNDA PARTIDA...\n');
  game.makeMove(2, 2); // X
  game.makeMove(0, 0); // O
  game.makeMove(1, 1); // X
  game.makeMove(0, 1); // O
  game.makeMove(1, 0); // X
  game.makeMove(0, 2); // O
  game.makeMove(1, 2); // X
  game.makeMove(2, 0); // O
  game.makeMove(2, 1); // X - EMPATE

  console.log('\n🎯 DEMOSTRACIÓN COMPLETADA\n');
}

// 🏃‍♂️ EJECUTAR DEMOSTRACIÓN
demonstrateMultiUI();