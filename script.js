document.addEventListener('DOMContentLoaded', () => {

    // --- Variables Globales y Selectores ---
    const bolillasDisponibles = [];
    const bolillasSacadas = new Set();
    const cartillaNumeros = []; // Array 2D para la cartilla
    let miCartilla = []; // Array 2D para los elementos <td>

    const btnSacarBolilla = document.getElementById('sacar-bolilla');
    const letraBolillaEl = document.getElementById('letra-bolilla');
    const numeroBolillaEl = document.getElementById('numero-bolilla');
    const historialEl = document.getElementById('historial-bolillas');
    const tbodyCartilla = document.querySelector('#cartilla-bingo tbody');
    const btnRevisarBingo = document.getElementById('revisar-bingo');
    const animacionBingoEl = document.getElementById('animacion-bingo');
    
    // CAMBIO: Añadido selector para el círculo de la bolilla
    const bolillaActualEl = document.getElementById('bolilla-actual');

    // --- Funciones Principales ---

    /**
     * Inicia el juego: llena la tómbola y genera la cartilla
     */
    function iniciarJuego() {
        // CAMBIO: Pone la bolilla en '?' al iniciar
        letraBolillaEl.textContent = '?';
        numeroBolillaEl.textContent = ''; 
        
        llenarTombola();
        generarCartilla();
        renderizarCartilla();
    }

    /**
     * Llena el array 'bolillasDisponibles' con 75 bolillas (B: 1-15, I: 16-30, ...)
     */
    function llenarTombola() {
        const letras = ['B', 'I', 'N', 'G', 'O'];
        for (let i = 0; i < letras.length; i++) {
            const letra = letras[i];
            const min = i * 15 + 1;
            const max = (i + 1) * 15;
            for (let j = min; j <= max; j++) {
                bolillasDisponibles.push({ letra: letra, numero: j });
            }
        }
    }

    /**
     * Genera una cartilla 5x5 aleatoria y la guarda en 'cartillaNumeros'
     */
    function generarCartilla() {
        const rangos = [
            { min: 1, max: 15, numeros: [] },  // B
            { min: 16, max: 30, numeros: [] }, // I
            { min: 31, max: 45, numeros: [] }, // N
            { min: 46, max: 60, numeros: [] }, // G
            { min: 61, max: 75, numeros: [] }  // O
        ];

        // Genera 5 números aleatorios únicos por cada columna (rango)
        for (let col = 0; col < 5; col++) {
            const { min, max, numeros } = rangos[col];
            while (numeros.length < 5) {
                const num = Math.floor(Math.random() * (max - min + 1)) + min;
                if (!numeros.includes(num)) {
                    // CAMBIO: Pone "BINGO" en lugar de "GRATIS"
                    if (col === 2 && numeros.length === 2) {
                        numeros.push('BINGO');
                    } else {
                        numeros.push(num);
                    }
                }
            }
        }

        // Transpone la matriz para que 'cartillaNumeros' quede [fila][columna]
        for (let fila = 0; fila < 5; fila++) {
            cartillaNumeros[fila] = [];
            for (let col = 0; col < 5; col++) {
                cartillaNumeros[fila][col] = rangos[col].numeros[fila];
            }
        }
    }

    /**
     * Dibuja la cartilla en la tabla HTML y añade los listeners de click
     */
    function renderizarCartilla() {
        tbodyCartilla.innerHTML = ''; // Limpia la cartilla anterior
        miCartilla = []; // Resetea el array de celdas

        for (let fila = 0; fila < 5; fila++) {
            const tr = document.createElement('tr');
            miCartilla[fila] = [];
            
            for (let col = 0; col < 5; col++) {
                const td = document.createElement('td');
                const numero = cartillaNumeros[fila][col];
                td.textContent = numero;
                td.dataset.numero = numero; // Guarda el número en el dataset
                
                // CAMBIO: Marca el espacio "BINGO" y le da su clase especial
                if (numero === 'BINGO') {
                    td.classList.add('marcado');
                    td.classList.add('bingo-gratis'); // Clase de estilo
                }

                // Añade el evento para marcar/desmarcar
                td.addEventListener('click', () => toggleMarcar(td));
                
                tr.appendChild(td);
                miCartilla[fila].push(td); // Guarda la referencia al <td>
            }
            tbodyCartilla.appendChild(tr);
        }
    }

    /**
     * Saca una bolilla aleatoria de la tómbola
     */
    function sacarBolilla() {
        if (bolillasDisponibles.length === 0) {
            alert("¡Se han sacado todas las bolillas!");
            btnSacarBolilla.disabled = true;
            return;
        }

        const indiceAleatorio = Math.floor(Math.random() * bolillasDisponibles.length);
        const [bolilla] = bolillasDisponibles.splice(indiceAleatorio, 1);
        
        bolillasSacadas.add(bolilla.numero);

        // --- CAMBIO: Sección de animación ---
        // 1. Añade la clase 'girando' para activar la animación CSS
        bolillaActualEl.classList.add('girando');

        // 2. Actualiza el texto de la bolilla
        letraBolillaEl.textContent = bolilla.letra;
        numeroBolillaEl.textContent = bolilla.numero;

        // 3. Quita la clase después de que termine la animación (0.5s)
        //    para que pueda volver a girar en el próximo clic.
        setTimeout(() => {
            bolillaActualEl.classList.remove('girando');
        }, 500); // 500ms = 0.5s (debe coincidir con la duración en CSS)
        // --- Fin de la sección de animación ---

        // Añade al historial
        const bolillaHistorial = document.createElement('span');
        bolillaHistorial.textContent = `${bolilla.letra}${bolilla.numero}`;
        historialEl.appendChild(bolillaHistorial);
    }

    /**
     * Marca o desmarca una celda en la cartilla
     * @param {HTMLElement} td - La celda (<td>) que se clickeó
     */
    function toggleMarcar(td) {
        const numero = td.dataset.numero;

        // CAMBIO: No se puede desmarcar el espacio "BINGO"
        if (numero === 'BINGO') return;
        
        if (bolillasSacadas.has(parseInt(numero))) {
            td.classList.toggle('marcado');
        } else {
            alert(`¡La bolilla ${numero} aún no ha salido!`);
        }
    }

    /**
     * Revisa si el jugador ha completado una línea, columna o diagonal
     */
    function revisarSiHayBingo() {
        let esBingo = false;

        // 1. Revisar Filas
        for (let fila = 0; fila < 5; fila++) {
            if (miCartilla[fila].every(td => td.classList.contains('marcado'))) {
                esBingo = true;
                break;
            }
        }

        // 2. Revisar Columnas
        if (!esBingo) {
            for (let col = 0; col < 5; col++) {
                let colCompleta = true;
                for (let fila = 0; fila < 5; fila++) {
                    if (!miCartilla[fila][col].classList.contains('marcado')) {
                        colCompleta = false;
                        break;
                    }
                }
                if (colCompleta) {
                    esBingo = true;
                    break;
                }
            }
        }

        // 3. Revisar Diagonal 1
        if (!esBingo) {
            let diag1Completa = true;
            for (let i = 0; i < 5; i++) {
                if (!miCartilla[i][i].classList.contains('marcado')) {
                    diag1Completa = false;
                    break;
                }
            }
            if (diag1Completa) esBingo = true;
        }

        // 4. Revisar Diagonal 2
        if (!esBingo) {
            let diag2Completa = true;
            for (let i = 0; i < 5; i++) {
                if (!miCartilla[i][4 - i].classList.contains('marcado')) {
                    diag2Completa = false;
                    break;
                }
            }
            if (diag2Completa) esBingo = true;
        }

        // --- Mostrar Resultado ---
        if (esBingo) {
            mostrarAnimacionVictoria();
        } else {
            alert("¡Aún no hay BINGO! Sigue jugando.");
        }
    }

    /**
     * Muestra la animación de victoria
     */
    function mostrarAnimacionVictoria() {
        animacionBingoEl.classList.remove('oculto');
        btnSacarBolilla.disabled = true; 

        setTimeout(() => {
            animacionBingoEl.classList.add('oculto');
        }, 5000); 
    }


    // --- Event Listeners ---
    btnSacarBolilla.addEventListener('click', sacarBolilla);
    btnRevisarBingo.addEventListener('click', revisarSiHayBingo);

    // --- Iniciar el juego al cargar la página ---
    iniciarJuego();
});