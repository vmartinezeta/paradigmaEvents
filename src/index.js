import chalk from "chalk";
import EventEmitter from "events";
// import readline from "readline";
import rl from "readline";

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout
});


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

class PlayerCPU extends Player {
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

class CuadriculaProxy extends PlayerCPU {
    constructor(fichaCPU, fichaJugador, cuadricula) {
        super(fichaCPU, cuadricula);
        this.jugador = new Player(fichaJugador, cuadricula);
        this.fichaEnJuego = this.ficha;
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

class TicTacToe extends EventEmitter {
    constructor(proxy) {
        super();
        this.proxy = proxy;
        this.gameActive = true;
    }

    async colocacionJugador() {
        console.log(this.proxy.cuadricula.toString());
        readline.question("Ingrese un numero de 1-9: ", numero => {
            const celda = this.proxy.cuadricula.fromId(+numero);

            if (celda && celda.isDisponible()) {
                const { x, y } = celda;
                this.proxy.hacerMovimiento(x, y);
                if (this.proxy.finalizoJuego()) {
                    console.log(this.proxy.cuadricula.toString());
                    if (this.proxy.hayGanador()) {
                        if (this.proxy.gano()) {
                            // console.log("Haz fallado");
                            this.emit("ganador", {
                                isCPU: true,
                                linea: this.proxy.getLineaGanador()
                            });
                        } else {
                            this.emit("ganador", {
                                isCPU: false,
                                linea: this.proxy.getLineaGanador()
                            });
                        }
                    } else if (this.proxy.hayEmpate()) {
                        // console.log("Hay un empate");
                        this.emit("empate");
                    }
                    return;
                }
                this.proxy.cambiarTurno();
                this.promptPlayer();
            } else {
                this.colocacionJugador();
            }
        });
    }

    colocacionCPU() {
            console.clear();
            console.log(chalk.underline.italic("Turno: ", this.proxy.fichaEnJuego.simbolo));
            this.proxy.hacerMovimiento();
            console.log(this.proxy.cuadricula.toString());
            if (this.proxy.finalizoJuego()) {
                if (this.proxy.hayGanador()) {
                    if (this.proxy.gano()) {
                        this.emit("ganador", {
                            isCPU: true,
                            linea: this.proxy.getLineaGanador()
                        });
                    } else {
                        this.emit("ganador", {
                            isCPU: false,
                            linea: this.proxy.getLineaGanador()
                        });
                    }
                } else if (this.proxy.hayEmpate()) {
                    this.emit("empate");
                }
                return;
            }
            this.proxy.cambiarTurno();
            this.promptPlayer();
    }

    pregunta(pregunta) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(pregunta, (respuesta) => {
                rl.close();
                resolve(respuesta);
            });
        });
    }

    start2() {
        this.colocacionCPU();
    }


    start() {
        this.processMainMenu();
    }

    promptMainMenu() {
        console.log(`\n🎮 Juego TicTacToe`);
        console.log('Opciones:');
        console.log('1. Iniciar juego');
        console.log('2. Configurar fichas(CPU=0, Jugador=x)');
        console.log('3. Salir');

        readline.question('Elige una opción: ', (input) => {
            this.processMainMenu(input.trim());
        });
    }

    processMainMenu(option) {
        switch (option) {
            case '1':
                this.promptPlayer();
                break;
            case '2':
                break;
            case '3':
                console.log('¡Hasta luego! 👋');
                readline.close();
                break;
            default:
                console.log('❌ Opción no válida');
                this.promptMainMenu();
        }        
    }

    promptPlayer() {
        // Si es modo CPU y es el turno de la CPU, entonces la CPU juega
        if (this.proxy.isCPU()) {
            console.log('\n🤖 Turno de la CPU...');
            // Simulamos un pensamiento de la CPU
            setTimeout(() => {
                this.colocacionCPU();
            }, 1000);
            return;
        }

        // Es turno de un jugador humano, mostramos el menú
        console.log(`\n🎮 Turno del jugador: ${this.proxy.fichaEnJuego.simbolo}`);
        console.log('Opciones:');
        console.log('1. Hacer movimiento');
        console.log('2. Deshacer último movimiento');
        console.log('3. Ver historial');
        console.log('4. Atras');

        readline.question('Elige una opción: ', (input) => {
            this.processMenuInput(input.trim());
        });
    }

    processMenuInput(option) {
        switch (option) {
            case '1':
                this.colocacionJugador();
                break;
            case '2':
                // this.undoLastMove();
                break;
            case '3':
                // this.showHistory();
                break;
            case '4':
                // console.log('¡Hasta luego! 👋');
                // readline.close();
                this.promptMainMenu();
                this.gameActive = false;
                break;
            default:
                console.log('❌ Opción no válida');
                this.promptPlayer();
        }
    }

}

function playGame() {
    const proxy = new CuadriculaProxy(new Ficha(0, '0'), new Ficha(1, 'x'), new Cuadricula());
    const tictactoe = new TicTacToe(proxy);
    tictactoe.start();

    tictactoe.on("ganador", ({ isCPU, linea }) => {
        if (isCPU) {
            console.log("Haz fallado.");
        } else {
            console.log("Haz ganado.");
        }
        console.log("Orientacion: ", linea.orientacion);
        console.log(linea.toString());
    });

    tictactoe.on("empate", () => {
        console.log("empataron");
    });
}

playGame();