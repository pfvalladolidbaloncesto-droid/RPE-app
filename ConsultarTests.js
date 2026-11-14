/* RVB · Consultar test. Google Apps Script independiente. */

// Pega aquí la URL /exec de la implementación de CONSULTAS DE TEST.
const URL_APPS_SCRIPT_TESTS = "https://script.google.com/macros/s/AKfycbw4pFSJsejB7Q5SaID_ixMWiED5hE7qVf_oSNuZPvOuecm0eCr7wWhYvBamrJ7CS8O6/exec";

const COLORES_TEST = ["#0038A8", "#5C7A4B"];
let contadorJSONP = 0;
let consultando = false;
const elemento = id => document.getElementById(id);

function idJugadorTests() {
  // Mismas claves que la consulta de rendimiento de fuerza.
  return String(
    localStorage.getItem("Usuario") ||
    localStorage.getItem("startValue") ||
    ""
  ).trim();
}

function texto(tag, contenido, clase = "") {
  const n = document.createElement(tag);
  n.textContent = contenido;
  if (clase) n.className = clase;
  return n;
}

function mensajeTests(mensaje) {
  elemento("resultados").replaceChildren(texto("p", mensaje, "aviso"));
}

function fechaCorta(iso) {
  const [a, m, d] = String(iso).split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

function fmtNumero(n) {
  return Number(n).toLocaleString("es-ES", { maximumFractionDigits: 3 });
}

function peticionTests(accion, parametros = {}) {
  return new Promise((resolve, reject) => {
    if (!URL_APPS_SCRIPT_TESTS.startsWith("https://script.google.com/macros/s/")) {
      reject(new Error("Configura primero URL_APPS_SCRIPT_TESTS en ConsultarTests.js."));
      return;
    }

    const callback = "rvbTests_" + Date.now() + (++contadorJSONP);
    const script = document.createElement("script");
    const url = new URL(URL_APPS_SCRIPT_TESTS);
    let finalizado = false;
    let reloj;

    function terminar() {
      if (finalizado) return false;
      finalizado = true;
      clearTimeout(reloj);
      script.remove();
      delete window[callback];
      return true;
    }

    window[callback] = datos => {
      if (terminar()) resolve(datos);
    };

    script.onerror = () => {
      if (terminar()) reject(new Error("No se pudo conectar con Apps Script."));
    };

    reloj = setTimeout(() => {
      if (terminar()) reject(new Error("Tiempo de espera agotado."));
    }, 20000);

    url.searchParams.set("accion", accion);
    for (const [clave, valor] of Object.entries(parametros)) {
      url.searchParams.set(clave, String(valor));
    }
    url.searchParams.set("callback", callback);
    url.searchParams.set("_", String(Date.now()));

    // Imprescindible según las pruebas en Chrome Android de RVB.
    script.crossOrigin = "anonymous";
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

function rellenarTests(lista) {
  for (const id of ["test1", "test2"]) {
    const select = elemento(id);
    const anterior = select.value;
    select.replaceChildren(new Option("Seleccionar test", ""));
    for (const nombre of lista) select.add(new Option(nombre, nombre));
    if ([...select.options].some(o => o.value === anterior)) select.value = anterior;
  }
}

async function cargarTestsJugador() {
  const id = idJugadorTests();
  if (!id) {
    mensajeTests("No se ha identificado al jugador. Vuelve a iniciar sesión.");
    rellenarTests([]);
    return;
  }

  elemento("jugador").textContent = id + " · RV Baloncesto";

  try {
    const r = await peticionTests("listaTests", { id });
    if (!r.ok) throw new Error(r.error || "No se pudo cargar la lista de tests.");
    rellenarTests(Array.isArray(r.tests) ? r.tests : []);
  } catch (error) {
    rellenarTests([]);
    mensajeTests("Error al cargar los tests: " + error.message);
  }
}

async function consultarTests() {
  if (consultando) return;
  const id = idJugadorTests();
  const test1 = elemento("test1").value;
  const lateralidad1 = elemento("lateralidad1").value;
  const test2 = elemento("test2").value;
  const lateralidad2 = elemento("lateralidad2").value;

  if (!id) return mensajeTests("No se ha identificado al jugador.");
  if (!test1) return mensajeTests("Selecciona un test en la variable 1.");
  if (test2 && (test1 + lateralidad1) === (test2 + lateralidad2)) {
    return mensajeTests("Las dos variables seleccionadas son idénticas. Cambia una de ellas.");
  }

  consultando = true;
  elemento("consultar").disabled = true;
  mensajeTests("Consultando resultados...");

  try {
    const r = await peticionTests("consultarTests", {
      id, test1, lateralidad1,
      test2, lateralidad2
    });
    if (!r.ok) throw new Error(r.error || "Error al consultar los resultados.");
    representarGraficaTests([
      { nombre: test1 + lateralidad1, registros: Array.isArray(r.serie1) ? r.serie1 : [], color: COLORES_TEST[0] },
      ...(test2 ? [{ nombre: test2 + lateralidad2, registros: Array.isArray(r.serie2) ? r.serie2 : [], color: COLORES_TEST[1] }] : [])
    ]);
  } catch (error) {
    mensajeTests("No se pudo consultar: " + error.message);
  } finally {
    consultando = false;
    elemento("consultar").disabled = false;
  }
}

function agruparPorDia(registros) {
  const dias = new Map();
  for (const r of registros) {
    const fecha = String(r.fecha || "");
    const valor = Number(r.resultado);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(valor)) continue;
    if (!dias.has(fecha)) dias.set(fecha, []);
    dias.get(fecha).push(valor);
  }
  return dias;
}

function escalaVertical(valores) {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const amplitud = Math.max(max - min, Math.abs(max) * .06, 1);
  const margen = amplitud * .12;
  return { min: min - margen, max: max + margen };
}

function representarGraficaTests(series) {
  const contenedor = elemento("resultados");
  contenedor.replaceChildren(texto("h2", "Evolución de tests"));

  for (const s of series) s.dias = agruparPorDia(s.registros);
  const fechas = [...new Set(series.flatMap(s => [...s.dias.keys()]))].sort();
  if (!fechas.length) {
    contenedor.appendChild(texto("p", "No hay resultados registrados para las variables seleccionadas.", "aviso"));
    return;
  }

  const leyenda = document.createElement("div");
  leyenda.className = "leyenda";
  series.forEach(s => {
    const item = document.createElement("span");
    item.className = "leyenda-item";
    const simbolo = document.createElement("span");
    simbolo.className = "linea-leyenda";
    simbolo.style.color = s.color;
    simbolo.style.borderColor = s.color;
    item.append(simbolo, document.createTextNode(s.nombre));
    leyenda.appendChild(item);
  });
  contenedor.appendChild(leyenda);

  const NS = "http://www.w3.org/2000/svg";
  const w = Math.max(690, 130 + fechas.length * 72);
  const h = 355;
  const margen = { izquierda: 72, derecha: series.length === 2 ? 82 : 30, arriba: 32, abajo: 80 };
  const anchoInterior = w - margen.izquierda - margen.derecha;
  const altoInterior = h - margen.arriba - margen.abajo;
  const x = i => margen.izquierda + (fechas.length === 1 ? anchoInterior / 2 : i * anchoInterior / (fechas.length - 1));
  const escalas = series.map(s => escalaVertical([...s.dias.values()].flat()));
  const y = (valor, escala) => margen.arriba + (escala.max - valor) / (escala.max - escala.min) * altoInterior;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Gráfica de los resultados de " + series.map(s => s.nombre).join(" y "));

  function svgNode(tipo, atributos = {}, contenido) {
    const n = document.createElementNS(NS, tipo);
    for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, String(v));
    if (contenido !== undefined) n.textContent = String(contenido);
    svg.appendChild(n);
    return n;
  }

  // Eje X compartido por ambas variables: únicamente fechas con registros.
  svgNode("line", { x1: margen.izquierda, x2: w - margen.derecha, y1: h - margen.abajo, y2: h - margen.abajo, stroke: "#8995a3" });
  for (let i = 0; i < 5; i++) {
    const yy = margen.arriba + i * altoInterior / 4;
    svgNode("line", { x1: margen.izquierda, x2: w - margen.derecha, y1: yy, y2: yy, stroke: "#e3e9ef" });
    series.forEach((s, j) => {
      const e = escalas[j];
      const valor = e.max - (e.max - e.min) * i / 4;
      svgNode("text", {
        x: j === 0 ? margen.izquierda - 11 : w - margen.derecha + 11,
        y: yy + 4, "text-anchor": j === 0 ? "end" : "start",
        fill: s.color, "font-size": 12
      }, fmtNumero(valor));
    });
  }

  series.forEach((s, j) => {
    svgNode("text", {
      x: j === 0 ? margen.izquierda : w - margen.derecha,
      y: 17, "text-anchor": j === 0 ? "start" : "end",
      fill: s.color, "font-size": 13, "font-weight": "bold"
    }, s.nombre);
  });

  fechas.forEach((fecha, i) => {
    const xx = x(i);
    const yy = h - margen.abajo + 18;
    svgNode("line", { x1: xx, x2: xx, y1: h - margen.abajo, y2: h - margen.abajo + 5, stroke: "#8995a3" });
    svgNode("text", {
      x: xx, y: yy, "text-anchor": "end", "font-size": 12,
      fill: "#596879", transform: `rotate(-40 ${xx} ${yy})`
    }, fechaCorta(fecha));
  });

  const detalle = texto("div", "Toca un punto para ver la fecha y el resultado.", "detalle-punto");

  series.forEach((s, serie) => {
    const escala = escalas[serie];
    const medias = [];

    fechas.forEach((fecha, i) => {
      const valores = s.dias.get(fecha);
      if (!valores) return;
      const media = valores.reduce((suma, n) => suma + n, 0) / valores.length;
      medias.push({ indice: i, fecha, media });
    });

    // La línea conecta las MEDIAS de las fechas con mediciones de esta variable.
    if (medias.length > 1) {
      svgNode("polyline", {
        points: medias.map(p => `${x(p.indice)},${y(p.media, escala)}`).join(" "),
        fill: "none", stroke: s.color, "stroke-width": 2.8,
        "stroke-linecap": "round", "stroke-linejoin": "round"
      });
    }

    // Los círculos muestran CADA medición, incluso varias en la misma fecha.
    fechas.forEach((fecha, i) => {
      const valores = s.dias.get(fecha);
      if (!valores) return;
      valores.forEach((valor, n) => {
        const punto = svgNode("circle", {
          // Un pequeño desplazamiento permite distinguir registros duplicados
          // del mismo día, incluso cuando tienen exactamente el mismo valor.
          cx: x(i) + (n - (valores.length - 1) / 2) * 9,
          cy: y(valor, escala), r: 5,
          fill: "white", stroke: s.color, "stroke-width": 2.4,
          tabindex: 0, style: "cursor:pointer"
        });
        const mensaje = `${s.nombre} · ${fechaCorta(fecha)} · medición ${n + 1}/${valores.length}: ${fmtNumero(valor)}`;
        const t = document.createElementNS(NS, "title");
        t.textContent = mensaje;
        punto.appendChild(t);
        punto.addEventListener("click", () => { detalle.textContent = mensaje; });
        punto.addEventListener("keydown", e => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); detalle.textContent = mensaje; }
        });
      });
    });

    // Rombo sobre cada media diaria: diferencia la línea de las mediciones individuales.
    medias.forEach(p => {
      const xx = x(p.indice);
      const yy = y(p.media, escala);
      const rombo = svgNode("polygon", {
        points: `${xx},${yy - 4} ${xx + 4},${yy} ${xx},${yy + 4} ${xx - 4},${yy}`,
        fill: s.color, stroke: "white", "stroke-width": 1, style: "cursor:pointer"
      });
      rombo.addEventListener("click", () => {
        detalle.textContent = `${s.nombre} · ${fechaCorta(p.fecha)} · media: ${fmtNumero(p.media)}`;
      });
    });
  });

  const scroll = document.createElement("div");
  scroll.className = "grafica-scroll";
  scroll.appendChild(svg);
  contenedor.append(scroll, detalle);

  const resumen = series.map(s => {
    const n = [...s.dias.values()].reduce((suma, arr) => suma + arr.length, 0);
    return `${s.nombre}: ${n} registro(s) en ${s.dias.size} fecha(s)`;
  }).join(" · ");

  contenedor.appendChild(texto("p",
    `${resumen}. Círculos = mediciones individuales. Rombo y línea = media de cada fecha.`,
    "nota"));
}

window.addEventListener("DOMContentLoaded", () => {
  elemento("volver").addEventListener("click", () => { location.href = "menu_opciones.html"; });
  elemento("consultar").addEventListener("click", consultarTests);
  cargarTestsJugador();
});
