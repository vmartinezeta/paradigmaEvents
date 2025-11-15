import EventEmitter from "events";
import readline from "readline";
import chalk from "chalk";

class Ficha {
    constructor(id, simbolo) {
        this.id = id;
        this.simbolo = simbolo;
    }

    static vacio() {
        return new Ficha(4, "-");
    }
}

class Celda {
    constructor(id, x, y, ficha) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.ficha = ficha || Ficha.vacio();
    }

    isDisponible() {
        return this.ficha.id === 4;
    }

    newInstance() {
        return new Celda(this.id, this.x, this.y, this.ficha);
    }
}

class Cuadricula {
    constructor() {
        this.celdas = [];
        for (let i = 0; i < 3; i++) {
            this.celdas[i] = [];
            for (let j = 0; j < 3; j++) {
                const id = 3 * i + j + 1;
                this.celdas[i][j] = new Celda(id, i, j);
            }
        }
    }

    fromId(id) {
        return this.toArray().find(celda => celda.id === id);
    }

    fromXY(x, y) {
        return this.celdas[x][y];
    }

    actualizarCelda(celda) {
        this.celdas[celda.x][celda.y] = celda;
    }

    toArray() {
        const celdas = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                celdas.push(this.celdas[i][j]);
            }
        }
        return celdas;
    }

    toLineaArray() {
        const lineas = [];
        const celdasDiagonal = [];
        const celdasDiagonal2 = [];
        for (let i = 0; i < 3; i++) {
            const celdasHorizontales = [];
            const celdasVerticales = [];
            for (let j = 0; j < 3; j++) {
                celdasHorizontales.push(this.celdas[i][j]);
                celdasVerticales.push(this.celdas[j][i]);
                if (i === j) {
                    celdasDiagonal2.push(this.celdas[i][j]);
                    celdasDiagonal.push(this.celdas[2 - j][j]);
                }
            }
            lineas.push(new Linea(celdasHorizontales, 'HORIZONTAL'));
            lineas.push(new Linea(celdasVerticales, 'VERTICAL'));
        }

        lineas.push(new Linea(celdasDiagonal, 'DIAGONAL'));
        lineas.push(new Linea(celdasDiagonal2, 'DIAGONAL2'));

        return lineas;
    }

    toString() {
        return this.toLineaArray().filter(l => l.orientacion === 'HORIZONTAL').reduce((text, l) => text + l.toString() + "\n", "");
    }

    isCompletada() {
        return this.toArray().filter(cell => cell.isDisponible()).length === 0;
    }

}

class Linea {
    constructor(celdas, orientacion) {
        this.celdas = celdas;
        this.orientacion = orientacion;
    }

    toBitArray() {
        return this.celdas.map(c => c.ficha.id);
    }

    toString() {
        return this.celdas.reduce((text, celda) => text + "\t" + celda.ficha.simbolo, "");
    }

    getCeldaDisponible() {
        return this.celdas.find(c => c.isDisponible());
    }

    newInstance() {
        return new Linea(this.celdas, this.orientacion);
    }

    tieneUnEspacio() {
        return this.celdas.filter(c => c.isDisponible()).length === 1;
    }

    getCeldaOcupadas() {
        return this.celdas.filter(c => !c.isDisponible());
    }
}

class LineaManager {
    constructor(linea, propietario) {
        this.linea = linea;
        this.propietario = propietario;
    }

    hayGanador() {
        return this.linea.toBitArray().every(bit => bit === this.propietario.id);
    }

    puedeGanar() {
        return this.linea.tieneUnEspacio() && this.linea.getCeldaOcupadas().every(c => c.ficha.id === this.propietario.id);
    }

}

class Player {
    constructor(ficha, cuadricula) {
        this.ficha = ficha;
        this.cuadricula = cuadricula;
    }

    colocarFicha(x, y) {
        const celda = this.cuadricula.fromXY(x, y);
        celda.ficha = this.ficha;
        this.cuadricula.actualizarCelda(celda);
    }

    puedeGanar() {
        for (const l of this.cuadricula.toLineaArray()) {
            const lineaManager = new LineaManager(l, this.ficha);
            if (lineaManager.puedeGanar()) {
                return {
                    ok: true,
                    linea: l
                };
            }
        }
        return { ok: false, linea: null };
    }

    gano() {
        for (const l of this.cuadricula.toLineaArray()) {
            const lineaManager = new LineaManager(l, this.ficha);
            if (lineaManager.hayGanador()) {
                return true;
            }
        }
        return false;
    }

}

class CPUPlayer extends Player {
    constructor(ficha, cuadricula) {
        super(ficha, cuadricula);
    }

    colocarRandom() {
        const celdas = this.cuadricula.toArray().filter(celda => celda.isDisponible());
        const index = Math.floor(Math.random() * celdas.length);
        const { x, y } = celdas[index];
        this.colocarFicha(x, y);
    }

    start() {
        const result = this.puedeGanar();
        if (result.ok) {
            const l = result.linea;
            const { x, y } = l.getCeldaDisponible();
            this.colocarFicha(x, y);
        } else {
            this.colocarRandom();
        }
    }

}

class CuadriculaProxy extends CPUPlayer {
    constructor(fichaCPU, fichaJugador, cuadricula) {
        super(fichaCPU, cuadricula);
        this.jugador = new Player(fichaJugador, cuadricula);
        this.fichaEnJuego = fichaCPU;
    }

    cambiarTurno() {
        if (this.isCPU()) {
            this.fichaEnJuego = this.jugador.ficha;
        } else {
            this.fichaEnJuego = this.ficha;
        }
    }

    hacerMovimiento(x, y) {
        if (this.isCPU()) {
            this.start();
        } else {
            this.jugador.colocarFicha(x, y);
        }
    }

    isCPU() {
        return this.fichaEnJuego.id === this.ficha.id;
    }

    getLineaGanador() {
        let ficha = this.jugador.ficha;
        if (this.gano()) {
            ficha = this.ficha;
        }
        for (const l of this.cuadricula.toLineaArray()) {
            const lineaManager = new LineaManager(l, ficha);
            if (lineaManager.hayGanador()) {
                return l;
            }
        }
        return null;
    }

    hayGanador() {
        return this.gano() || this.jugador.gano();
    }

    hayEmpate() {
        return this.cuadricula.isCompletada();
    }

    finalizoJuego() {
        return this.hayGanador() || this.hayEmpate();
    }

}

class UIManager extends EventEmitter {
    constructor(proxy, language) {
        super();
        this.proxy = proxy;
        this.language = LanguageStrategy.getStrategy(language);
        this.gameActive = true;
        this.readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.setUp();
    }

    getCelda(input) {
        const sistemaDecimal = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        if (!sistemaDecimal.includes(input)) {
            return {
                ok: false,
                celda: null
            }
        }
        const celda = this.proxy.cuadricula.fromId(input);
        if (!celda.isDisponible()) {
            return {
                ok: false,
                celda
            };
        }
        return {
            ok: true,
            celda
        };
    }

    async colocacionJugador() {
        const numero = await this.inputConsole(this.language.translations.inputCell);
        const { ok, celda } = this.getCelda(+numero);
        if (!ok) {
            return this.colocacionJugador();
        }

        const { x, y } = celda;
        this.proxy.hacerMovimiento(x, y);

        if (this.proxy.finalizoJuego()) {
            if (this.proxy.hayGanador()) {
                const isCPU = this.proxy.gano() ? true : false;
                this.emit("ganador", {
                    isCPU,
                    linea: this.proxy.getLineaGanador()
                });
            } else if (this.proxy.hayEmpate()) {
                this.emit("empate");
            }

            return this.emit('gameOver', {
                cpu: this.proxy.ficha,
                jugador: this.proxy.jugador.ficha
            });
        }
        this.proxy.cambiarTurno();
        this.promptPlayer();
    }

    colocacionCPU() {
        this.proxy.hacerMovimiento();
        this.emit('turno:CPU', { turno: this.proxy.fichaEnJuego.simbolo });
        if (this.proxy.finalizoJuego()) {
            if (this.proxy.hayGanador()) {
                const isCPU = this.proxy.gano() ? true : false;
                this.emit("ganador", {
                    isCPU,
                    linea: this.proxy.getLineaGanador()
                });
            } else if (this.proxy.hayEmpate()) {
                this.emit("empate");
            }

            return this.emit('gameOver', {
                cpu: this.proxy.ficha,
                jugador: this.proxy.jugador.ficha
            });
        }
        this.proxy.cambiarTurno();
        this.promptPlayer();
    }

    inputConsole(pregunta) {
        return new Promise((resolve) => {
            this.readline.question(pregunta, (respuesta) => {
                resolve(respuesta);
            });
        });
    }

    setUp() {
        throw new TypeError('Metodo abstracto para escuchar los eventos del core');
    }

    tablero() {
        throw new TypeError('Metodo abstracto para mostrar el tablero');
    }

    render() {
        this.promptMainMenu();
    }

    async promptMainMenu() {
        const cpu = this.proxy.ficha.simbolo;
        const player = this.proxy.jugador.ficha.simbolo;

        console.log(this.language.translations.welcome);
        console.log(this.language.translations.mainMenu(cpu, player));

        const input = await this.inputConsole(this.language.translations.inputOption);
        this.processMainMenu(input.trim());
    }

    processMainMenu(option) {
        switch (option) {
            case '1':
                this.promptPlayer();
                break;
            case '2':
                this.promptIntercambioFichas();
                break;
            case '3':
                console.log(this.language.translations.gameAbort);
                this.readline.close();
                break;
            default:
                console.log(this.language.translations.invalidOption);
                this.promptMainMenu();
        }
    }

    intercambiarFichas(simbolo) {
        if (![this.proxy.ficha.simbolo, this.proxy.jugador.ficha.simbolo].includes(simbolo)) return;

        if (this.proxy.ficha.simbolo !== simbolo) {
            const ficha = this.proxy.ficha;
            this.proxy.ficha = this.proxy.jugador.ficha;
            this.proxy.fichaEnJuego = this.proxy.ficha
            this.proxy.jugador.ficha = ficha;
        }
    }

    async promptIntercambioFichas() {
        console.log(`CPU=${this.proxy.ficha.simbolo}, Jugador=${this.proxy.jugador.ficha.simbolo}`);
        const input = await this.inputConsole('Ingrese la ficha: ');
        this.intercambiarFichas(input.trim().toLocaleLowerCase());
        this.promptMainMenu();
    }

    printSubMenu() {
        console.log(this.language.translations.subMenu());
    }

    async promptPlayer() {
        if (this.proxy.isCPU()) {
            setTimeout(() => {
                this.colocacionCPU();
            }, 1000);
            return;
        }

        this.emit('turno:player', { turno: this.proxy.fichaEnJuego.simbolo });
        const input = await this.inputConsole(this.language.translations.inputOption);
        this.processSubMenuInput(input.trim());
    }

    processSubMenuInput(option) {
        switch (option) {
            case '1':
                this.colocacionJugador();
                break;
            case '4':
                this.promptMainMenu();
                this.gameActive = false;
                break;
            default:
                console.log(this.language.translations.invalidOption);
                this.promptPlayer();
        }
    }

}

class TicTacToe extends UIManager {
    constructor(proxy) {
        super(proxy);
    }

    setUp() {
        this.on('turno:CPU', ({ turno }) => {
            console.log(this.language.translations.turn(turno));
            this.tablero();
        });

        this.on('turno:player', ({ turno }) => {
            console.log(this.language.translations.turn(turno));
            this.printSubMenu();
        });

        this.on('ganador', ({ isCPU, linea }) => {
            if (isCPU) {
                console.log(this.language.translations.loser);
            } else {
                console.log(this.language.translations.winner);
            }
            console.log(this.language.translations.orientation(linea.orientacion));
        });

        this.on('empate', () => {
            console.log(this.language.translations.tied);
        });

        this.on('gameOver', ({ cpu, jugador }) => {
            this.readline.close();
            if (this.proxy.hayGanador() && !this.proxy.gano()) {
                this.tablero();
            }
            console.log(this.language.translations.gameOver);
            setTimeout(() => {
                playGame(cpu, jugador);
            }, 1000);
        });
    }

    tablero() {
        this.proxy.cuadricula.toLineaArray().filter(l => l.orientacion === 'HORIZONTAL').forEach(l => {
            console.log(l.toString());
        });
    }
}

class TicTacToeDecorated extends UIManager {
    constructor(proxy, language) {
        super(proxy, language);
    }

    setUp() {
        this.on('turno:CPU', ({ turno }) => {
            console.log(chalk.underline.bold(this.language.translations.turn(turno)));
            this.tablero();
        });

        this.on('turno:player', ({ turno }) => {
            console.log(chalk.underline.bold(this.language.translations.turn(turno)));
            this.printSubMenu();
        });

        this.on('ganador', ({ isCPU, linea }) => {
            if (isCPU) {
                console.log(chalk.italic(this.language.translations.loser));
            } else {
                console.log(chalk.italic(this.language.translations.winner));
            }
            console.log(chalk.bold(this.language.translations.orientation(linea.orientacion)));
        });

        this.on('empate', () => {
            console.log(chalk.bold(this.language.translations.tied));
        });

        this.on('gameOver', ({ cpu, jugador }) => {
            this.readline.close();
            if (this.proxy.hayGanador() && !this.proxy.gano()) {
                this.tablero();
            }
            console.log(chalk.bold.green(this.language.translations.gameOver));
            setTimeout(() => {
                playGame(cpu, jugador);
            }, 1000);
        });
    }

    tablero() {
        console.log('\n  0   1   2');
        console.log(' ┌───┬───┬───┐');
        this.proxy.cuadricula.celdas.forEach((row, i) => {
            console.log(`${i}│ ${row.map(c=>c.ficha.simbolo).join(' │ ')} │`);
            if (i < 2) console.log(' ├───┼───┼───┤');
        });
        console.log(' └───┴───┴───┘');
    }

}

class LanguageStrategy {
  static getStrategy(language) {
    const strategies = {
      es: SpanishLanguage,
      en: EnglishLanguage
    };
    return strategies[language] || EnglishLanguage;
  }
}

class SpanishLanguage {
  static translations = {
    welcome: "🎮 TRES EN RAYA - Sistema Multi-UI",
    turn: player => `🧩 Turno de ${player}`,
    winner: "🏆 ¡Felicidades! haz ganado",
    loser: "❌ Haz fallado",
    tied: "🤝 ¡Es un EMPATE! ¡Bien jugado!",
    gameOver: "Fin del juego",
    reset: "🔄 Juego reiniciado",
    inputOption: "Elige una opcion?: ",
    inputCell: "Ingrese un numero(1-9)?: ",
    gameAbort: '¡Hasta luego! 👋',
    invalidOption: '❌ Opción no válida',
    orientation: (orientation) => `Orientacion: ${orientation}`,
    mainMenu: (cpu, player) => {
        return `Opciones:
        1. Iniciar juego
        2. Configurar fichas(CPU=${cpu}, Jugador=${player})
        3. Salir`;
    }, 
    subMenu: ()=> {
        return `Opciones:
        1. Hacer movimiento
        2. Deshacer último movimiento
        3. Ver historial
        4. Atras`;
    }
  };
}

class EnglishLanguage{
  static translations = {
    welcome: "🎮 TIC TAC TOE - Multi-UI System",
    turn: player => `🧩 ${player}´s turn`,
    winner: "🏆 You WINS! Congratulations!",
    loser: "❌ You have lost",
    tied: "🤝 It's a TIE! Well played both!",
    gameOver: "Game over!",
    reset: "🔄 Game reset",
    inputOption: "Do you select a option?: ",
    inputCell: 'Do you insert a number(1-9)?: ',
    gameAbort: '¡see you soon! 👋',
    invalidOption: '❌ Invalid option',
    orientation: (orientation) => `Orientation: ${orientation}`,
    mainMenu: (cpu, player) => {
        return `Options:
        1. Start game
        2. Configure player(CPU=${cpu}, Jugador=${player})
        3. Close windows`;
    },
    subMenu: ()=> {
        return `Options:
        1. Make move
        2. Undo move
        3. Show history
        4. Go to back`;
    }
  };
}


function playGame(fichaCPU, fichaPlayer) {
    const proxy = new CuadriculaProxy(fichaCPU, fichaPlayer, new Cuadricula());
    const ticTacToe = new TicTacToeDecorated(proxy, 'en');
    ticTacToe.render();
}

playGame(new Ficha(0, '0'), new Ficha(1, 'x'));