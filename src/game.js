class TicTacToe extends EventEmitter {
  // ... (métodos anteriores)

  procesarMovimiento(fila, columna) {
    if (!this.esMovimientoValido(fila, columna)) {
      this.emit('movimientoInvalido', { fila, columna, jugador: this.currentPlayer });
      return;
    }

    this.hacerMovimiento(fila, columna);
    this.emit('movimientoValido', { fila, columna, jugador: this.currentPlayer });

    if (this.hayGanador()) {
      this.emit('juegoGanado', { ganador: this.currentPlayer });
    } else if (this.hayEmpate()) {
      this.emit('juegoEmpatado');
    } else {
      this.cambiarTurno();
      this.emit('turnoCambiado', { jugador: this.currentPlayer });
    }
  }
}





class ConsoleUI {
  constructor(juego) {
    this.juego = juego;
    this.configurarEventos();
  }

  configurarEventos() {
    this.juego.on('movimientoInvalido', (data) => {
      console.log(`❌ Movimiento inválido en [${data.fila}, ${data.columna}]. Intenta de nuevo.`);
    });

    this.juego.on('movimientoValido', (data) => {
      console.log(`✅ Jugador ${data.jugador} movió en [${data.fila}, ${data.columna}].`);
    });

    this.juego.on('juegoGanado', (data) => {
      console.log(`🎉 ¡Felicidades! Jugador ${data.ganador} ha ganado el juego.`);
    });

    this.juego.on('juegoEmpatado', () => {
      console.log(`🤝 El juego ha terminado en empate.`);
    });

    this.juego.on('turnoCambiado', (data) => {
      console.log(`\n🎮 Turno del jugador: ${data.jugador}`);
    });
  }

  iniciar() {
    console.log('Bienvenido a Tic-Tac-Toe!');
    this.juego.iniciar();
  }
}


// vista principal
const juego = new TicTacToe();
// una posible vista secundaria
const ui = new ConsoleUI(juego);
ui.iniciar();

