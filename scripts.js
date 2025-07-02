// Constante de Coulomb
const k = 9e9;

// Polyfill para roundRect si no está disponible
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

// Función auxiliar para dibujar etiqueta con fondo mejorado
function dibujarEtiquetaConFondo(ctx, texto, posicion, colorTexto = '#333', colorFondo = 'rgba(255, 255, 255, 0.95)', colorBorde = 'rgba(0, 0, 0, 0.2)') {
    const textMetrics = ctx.measureText(texto);
    const textWidth = textMetrics.width;
    const textHeight = 16;
    const padding = 6;
    const borderRadius = 4;
    
    // Dimensiones del fondo
    const bgWidth = textWidth + 2 * padding;
    const bgHeight = textHeight + 2 * padding;
    const bgX = posicion.x - bgWidth / 2;
    const bgY = posicion.y - textHeight / 2 - padding;
    
    // Dibujar fondo con borde redondeado
    ctx.save();
    
    // Fondo
    ctx.fillStyle = colorFondo;
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgWidth, bgHeight, borderRadius);
    ctx.fill();
    
    // Borde
    if (colorBorde) {
        ctx.strokeStyle = colorBorde;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Texto
    ctx.fillStyle = colorTexto;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, posicion.x, posicion.y);
    
    ctx.restore();
    
    return {
        x: bgX,
        y: bgY,
        width: bgWidth,
        height: bgHeight
    };
}

// Función auxiliar para detectar colisiones entre rectángulos
function detectarColision(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
}

// Función auxiliar para ajustar posición de etiqueta evitando colisiones
function ajustarPosicionEtiqueta(posicionInicial, texto, ctx, etiquetasExistentes, margen = 5, tipo = 'general') {
    const textMetrics = ctx.measureText(texto);
    const textWidth = textMetrics.width;
    const textHeight = 16; // Altura aproximada del texto
    
    // Definir posiciones alternativas según el tipo de etiqueta
    let posicionesAlternativas = [];
    
    switch (tipo) {
        case 'distancia':
            // Para etiquetas de distancia, preferir posiciones perpendiculares al lado
            posicionesAlternativas = [
                { x: posicionInicial.x, y: posicionInicial.y }, // Posición original
                { x: posicionInicial.x + 25, y: posicionInicial.y }, // Derecha
                { x: posicionInicial.x - 25, y: posicionInicial.y }, // Izquierda
                { x: posicionInicial.x, y: posicionInicial.y - 25 }, // Arriba
                { x: posicionInicial.x, y: posicionInicial.y + 25 }, // Abajo
                { x: posicionInicial.x + 20, y: posicionInicial.y - 20 }, // Diagonal superior derecha
                { x: posicionInicial.x - 20, y: posicionInicial.y - 20 }, // Diagonal superior izquierda
                { x: posicionInicial.x + 20, y: posicionInicial.y + 20 }, // Diagonal inferior derecha
                { x: posicionInicial.x - 20, y: posicionInicial.y + 20 }, // Diagonal inferior izquierda
            ];
            break;
            
        case 'angulo':
            // Para etiquetas de ángulo, preferir posiciones radiales
            posicionesAlternativas = [
                { x: posicionInicial.x, y: posicionInicial.y }, // Posición original
                { x: posicionInicial.x + 20, y: posicionInicial.y - 15 }, // Superior derecha
                { x: posicionInicial.x - 20, y: posicionInicial.y - 15 }, // Superior izquierda
                { x: posicionInicial.x + 20, y: posicionInicial.y + 15 }, // Inferior derecha
                { x: posicionInicial.x - 20, y: posicionInicial.y + 15 }, // Inferior izquierda
                { x: posicionInicial.x + 15, y: posicionInicial.y }, // Derecha
                { x: posicionInicial.x - 15, y: posicionInicial.y }, // Izquierda
                { x: posicionInicial.x, y: posicionInicial.y - 20 }, // Arriba
                { x: posicionInicial.x, y: posicionInicial.y + 20 }, // Abajo
            ];
            break;
            
        case 'carga':
            // Para etiquetas de carga, preferir posiciones verticales
            posicionesAlternativas = [
                { x: posicionInicial.x, y: posicionInicial.y }, // Posición original
                { x: posicionInicial.x + 15, y: posicionInicial.y }, // Derecha
                { x: posicionInicial.x - 15, y: posicionInicial.y }, // Izquierda
                { x: posicionInicial.x + 10, y: posicionInicial.y - 10 }, // Diagonal superior derecha
                { x: posicionInicial.x - 10, y: posicionInicial.y - 10 }, // Diagonal superior izquierda
                { x: posicionInicial.x + 10, y: posicionInicial.y + 10 }, // Diagonal inferior derecha
                { x: posicionInicial.x - 10, y: posicionInicial.y + 10 }, // Diagonal inferior izquierda
            ];
            break;
            
        case 'fuerza':
            // Para etiquetas de fuerza, preferir posiciones perpendiculares al vector
            posicionesAlternativas = [
                { x: posicionInicial.x, y: posicionInicial.y }, // Posición original
                { x: posicionInicial.x + 20, y: posicionInicial.y }, // Derecha
                { x: posicionInicial.x - 20, y: posicionInicial.y }, // Izquierda
                { x: posicionInicial.x, y: posicionInicial.y - 20 }, // Arriba
                { x: posicionInicial.x, y: posicionInicial.y + 20 }, // Abajo
                { x: posicionInicial.x + 15, y: posicionInicial.y - 15 }, // Diagonal superior derecha
                { x: posicionInicial.x - 15, y: posicionInicial.y - 15 }, // Diagonal superior izquierda
                { x: posicionInicial.x + 15, y: posicionInicial.y + 15 }, // Diagonal inferior derecha
                { x: posicionInicial.x - 15, y: posicionInicial.y + 15 }, // Diagonal inferior izquierda
                { x: posicionInicial.x + 25, y: posicionInicial.y - 10 }, // Más lejos derecha arriba
                { x: posicionInicial.x - 25, y: posicionInicial.y - 10 }, // Más lejos izquierda arriba
                { x: posicionInicial.x + 25, y: posicionInicial.y + 10 }, // Más lejos derecha abajo
                { x: posicionInicial.x - 25, y: posicionInicial.y + 10 }, // Más lejos izquierda abajo
            ];
            break;
            
        default:
            // Posiciones generales
            posicionesAlternativas = [
                { x: posicionInicial.x, y: posicionInicial.y }, // Posición original
                { x: posicionInicial.x + 20, y: posicionInicial.y }, // Derecha
                { x: posicionInicial.x - 20, y: posicionInicial.y }, // Izquierda
                { x: posicionInicial.x, y: posicionInicial.y - 20 }, // Arriba
                { x: posicionInicial.x, y: posicionInicial.y + 20 }, // Abajo
                { x: posicionInicial.x + 15, y: posicionInicial.y - 15 }, // Diagonal superior derecha
                { x: posicionInicial.x - 15, y: posicionInicial.y - 15 }, // Diagonal superior izquierda
                { x: posicionInicial.x + 15, y: posicionInicial.y + 15 }, // Diagonal inferior derecha
                { x: posicionInicial.x - 15, y: posicionInicial.y + 15 }, // Diagonal inferior izquierda
            ];
    }
    
    for (let pos of posicionesAlternativas) {
        const rectNueva = {
            x: pos.x - textWidth/2 - margen,
            y: pos.y - textHeight/2 - margen,
            width: textWidth + 2 * margen,
            height: textHeight + 2 * margen
        };
        
        let colision = false;
        for (let etiquetaExistente of etiquetasExistentes) {
            if (detectarColision(rectNueva, etiquetaExistente)) {
                colision = true;
                break;
            }
        }
        
        if (!colision) {
            return { posicion: pos, rectangulo: rectNueva };
        }
    }
    
    // Si todas las posiciones tienen colisión, usar la original
    const rectOriginal = {
        x: posicionInicial.x - textWidth/2 - margen,
        y: posicionInicial.y - textHeight/2 - margen,
        width: textWidth + 2 * margen,
        height: textHeight + 2 * margen
    };
    
    return { posicion: posicionInicial, rectangulo: rectOriginal };
}

// Función para obtener los valores del formulario
function definirValores() {
    // Función auxiliar para validar y convertir números
    function parseFloatSafe(value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    
    const q1 = parseFloatSafe(document.getElementById('q1').value) * Math.pow(10, parseInt(document.getElementById('q1-prefijo').value));
    const q2 = parseFloatSafe(document.getElementById('q2').value) * Math.pow(10, parseInt(document.getElementById('q2-prefijo').value));
    const q3 = parseFloatSafe(document.getElementById('q3').value) * Math.pow(10, parseInt(document.getElementById('q3-prefijo').value));
    const ladoAB = parseFloatSafe(document.getElementById('ladoAB').value);
    const ladoBC = parseFloatSafe(document.getElementById('ladoBC').value);
    const ladoCA = parseFloatSafe(document.getElementById('ladoCA').value);
    const cargaAnalizada = parseInt(document.getElementById('carga-analizada').value);
    
    return { q1, q2, q3, ladoAB, ladoBC, ladoCA, cargaAnalizada };
}

// Función para calcular los ángulos a partir de las longitudes usando la ley de cosenos
function calcularAngulos(ladoAB, ladoBC, ladoCA) {
    // Verificar que todos los lados sean positivos
    if (ladoAB <= 0 || ladoBC <= 0 || ladoCA <= 0) {
        throw new Error('Todos los lados deben ser valores positivos');
    }
    
    // Verificar desigualdad triangular
    if (ladoAB + ladoBC <= ladoCA) {
        throw new Error(`La suma de AB (${ladoAB}) + BC (${ladoBC}) = ${ladoAB + ladoBC} debe ser mayor que CA (${ladoCA})`);
    }
    if (ladoAB + ladoCA <= ladoBC) {
        throw new Error(`La suma de AB (${ladoAB}) + CA (${ladoCA}) = ${ladoAB + ladoCA} debe ser mayor que BC (${ladoBC})`);
    }
    if (ladoBC + ladoCA <= ladoAB) {
        throw new Error(`La suma de BC (${ladoBC}) + CA (${ladoCA}) = ${ladoBC + ladoCA} debe ser mayor que AB (${ladoAB})`);
    }
    
    const cosA = (ladoCA * ladoCA + ladoAB * ladoAB - ladoBC * ladoBC) / (2 * ladoCA * ladoAB);
    const cosB = (ladoAB * ladoAB + ladoBC * ladoBC - ladoCA * ladoCA) / (2 * ladoAB * ladoBC);
    const cosC = (ladoBC * ladoBC + ladoCA * ladoCA - ladoAB * ladoAB) / (2 * ladoBC * ladoCA);
    
    // Verificar que los cosenos estén en el rango válido [-1, 1]
    if (cosA < -1 || cosA > 1) {
        throw new Error(`Error en el cálculo del ángulo A: cos(A) = ${cosA.toFixed(6)} está fuera del rango válido [-1, 1]`);
    }
    if (cosB < -1 || cosB > 1) {
        throw new Error(`Error en el cálculo del ángulo B: cos(B) = ${cosB.toFixed(6)} está fuera del rango válido [-1, 1]`);
    }
    if (cosC < -1 || cosC > 1) {
        throw new Error(`Error en el cálculo del ángulo C: cos(C) = ${cosC.toFixed(6)} está fuera del rango válido [-1, 1]`);
    }
    
    const anguloA = Math.acos(cosA) * 180 / Math.PI;
    const anguloB = Math.acos(cosB) * 180 / Math.PI;
    const anguloC = Math.acos(cosC) * 180 / Math.PI;
    
    // Verificar que la suma de ángulos sea aproximadamente 180°
    const sumaAngulos = anguloA + anguloB + anguloC;
    if (Math.abs(sumaAngulos - 180) > 0.1) {
        throw new Error(`La suma de los ángulos calculados (${sumaAngulos.toFixed(2)}°) debe ser 180°. Verifique las longitudes ingresadas.`);
    }
    
    return { anguloA, anguloB, anguloC };
}

// Función para calcular las posiciones del triángulo basado en tres lados
function calcularPosicionesConLados(ladoAB, ladoBC, ladoCA) {
    // Verificar desigualdad triangular
    if (ladoAB + ladoBC <= ladoCA || ladoAB + ladoCA <= ladoBC || ladoBC + ladoCA <= ladoAB) {
        throw new Error('Los lados no cumplen la desigualdad triangular');
    }
    
    // Posición de q1 (vértice A) en el origen
    const pos1 = { x: 0, y: 0 };
    
    // Posición de q2 (vértice B) en el eje x positivo
    const pos2 = { x: ladoAB, y: 0 };
    
    // Calcular posición de q3 (vértice C) usando la ley de cosenos
    // cos(A) = (CA² + AB² - BC²) / (2 * CA * AB)
    const cosA = (ladoCA * ladoCA + ladoAB * ladoAB - ladoBC * ladoBC) / (2 * ladoCA * ladoAB);
    
    // Verificar que el coseno esté en el rango válido [-1, 1]
    if (cosA < -1 || cosA > 1) {
        throw new Error('Las longitudes de los lados no forman un triángulo válido');
    }
    
    const anguloA = Math.acos(cosA);
    
    // Posición de q3 usando coordenadas polares desde q1
    // Usar el ángulo A calculado y el lado CA
    const x3 = ladoCA * Math.cos(anguloA);
    const y3 = ladoCA * Math.sin(anguloA);
    const pos3 = { x: x3, y: y3 };
    
    return { pos1, pos2, pos3 };
}

// Función para mostrar el desarrollo paso a paso
function desplegarDesarrollo(html) {
    document.getElementById('desarrollo').innerHTML = html;
}

// Función para determinar el tipo de triángulo
function tipoTriangulo(ladoAB, ladoBC, ladoCA) {
    const tol = 1e-4;
    if (Math.abs(ladoAB - ladoBC) < tol && Math.abs(ladoBC - ladoCA) < tol) {
        return 'Equilátero';
    } else if (
        Math.abs(ladoAB - ladoBC) < tol ||
        Math.abs(ladoBC - ladoCA) < tol ||
        Math.abs(ladoCA - ladoAB) < tol
    ) {
        return 'Isósceles';
    } else {
        return 'Escaleno';
    }
}

// Función para dibujar el triángulo y las fuerzas en el canvas
function dibujarTrianguloYFuerzas(q, posiciones, idxAnalizada, fuerzas, etiquetas, angulos) {
    const canvas = document.getElementById('canvas-triangulo');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Array para rastrear las etiquetas existentes y evitar colisiones
    const etiquetasExistentes = [];

    // Calcular bounding box del triángulo
    const maxX = Math.max(...posiciones.map(p => p.x));
    const minX = Math.min(...posiciones.map(p => p.x));
    const maxY = Math.max(...posiciones.map(p => p.y));
    const minY = Math.min(...posiciones.map(p => p.y));
    const anchoTriangulo = maxX - minX;
    const altoTriangulo = maxY - minY;
    
    // Sistema de escalado mejorado para manejar triángulos pequeños y grandes
    const margenBase = 120; // Margen base más grande
    const escalaX = (canvas.width - 2 * margenBase) / Math.max(anchoTriangulo, 0.1);
    const escalaY = (canvas.height - 2 * margenBase) / Math.max(altoTriangulo, 0.1);
    
    // Usar la escala más pequeña para mantener proporciones
    let escala = Math.min(escalaX, escalaY);
    
    // Limitar la escala máxima para triángulos muy pequeños
    const escalaMaxima = 800; // Evita que triángulos pequeños se vean demasiado grandes
    if (escala > escalaMaxima) {
        escala = escalaMaxima;
    }
    
    // Ajustar margen dinámicamente según la escala
    const margen = Math.max(margenBase, 80 + (escalaMaxima - escala) * 0.1);
    
    // Calcular centro del triángulo para centrarlo en el canvas
    const centroTriangulo = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
    };
    
    // Offset para centrar el triángulo
    const offsetX = canvas.width / 2 - centroTriangulo.x * escala;
    const offsetY = canvas.height / 2 + centroTriangulo.y * escala;

    function toCanvas(p) {
        return {
            x: offsetX + p.x * escala,
            y: offsetY - p.y * escala
        };
    }

    // Dibujar triángulo con línea más gruesa
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    let p0 = toCanvas(posiciones[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < 4; i++) {
        let p = toCanvas(posiciones[i % 3]);
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Dibujar distancias en el centro de cada lado con mejor posicionamiento
    const lados = [
        {a: 0, b: 1, nombre: 'AB'},
        {a: 1, b: 2, nombre: 'BC'},
        {a: 2, b: 0, nombre: 'CA'}
    ];
    
    for (let l of lados) {
        let pa = toCanvas(posiciones[l.a]);
        let pb = toCanvas(posiciones[l.b]);
        let mx = (pa.x + pb.x) / 2;
        let my = (pa.y + pb.y) / 2;
        
        // Vector perpendicular (normalizado)
        let dx = pb.x - pa.x;
        let dy = pb.y - pa.y;
        let len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) {
            let nx = -dy / len;
            let ny = dx / len;
            
            // Ajustar distancia de la etiqueta según el tamaño del triángulo
            let distanciaEtiqueta = Math.max(50, Math.min(80, escala * 0.3));
            let tx = mx + nx * distanciaEtiqueta;
            let ty = my + ny * distanciaEtiqueta;
            
            // Calcular distancia real
            let dist = Math.sqrt(
                Math.pow(posiciones[l.a].x - posiciones[l.b].x, 2) +
                Math.pow(posiciones[l.a].y - posiciones[l.b].y, 2)
            );
            
            const texto = `${l.nombre} = ${dist.toFixed(3)} m`;
            const posicionInicial = { x: tx, y: ty };
            const resultado = ajustarPosicionEtiqueta(posicionInicial, texto, ctx, etiquetasExistentes, 8, 'distancia');
            
            // Agregar la nueva etiqueta al array de etiquetas existentes
            etiquetasExistentes.push(resultado.rectangulo);
            
            // Fondo para la etiqueta
            ctx.save();
            ctx.font = 'bold 14px Arial';
            const rectangulo = dibujarEtiquetaConFondo(ctx, texto, resultado.posicion, '#222', 'rgba(255, 255, 255, 0.95)', 'rgba(0, 0, 0, 0.3)');
            ctx.restore();
            
            // Actualizar el rectángulo en el array de etiquetas existentes
            etiquetasExistentes[etiquetasExistentes.length - 1] = rectangulo;
        }
    }

    // Dibujar ángulos calculados con mejor escalado
    if (posiciones.length === 3) {
        const lados = [
            {a: 0, b: 1, c: 2, nombre: 'A', valor: angulos ? angulos.anguloA : undefined},
            {a: 1, b: 2, c: 0, nombre: 'B', valor: angulos ? angulos.anguloB : undefined},
            {a: 2, b: 0, c: 1, nombre: 'C', valor: angulos ? angulos.anguloC : undefined}
        ];
        
        for (let angulo of lados) {
            let p0 = toCanvas(posiciones[angulo.a]);
            let p1 = toCanvas(posiciones[angulo.b]);
            let p2 = toCanvas(posiciones[angulo.c]);
            let v1x = p1.x - p0.x;
            let v1y = p1.y - p0.y;
            let v2x = p2.x - p0.x;
            let v2y = p2.y - p0.y;
            let ang1 = Math.atan2(v1y, v1x);
            let ang2 = Math.atan2(v2y, v2x);
            if (ang2 < ang1) ang2 += 2 * Math.PI;
            let radio = Math.max(20, Math.min(40, escala * 0.2));
            ctx.save();
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p0.x, p0.y, radio, ang1, ang2);
            ctx.stroke();
            // Mostrar letra y valor del ángulo
            let angMedio = (ang1 + ang2) / 2;
            let tx = p0.x + (radio + 35) * Math.cos(angMedio);
            let ty = p0.y + (radio + 35) * Math.sin(angMedio);
            let textoAngulo = angulo.valor !== undefined ? `${angulo.nombre} = ${angulo.valor.toFixed(2)}°` : angulo.nombre;
            const posicionInicial = { x: tx, y: ty };
            const resultado = ajustarPosicionEtiqueta(posicionInicial, textoAngulo, ctx, etiquetasExistentes, 6, 'angulo');
            etiquetasExistentes.push(resultado.rectangulo);
            ctx.font = 'bold 14px Arial';
            const rectangulo = dibujarEtiquetaConFondo(ctx, textoAngulo, resultado.posicion, '#e67e22', 'rgba(255, 255, 255, 0.95)', 'rgba(230, 126, 34, 0.3)');
            ctx.restore();
            etiquetasExistentes[etiquetasExistentes.length - 1] = rectangulo;
        }
    }

    // Dibujar cargas, etiquetas y símbolos con mejor escalado
    for (let i = 0; i < 3; i++) {
        let p = toCanvas(posiciones[i]);
        let color = q[i] >= 0 ? '#2980ef' : '#e74c3c';
        
        // Tamaño del círculo escalado con límites
        let radioCarga = Math.max(12, Math.min(25, escala * 0.15));
        
        // Círculo de la carga
        ctx.beginPath();
        ctx.arc(p.x, p.y, radioCarga, 0, 2 * Math.PI);
        ctx.fillStyle = i === idxAnalizada ? '#ffe066' : '#fff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Símbolo + o -
        ctx.font = `bold ${Math.max(14, Math.min(20, escala * 0.2))}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(q[i] >= 0 ? '+' : '–', p.x, p.y + 3);
        
        // Etiqueta q₁, q₂, q₃ con posicionamiento mejorado
        const etiquetaTexto = etiquetas[i];
        const posicionEtiqueta = { x: p.x, y: p.y - radioCarga - 8 };
        const resultadoEtiqueta = ajustarPosicionEtiqueta(posicionEtiqueta, etiquetaTexto, ctx, etiquetasExistentes, 4, 'carga');
        
        // Agregar la nueva etiqueta al array de etiquetas existentes
        etiquetasExistentes.push(resultadoEtiqueta.rectangulo);
        
        ctx.font = `bold ${Math.max(12, Math.min(16, escala * 0.18))}px Arial`;
        const rectanguloEtiqueta = dibujarEtiquetaConFondo(ctx, etiquetaTexto, resultadoEtiqueta.posicion, '#333', 'rgba(255, 255, 255, 0.9)', 'rgba(0, 0, 0, 0.2)');
        
        // Actualizar el rectángulo en el array de etiquetas existentes
        etiquetasExistentes[etiquetasExistentes.length - 1] = rectanguloEtiqueta;
        
        // Valor de carga con posicionamiento mejorado
        const valorCarga = `${(q[i] * 1e6).toFixed(2)} μC`;
        const posicionValor = { x: p.x, y: p.y + radioCarga + 12 };
        const resultadoValor = ajustarPosicionEtiqueta(posicionValor, valorCarga, ctx, etiquetasExistentes, 4, 'carga');
        
        // Agregar la nueva etiqueta al array de etiquetas existentes
        etiquetasExistentes.push(resultadoValor.rectangulo);
        
        ctx.font = `${Math.max(9, Math.min(12, escala * 0.15))}px Arial`;
        const rectanguloValor = dibujarEtiquetaConFondo(ctx, valorCarga, resultadoValor.posicion, '#666', 'rgba(255, 255, 255, 0.85)', 'rgba(0, 0, 0, 0.15)');
        
        // Actualizar el rectángulo en el array de etiquetas existentes
        etiquetasExistentes[etiquetasExistentes.length - 1] = rectanguloValor;
    }

    // Dibujar vectores de fuerza sobre la carga analizada
    let maxF = 0;
    let minF = Infinity;
    for (let i = 0; i < 3; i++) {
        if (i === idxAnalizada) continue;
        let F = fuerzas[i];
        if (!F) continue;
        let mag = Math.sqrt(F.x * F.x + F.y * F.y);
        if (mag > maxF) maxF = mag;
        if (mag < minF) minF = mag;
    }
    
    // Sistema de escalado mejorado
    const maxLong = Math.max(60, Math.min(120, escala * 0.8));
    const minLong = Math.max(60, Math.min(120, escala * 0.8));
    
    for (let i = 0; i < 3; i++) {
        if (i === idxAnalizada) continue;
        let pA = toCanvas(posiciones[idxAnalizada]);
        let F = fuerzas[i];
        if (!F) continue;
        
        let mag = Math.sqrt(F.x * F.x + F.y * F.y);
        
        // Escalado proporcional basado en la magnitud de la fuerza
        let escalaF;
        if (maxF === minF) {
            escalaF = maxLong / maxF;
        } else {
            // Escalado lineal entre minLong y maxLong
            let ratio = (mag - minF) / (maxF - minF);
            escalaF = (minLong + ratio * (maxLong - minLong)) / mag;
        }
        
        let dx = F.x * escalaF;
        let dy = -F.y * escalaF;
        
        ctx.strokeStyle = F.sentido === 'Repulsiva' ? '#e74c3c' : '#2980ef';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pA.x + dx, pA.y + dy);
        ctx.stroke();
        
        // Flecha
        ctx.beginPath();
        let ang = Math.atan2(dy, dx);
        let flechaSize = Math.max(8, Math.min(15, escala * 0.12));
        ctx.moveTo(pA.x + dx, pA.y + dy);
        ctx.lineTo(pA.x + dx - flechaSize * Math.cos(ang - 0.3), pA.y + dy - flechaSize * Math.sin(ang - 0.3));
        ctx.moveTo(pA.x + dx, pA.y + dy);
        ctx.lineTo(pA.x + dx - flechaSize * Math.cos(ang + 0.3), pA.y + dy - flechaSize * Math.sin(ang + 0.3));
        ctx.stroke();
        
        // Etiqueta de fuerza con posicionamiento mejorado
        const textoFuerza = `F${i + 1}${idxAnalizada + 1} = ${mag.toFixed(3)} N`;
        
        // Calcular vector perpendicular a la flecha para desplazar la etiqueta
        const margenEtiqueta = 18;
        const perpAng = ang + Math.PI / 2; // 90 grados respecto a la flecha
        const posicionInicial = {
            x: pA.x + dx + Math.cos(perpAng) * margenEtiqueta,
            y: pA.y + dy + Math.sin(perpAng) * margenEtiqueta
        };
        
        const resultado = ajustarPosicionEtiqueta(posicionInicial, textoFuerza, ctx, etiquetasExistentes, 6, 'fuerza');
        
        // Agregar la nueva etiqueta al array de etiquetas existentes
        etiquetasExistentes.push(resultado.rectangulo);
        
        ctx.save();
        ctx.font = `bold ${Math.max(11, Math.min(15, escala * 0.16))}px Arial`;
        const rectanguloFuerza = dibujarEtiquetaConFondo(ctx, textoFuerza, resultado.posicion, ctx.strokeStyle, 'rgba(255, 255, 255, 0.95)', 'rgba(0, 0, 0, 0.3)');
        ctx.restore();
        
        // Actualizar el rectángulo en el array de etiquetas existentes
        etiquetasExistentes[etiquetasExistentes.length - 1] = rectanguloFuerza;
    }
}

// Función para dibujar triángulo equilátero vacío
function dibujarTrianguloEquilateroVacio() {
    const canvas = document.getElementById('canvas-triangulo');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Array para rastrear las etiquetas existentes y evitar colisiones
    const etiquetasExistentes = [];
    
    // Triángulo equilátero centrado
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;
    const lado = 200;
    const altura = lado * Math.sqrt(3) / 2;
    
    // Vértices del triángulo equilátero
    const vertices = [
        { x: centroX, y: centroY - altura/2 },           // Vértice superior
        { x: centroX - lado/2, y: centroY + altura/2 },  // Vértice inferior izquierdo
        { x: centroX + lado/2, y: centroY + altura/2 }   // Vértice inferior derecho
    ];
    
    // Dibujar triángulo
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Línea punteada
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    ctx.lineTo(vertices[1].x, vertices[1].y);
    ctx.lineTo(vertices[2].x, vertices[2].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]); // Resetear a línea sólida
    
    // Dibujar puntos en los vértices
    ctx.fillStyle = '#999';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(vertices[i].x, vertices[i].y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Etiquetas q₁, q₂, q₃ con posicionamiento mejorado
        let etiqueta = ['q₁', 'q₂', 'q₃'][i];
        let offsetY = i === 0 ? -25 : 25;
        const posicionInicial = { x: vertices[i].x, y: vertices[i].y + offsetY };
        const resultado = ajustarPosicionEtiqueta(posicionInicial, etiqueta, ctx, etiquetasExistentes, 4, 'carga');
        
        // Agregar la nueva etiqueta al array de etiquetas existentes
        etiquetasExistentes.push(resultado.rectangulo);
        
        ctx.font = 'bold 16px Arial';
        const rectangulo = dibujarEtiquetaConFondo(ctx, etiqueta, resultado.posicion, '#666', 'rgba(255, 255, 255, 0.9)', 'rgba(0, 0, 0, 0.2)');
        
        // Actualizar el rectángulo en el array de etiquetas existentes
        etiquetasExistentes[etiquetasExistentes.length - 1] = rectangulo;
    }
    
    // Mensaje informativo con posicionamiento mejorado
    const mensaje = 'Ingrese las longitudes de los lados para comenzar';
    const posicionMensaje = { x: centroX, y: centroY + altura/2 + 50 };
    const resultadoMensaje = ajustarPosicionEtiqueta(posicionMensaje, mensaje, ctx, etiquetasExistentes, 6, 'general');
    
    ctx.font = '14px Arial';
    const rectanguloMensaje = dibujarEtiquetaConFondo(ctx, mensaje, resultadoMensaje.posicion, '#999', 'rgba(255, 255, 255, 0.85)', 'rgba(0, 0, 0, 0.15)');
}

// Función principal de cálculo
function calcularFuerzas() {
    try {
        const { q1, q2, q3, ladoAB, ladoBC, ladoCA, cargaAnalizada } = definirValores();
        
        let posiciones;
        let desarrollo = '';
        
        // Validar datos de entrada
        if (!ladoAB || !ladoBC || !ladoCA) {
            throw new Error('Debe ingresar las tres longitudes de los lados');
        }
        
        // Calcular ángulos automáticamente
        const { anguloA, anguloB, anguloC } = calcularAngulos(ladoAB, ladoBC, ladoCA);
        
        // Determinar tipo de triángulo
        const tipo = tipoTriangulo(ladoAB, ladoBC, ladoCA);
        
        // Calcular posiciones del triángulo
        posiciones = calcularPosicionesConLados(ladoAB, ladoBC, ladoCA);
        posiciones = [posiciones.pos1, posiciones.pos2, posiciones.pos3];
        
        desarrollo += `<div class="resultado-bloque">`;
        desarrollo += `<h3 class="resultado-titulo">Datos ingresados</h3>`;
        desarrollo += `<p class="resultado-formula">q₁ = <span>${q1.toExponential(2)} C</span></p>`;
        desarrollo += `<p class="resultado-formula">q₂ = <span>${q2.toExponential(2)} C</span></p>`;
        desarrollo += `<p class="resultado-formula">q₃ = <span>${q3.toExponential(2)} C</span></p>`;
        desarrollo += `<p class="resultado-formula">AB = <span>${ladoAB} m</span></p>`;
        desarrollo += `<p class="resultado-formula">BC = <span>${ladoBC} m</span></p>`;
        desarrollo += `<p class="resultado-formula">CA = <span>${ladoCA} m</span></p>`;
        desarrollo += `<p class="resultado-formula">Tipo de triángulo: <span>${tipo}</span></p>`;
        desarrollo += `</div>`;
        
        desarrollo += `<div class="resultado-bloque">`;
        desarrollo += `<h3 class="resultado-titulo">Ángulos calculados automáticamente</h3>`;
        desarrollo += `<p class="resultado-formula">Ángulo A (en q₁): <span>${anguloA.toFixed(2)}°</span></p>`;
        desarrollo += `<p class="resultado-formula">Ángulo B (en q₂): <span>${anguloB.toFixed(2)}°</span></p>`;
        desarrollo += `<p class="resultado-formula">Ángulo C (en q₃): <span>${anguloC.toFixed(2)}°</span></p>`;
        desarrollo += `<p class="resultado-formula">Suma de ángulos: <span>${(anguloA + anguloB + anguloC).toFixed(2)}°</span></p>`;
        desarrollo += `</div>`;
        
        let etiquetas = ['q₁', 'q₂', 'q₃'];
        let q = [q1, q2, q3];
        let idx = cargaAnalizada - 1;
        let F_total = {x: 0, y: 0};
        let fuerzas = [null, null, null];
        
        desarrollo += `<div class="resultado-bloque">`;
        desarrollo += `<h3 class="resultado-titulo">Análisis de fuerzas sobre ${etiquetas[idx]}</h3>`;
        desarrollo += `</div>`;
        
        for (let i = 0; i < 3; i++) {
            if (i === idx) continue;
            
            let dx = posiciones[idx].x - posiciones[i].x;
            let dy = posiciones[idx].y - posiciones[i].y;
            let r = Math.sqrt(dx*dx + dy*dy);
            let F = k * Math.abs(q[idx] * q[i]) / (r*r);
            let signo = Math.sign(q[idx] * q[i]);
            let ang = Math.atan2(dy, dx);
            let sentido = signo > 0 ? 'Repulsiva' : 'Atractiva';
            
            // Calcular componentes de la fuerza
            let Fx, Fy;
            if (signo > 0) {
                // Fuerza repulsiva: se aleja de la carga que ejerce la fuerza
                Fx = F * Math.cos(ang);
                Fy = F * Math.sin(ang);
            } else {
                // Fuerza atractiva: se acerca a la carga que ejerce la fuerza
                Fx = -F * Math.cos(ang);
                Fy = -F * Math.sin(ang);
            }
            
            F_total.x += Fx;
            F_total.y += Fy;
            fuerzas[i] = {x: Fx, y: Fy, sentido};
            
            // Notación estándar de física: F_sobre,de
            desarrollo += `<div class="resultado-bloque">`;
            desarrollo += `<h3 class="resultado-titulo">Fuerza F<sub>${i + 1}${idx + 1}</sub> (de ${etiquetas[i]} sobre ${etiquetas[idx]})</h3>`;
            desarrollo += `<p class="resultado-formula">Distancia r: <span>${r.toFixed(3)} m</span></p>`;
            desarrollo += `<p class="resultado-formula">Magnitud |F|: <span>${F.toFixed(3)} N</span></p>`;
            desarrollo += `<p class="resultado-formula">Componentes (F<sub>x</sub>, F<sub>y</sub>): <span>(${Fx.toFixed(4)} N, ${Fy.toFixed(4)} N)</span></p>`;
            desarrollo += `<p class="resultado-formula">Tipo: <span class="tipo-${sentido.toLowerCase()}">${sentido}</span></p>`;
            desarrollo += `</div>`;
        }
        
        let Fmod = Math.sqrt(F_total.x*F_total.x + F_total.y*F_total.y);
        let angFinal = Math.atan2(F_total.y, F_total.x) * 180/Math.PI;
        
        desarrollo += `<div class="resultado-bloque resultado-final">`;
        desarrollo += `<h3 class="resultado-titulo">Fuerza Neta Total sobre ${etiquetas[idx]}</h3>`;
        desarrollo += `<p class="resultado-formula">Componentes ΣF<sub>x</sub>, ΣF<sub>y</sub>: <span>(${F_total.x.toFixed(4)} N, ${F_total.y.toFixed(4)} N)</span></p>`;
        desarrollo += `<p class="resultado-formula"><b>Magnitud |F<sub>neta</sub>|: <span>${Fmod.toFixed(2)} N</span></b></p>`;
        desarrollo += `<p class="resultado-formula"><b>Dirección (ángulo): <span>${angFinal.toFixed(2)}°</span></b></p>`;
        desarrollo += `</div>`;
        
        desplegarDesarrollo(desarrollo);
        dibujarTrianguloYFuerzas(q, posiciones, idx, fuerzas, etiquetas, { anguloA, anguloB, anguloC });
        
    } catch (error) {
        desplegarDesarrollo(`<div class='error'>Error: ${error.message}</div>`);
    }
}

// Event listeners
document.getElementById('btnCalcular').addEventListener('click', calcularFuerzas);
document.getElementById('btnReiniciar').addEventListener('click', function() {
    // Limpiar todos los campos del formulario
    document.getElementById('q1').value = '';
    document.getElementById('q2').value = '';
    document.getElementById('q3').value = '';
    document.getElementById('ladoAB').value = '';
    document.getElementById('ladoBC').value = '';
    document.getElementById('ladoCA').value = '';
    
    // Resetear los selectores a valores por defecto
    document.getElementById('q1-prefijo').selectedIndex = 1; // μC
    document.getElementById('q2-prefijo').selectedIndex = 1; // μC
    document.getElementById('q3-prefijo').selectedIndex = 1; // μC
    document.getElementById('carga-analizada').selectedIndex = 0; // q₁
    
    // Limpiar resultados
    document.getElementById('desarrollo').innerHTML = '';
    
    // Limpiar canvas
    const canvas = document.getElementById('canvas-triangulo');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar triángulo equilátero vacío
    dibujarTrianguloEquilateroVacio();
});

// Actualizar gráfico automáticamente al cambiar datos
document.addEventListener('DOMContentLoaded', function() {
    // Dibujar triángulo equilátero vacío al cargar la página
    dibujarTrianguloEquilateroVacio();
    
    ['q1','q2','q3','ladoAB','ladoBC','ladoCA','carga-analizada'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            try {
                const { q1, q2, q3, ladoAB, ladoBC, ladoCA } = definirValores();
                let posiciones;
                
                if (ladoAB && ladoBC && ladoCA) {
                    posiciones = calcularPosicionesConLados(ladoAB, ladoBC, ladoCA);
                    posiciones = [posiciones.pos1, posiciones.pos2, posiciones.pos3];
                } else {
                    // Si no hay suficientes datos, dibujar triángulo equilátero vacío
                    dibujarTrianguloEquilateroVacio();
                    return;
                }
                
                let etiquetas = ['q₁', 'q₂', 'q₃'];
                let q = [q1, q2, q3];
                let idx = parseInt(document.getElementById('carga-analizada').value) - 1;
                dibujarTrianguloYFuerzas(q, posiciones, idx, [null,null,null], etiquetas, null);
            } catch (error) {
                // Si hay error, dibujar triángulo equilátero vacío
                dibujarTrianguloEquilateroVacio();
            }
        });
    });
});