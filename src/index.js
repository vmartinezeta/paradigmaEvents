import chalk from "chalk";
import EventEmitter from "events";
import readline from "readline";

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
    constructor(ficha) {
        this.ficha = ficha;
    }

    colocarFicha(x, y, cuadricula) {
        const celda = cuadricula.fromXY(x, y);
        celda.ficha = this.ficha;
        cuadricula.actualizarCelda(celda);
    }

}

class PlayerCPU extends Player {
    constructor(ficha) {
        super(ficha);
    }

    colocar(x, y, cuadricula) {
        this.colocarFicha(x, y, cuadricula);
    }

    colocarRandom(cuadricula) {
        const celdas = cuadricula.toArray().filter(celda => celda.isDisponible());
        const index = Math.floor(Math.random() * celdas.length);
        const { x, y } = celdas[index];
        this.colocarFicha(x, y, cuadricula);
    }

}

class CuadriculaProxy extends PlayerCPU {
    constructor() {
        super(new Ficha(0, "0"));
        this.jugador = new Player(new Ficha(1, "x"));
        this.cuadricula = new Cuadricula();
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
            const result = this.puedeGanarCPU();
            if (result.ok) {
                const l = result.linea;
                const {x, y} = l.getCeldaDisponible();
                this.colocar(x, y, this.cuadricula);
            } else {
                this.colocarRandom(this.cuadricula);
            }
        } else {
            this.jugador.colocarFicha(x, y, this.cuadricula);
        }
    }


    puedeGanarCPU() {
        for (const l of this.cuadricula.toLineaArray()) {
            const lineaManager = new LineaManager(l, this.ficha);
            if (lineaManager.puedeGanar()) {
                return {
                    ok: true,
                    linea: l
                };
            }
        }
        return {ok: false, linea:null};
    }

    isCPU() {
        return this.fichaEnJuego.id === this.ficha.id;
    }

    getLineaGanador() {
        let ficha = this.jugador.ficha;
        if (this.ganoCpu()) {
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

    ganoCpu() {
        for (const l of this.cuadricula.toLineaArray()) {
            const lineaManager = new LineaManager(l, this.ficha);
            if (lineaManager.hayGanador()) {
                return true;
            }
        }
        return false;
    }

    hayGanador() {
        for (const l of this.cuadricula.toLineaArray()) {
            let lineaManager = new LineaManager(l, this.ficha);
            if (lineaManager.hayGanador()) {
                return true;
            } 

            lineaManager = new LineaManager(l, this.jugador.ficha);
            if (lineaManager.hayGanador()) {
                return true;
            }
        }
        return false;
    }

    hayEmpate() {
        return this.cuadricula.isCompletada();
    }

    finalizoJuego() {
        return this.hayGanador() || this.hayEmpate();
    }

}

class LineaManager {
    constructor(linea, propietario){
        this.linea = linea;
        this.propietario = propietario;
    }

    hayGanador() {
        return this.linea.toBitArray().every(bit => bit === this.propietario.id);
    }

    puedeGanar() {
        const l = this.linea.newInstance();
        l.eliminarEspacios();
        return l.celdas.length === 2 && l.celdas.every(c => c.ficha.id === this.propietario.id);
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

    getCeldaDisponible () {
        return this.celdas.find(c => c.isDisponible());
    }

    newInstance() {
        return new Linea(this.celdas, this.orientacion);
    }

    eliminarEspacios() {
        for(let i=0; i<3; i++) {
            const celda = this.celdas[i];
            if (celda && celda.isDisponible()) {
                this.celdas.splice(i, 1);
            }
        }
    }

}


class TicTacToe extends EventEmitter {
    constructor(proxy) {
        super();
        this.proxy = proxy;
    }

    async colocacionJugador() {
        console.log(chalk.underline.italic("Turno: ", this.proxy.fichaEnJuego.simbolo));
        console.log(this.proxy.cuadricula.toString());
        this.pregunta("Ingrese un numero de 1-9: ").then(numero => {
            const celda = this.proxy.cuadricula.fromId(+numero);

            if (celda && celda.isDisponible()) {
                const { x, y } = celda;
                this.proxy.hacerMovimiento(x, y);
                if (this.proxy.finalizoJuego()) {
                    console.log(this.proxy.cuadricula.toString());
                    if (this.proxy.hayGanador()) {
                        if (this.proxy.ganoCpu()) {
                            // console.log("Haz fallado");
                            this.emit("ganador", {
                                isCPU:true,
                                linea: this.proxy.getLineaGanador()
                            });
                        } else {
                            this.emit("ganador", {
                                isCPU:false,
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
                this.colocacionCPU();
            } else {
                this.colocacionJugador();
            }
        });
    }

    colocacionCPU() {
        console.clear();
        console.log("loading...");
        setTimeout(() => {
            console.clear();
            console.log(chalk.underline.italic("Turno: ", this.proxy.fichaEnJuego.simbolo));
            this.proxy.hacerMovimiento();
            console.log(this.proxy.cuadricula.toString());
            if (this.proxy.finalizoJuego()) {
                if (this.proxy.hayGanador()) {
                    if (this.proxy.ganoCpu()) {
                            this.emit("ganador", {
                                isCPU:true,
                                linea: this.proxy.getLineaGanador()
                            });
                    } else {
                            this.emit("ganador", {
                                isCPU:false,
                                linea: this.proxy.getLineaGanador()
                            });
                    }
                } else if (this.proxy.hayEmpate()) {
                    this.emit("empate");
                }
                return;
            }
            this.proxy.cambiarTurno();
            this.colocacionJugador();
        }, 1000);
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

    start() {
        this.colocacionCPU();
    }

}


function playGame() {
    const proxy = new CuadriculaProxy();
    const tictactoe = new TicTacToe(proxy);
    tictactoe.start();

    

    tictactoe.on("ganador", ({isCPU, linea})=> {
        if (isCPU) {
            console.log("Haz fallado.");        
        } else {
            console.log("Haz ganado.");
        }
        console.log("Orientacion: ",linea.orientacion);
        console.log(linea.toString());
    });

    tictactoe.on("empate", () => {
        console.log("empataron");
    });
}

playGame(); // reintentar