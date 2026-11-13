
/*
 CONSULTAS DE RENDIMIENTO - RV BALONCESTO
*/

const API_FUERZA_URL =
  "https://script.google.com/macros/s/AKfycbw4pFSJsejB7Q5SaID_ixMWiED5hE7qVf_oSNuZPvOuecm0eCr7wWhYvBamrJ7CS8O6/exec";

const EJERCICIOS_FIJOS_RENDIMIENTO = [
  "BENCH PRESS",
  "SQUAT",
  "DEADLIFT",
  "PULL-UP",
  "ROW",
  "MILITAR PRESS",
  "ROMANIAN DEADLIFT",
  "HIP THRUST",
  "BULGARIAN SPLIT SQUAT",
  "INCLINE BENCH PRESS",
  "LAT PULLDOWN",
  "LUNGE"
];

let consultaEnCurso = false;
let secuenciaJSONP = 0;

const el = id => document.getElementById(id);

const jugador = () => (
  localStorage.getItem("Usuario") ||
  localStorage.getItem("startValue") ||
  ""
).trim();

function fechaHoy() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function fechaVisible(iso) {
  const p = iso.split("-");

  return p.length === 3
    ? `${p[2]}/${p[1]}/${p[0]}`
    : iso;
}

function crearTexto(tag, texto, clase = "") {
  const nodo = document.createElement(tag);

  nodo.textContent = texto;

  if (clase) {
    nodo.className = clase;
  }

  return nodo;
}

function mostrarMensaje(mensaje) {
  el("resultados").replaceChildren(
    crearTexto("p", mensaje, "mensaje")
  );
}

// ======================================
// INICIALIZACIÓN
// ======================================

window.addEventListener("DOMContentLoaded", () => {

  el("fechaConsulta").value = fechaHoy();

  el("jugador").textContent = jugador()
    ? `${jugador()} · RV Baloncesto`
    : "RV Baloncesto";

  el("volverMenu").addEventListener("click", () => {
    location.href = "menu_opciones.html";
  });

  el("btnRendimiento").addEventListener("click", () => {
    consultar("rm");
  });

  el("btnEntrenamiento").addEventListener("click", () => {
    consultar("entrenamiento");
  });

  cargarEjerciciosJugador();
});

// ======================================
// LISTA DE EJERCICIOS
// ======================================

function actualizarSelector(lista) {

  const selector = el("ejercicioConsulta");
  const anterior = selector.value;

  const unicos = new Map();

  lista.forEach(item => {

    const nombre = String(item || "").trim();

    if (
      nombre &&
      !unicos.has(nombre.toLocaleLowerCase("es"))
    ) {
      unicos.set(
        nombre.toLocaleLowerCase("es"),
        nombre
      );
    }
  });

  selector.replaceChildren(
    new Option("Seleccionar ejercicio", "")
  );

  [...unicos.values()]
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach(nombre => {
      selector.add(new Option(nombre, nombre));
    });

  if (
    [...selector.options].some(
      o => o.value === anterior
    )
  ) {
    selector.value = anterior;
  }
}

async function cargarEjerciciosJugador() {

  const nombre = jugador();

  const clave =
    "rvb_ejercicios_" + nombre.toLowerCase();

  let locales = [];

  try {
    const datos = JSON.parse(
      localStorage.getItem(clave) || "[]"
    );

    if (Array.isArray(datos)) {
      locales = datos;
    }

  } catch (err) {
    console.warn(
      "Ejercicios locales no disponibles",
      err
    );
  }

  actualizarSelector([
    ...EJERCICIOS_FIJOS_RENDIMIENTO,
    ...locales
  ]);

  if (!nombre) return;

  try {
    const respuesta = await llamarAPI(
      "ejerciciosFuerza",
      { nombre },
      "rvbEjercicios"
    );

    if (!respuesta.ok) {
      throw new Error(
        respuesta.error || "Error en el listado"
      );
    }

    actualizarSelector([
      ...EJERCICIOS_FIJOS_RENDIMIENTO,
      ...locales,
      ...(Array.isArray(respuesta.ejercicios)
        ? respuesta.ejercicios
        : [])
    ]);

  } catch (err) {
    console.warn(
      "Sincronización de ejercicios no disponible:",
      err
    );

    // Los ejercicios básicos y locales permanecen.
  }
}

// ======================================
// CONSULTAR RESULTADOS
// ======================================

async function consultar(tipo) {

  if (consultaEnCurso) return;

  const nombre = jugador();
  const ejercicio = el("ejercicioConsulta").value;
  const fecha = el("fechaConsulta").value;
  const dias = el("diasConsulta").value;

  if (!nombre) {
    return mostrarMensaje(
      "No se ha encontrado el usuario. Inicia sesión nuevamente."
    );
  }

  if (!ejercicio) {
    return mostrarMensaje(
      "Selecciona primero un ejercicio."
    );
  }

  if (!fecha) {
    return mostrarMensaje(
      "Selecciona una fecha de referencia."
    );
  }

  consultaEnCurso = true;

  el("btnRendimiento").disabled = true;
  el("btnEntrenamiento").disabled = true;

  mostrarMensaje(
    "Consultando datos de " + ejercicio + "..."
  );

  try {

    const r = await llamarAPI(
      "rendimientoFuerza",
      {
        nombre,
        ejercicio,
        fecha,
        dias,
        tipo
      },
      "rvbRendimiento"
    );

    if (!r.ok) {
      throw new Error(
        r.error || "Error de consulta"
      );
    }

    if (tipo === "rm") {
      dibujarGrafica(ejercicio, r.registros || []);
    } else {
      dibujarTabla(ejercicio, r.registros || []);
    }

  } catch (err) {

    mostrarMensaje(
      "No se pudo consultar: " + err.message
    );

  } finally {

    consultaEnCurso = false;

    el("btnRendimiento").disabled = false;
    el("btnEntrenamiento").disabled = false;
  }
}

// ======================================
// COMUNICACIÓN CON APPS SCRIPT
// ======================================

function llamarAPI(accion, parametros, prefijo) {

  return new Promise((resolve, reject) => {

    const callback =
      `${prefijo}_${Date.now()}${++secuenciaJSONP}`;

    const script = document.createElement("script");

    let terminado = false;
    let temporizador;

    const limpiar = () => {

      if (terminado) return false;

      terminado = true;

      clearTimeout(temporizador);
      script.remove();
      delete window[callback];

      return true;
    };

    window[callback] = datos => {
      if (limpiar()) resolve(datos);
    };

    script.onerror = () => {

      if (limpiar()) {
        reject(
          new Error("No se pudo conectar con Apps Script")
        );
      }
    };

    temporizador = setTimeout(() => {

      if (limpiar()) {
        reject(
          new Error("La consulta ha tardado demasiado")
        );
      }

    }, 20000);

    const url = new URL(API_FUERZA_URL);

    url.searchParams.set("accion", accion);

    Object.entries(parametros).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });

    url.searchParams.set("callback", callback);
    url.searchParams.set("_", String(Date.now()));
script.crossOrigin = "anonymous";
    script.src = url.toString();

    document.head.appendChild(script);
  });
}

// ======================================
// TABLA DE ENTRENAMIENTOS
// ======================================

function dibujarTabla(ejercicio, registros) {

  const destino = el("resultados");

  destino.replaceChildren(
    crearTexto(
      "h2",
      "Entrenamientos · " + ejercicio
    )
  );

  if (!registros.length) {

    destino.appendChild(
      crearTexto(
        "p",
        "No hay registros en el periodo seleccionado.",
        "mensaje"
      )
    );

    return;
  }

  const envoltura = document.createElement("div");
  envoltura.className = "tabla-scroll";

  const tabla = document.createElement("table");
  const cabecera = document.createElement("thead");
  const linea = document.createElement("tr");

  [
    "Fecha",
    "Concatenar (registro completo)"
  ].forEach(t => {
    linea.appendChild(crearTexto("th", t));
  });

  cabecera.appendChild(linea);

  const cuerpo = document.createElement("tbody");

  registros.forEach(r => {

    const fila = document.createElement("tr");

    fila.appendChild(
      crearTexto(
        "td",
        fechaVisible(r.fecha),
        "fecha"
      )
    );

    fila.appendChild(
      crearTexto(
        "td",
        r.texto,
        "detalle"
      )
    );

    cuerpo.appendChild(fila);
  });

  tabla.append(cabecera, cuerpo);
  envoltura.appendChild(tabla);
  destino.appendChild(envoltura);

  destino.appendChild(
    crearTexto(
      "p",
      `${registros.length} registro(s). Solo fechas con entrenamiento.`,
      "nota"
    )
  );
}

// ======================================
// GRÁFICA DE EVOLUCIÓN DE RM
// ======================================

function dibujarGrafica(ejercicio, registros) {

  const destino = el("resultados");

  destino.replaceChildren(
    crearTexto(
      "h2",
      "Evolución del RM · " + ejercicio
    )
  );

  const puntos = registros
    .filter(r =>
      Number.isFinite(Number(r.rm)) &&
      Number(r.rm) > 0
    )
    .map(r => ({
      fecha: r.fecha,
      rm: Number(r.rm),
      t: Date.parse(r.fecha + "T00:00:00Z")
    }))
    .filter(r => Number.isFinite(r.t))
    .sort((a, b) => a.t - b.t);

  if (!puntos.length) {

    destino.appendChild(
      crearTexto(
        "p",
        "No hay registros con RM estimado para este ejercicio en el periodo seleccionado. Los registros VBT sin RM no se dibujan.",
        "mensaje"
      )
    );

    return;
  }

  const NS = "http://www.w3.org/2000/svg";

  const ancho = Math.min(
    1900,
    Math.max(720, 100 + puntos.length * 54)
  );

  const alto = 330;

  const M = {
    izq: 60,
    der: 25,
    arriba: 25,
    abajo: 65
  };

  const areaW = ancho - M.izq - M.der;
  const areaH = alto - M.arriba - M.abajo;

  const todosRM = puntos.map(p => p.rm);

  const minimo = Math.min(...todosRM);
  const maximo = Math.max(...todosRM);

  const margen = Math.max(
    3,
    (maximo - minimo) * .12
  );

  const yMin = Math.max(0, minimo - margen);
  const yMax = maximo + margen;

  const tMin = puntos[0].t;
  const tMax = puntos[puntos.length - 1].t;

  const x = p =>
    M.izq + (
      tMax === tMin
        ? areaW / 2
        : (p.t - tMin) / (tMax - tMin) * areaW
    );

  const y = p =>
    M.arriba +
    (yMax - p.rm) / (yMax - yMin) * areaH;

  const svg = document.createElementNS(NS, "svg");

  svg.setAttribute("width", String(ancho));
  svg.setAttribute("height", String(alto));
  svg.setAttribute(
    "viewBox",
    `0 0 ${ancho} ${alto}`
  );

  svg.setAttribute("role", "img");

  svg.setAttribute(
    "aria-label",
    "Evolución del RM estimado de " + ejercicio
  );

  function elementoSVG(tag, atributos, contenido) {

    const node = document.createElementNS(NS, tag);

    Object.entries(atributos || {}).forEach(
      ([k, v]) => node.setAttribute(k, String(v))
    );

    if (contenido !== undefined) {
      node.textContent = String(contenido);
    }

    svg.appendChild(node);

    return node;
  }

  // Líneas horizontales y escala de RM
  for (let i = 0; i <= 4; i++) {

    const cifra =
      yMin + (yMax - yMin) * i / 4;

    const posY =
      M.arriba + areaH - i / 4 * areaH;

    elementoSVG("line", {
      x1: M.izq,
      y1: posY,
      x2: ancho - M.der,
      y2: posY,
      stroke: "#e2eaf1",
      "stroke-width": 1
    });

    elementoSVG("text", {
      x: M.izq - 9,
      y: posY + 4,
      "text-anchor": "end",
      fill: "#617286",
      "font-size": 12
    }, cifra.toFixed(1));
  }

  // Línea de evolución
  elementoSVG("polyline", {
    points: puntos
      .map(p => `${x(p)},${y(p)}`)
      .join(" "),
    fill: "none",
    stroke: "#007bff",
    "stroke-width": 3,
    "stroke-linejoin": "round",
    "stroke-linecap": "round"
  });

  const paso = Math.max(
    1,
    Math.ceil(puntos.length / 9)
  );

  // Puntos y fechas
  puntos.forEach((p, i) => {

    const circulo = elementoSVG("circle", {
      cx: x(p),
      cy: y(p),
      r: 5,
      fill: "#007bff",
      stroke: "white",
      "stroke-width": 2
    });

    const titulo = document.createElementNS(
      NS,
      "title"
    );

    titulo.textContent =
      `${fechaVisible(p.fecha)}: ${p.rm.toFixed(2)} kg`;

    circulo.appendChild(titulo);

    if (
      i % paso === 0 ||
      i === puntos.length - 1
    ) {

      elementoSVG("text", {
        x: x(p),
        y: alto - M.abajo + 24,
        "text-anchor": "end",
        transform: `rotate(-35 ${x(p)} ${alto - M.abajo + 24})`,
        fill: "#617286",
        "font-size": 12
      }, fechaVisible(p.fecha).slice(0, 5));
    }
  });

  const caja = document.createElement("div");

  caja.className = "grafica-scroll";
  caja.appendChild(svg);

  destino.appendChild(caja);

  destino.appendChild(
    crearTexto(
      "p",
      `${puntos.length} fecha(s) con RM estimado. Si hay más de un registro en un día, se muestra el RM mayor.`,
      "nota"
    )
  );
}
