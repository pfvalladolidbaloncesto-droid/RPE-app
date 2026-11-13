
/*
=========================================
HISTORIAL DE FUERZA - RV BALONCESTO
=========================================

Muestra los 3 últimos entrenamientos
dentro de EntrenamientoFuerza.html.

Utiliza el texto de la columna AZ.
No abre ninguna página nueva.
*/

const HISTORIAL_URL =
  "PEGA_AQUI_LA_URL_DEL_APPS_SCRIPT";

let registrosHistorial = [];
let indiceHistorial = 0;
let numeroPeticionHistorial = 0;


// =========================================
// INICIALIZACIÓN
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  const boton = document.getElementById("consultar");

  if (!boton) return;

  // Activar botón
  boton.disabled = false;
  boton.textContent = "Consultar últimos entrenamientos";

  // Eliminar el aviso "Próximamente"
  const aviso = boton.parentElement.querySelector(".info");

  if (aviso) {
    aviso.remove();
  }

  // =========================================
  // ESTILOS DEL HISTORIAL
  // =========================================

  const estilos = document.createElement("style");

  estilos.textContent = `
    .hf-panel {
      margin: 15px 0;
      padding: 13px;
      border: 1px solid #dce3e9;
      border-radius: 8px;
      background: #f8fafc;
    }

    .hf-panel[hidden] {
      display: none !important;
    }

    .hf-titulo {
      margin-bottom: 12px;
      font-size: 15px;
      font-weight: bold;
      color: #263a50;
    }

    .hf-fechas {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }

    .hf-fecha {
      padding: 9px 3px;
      min-height: 43px;
      border: 1px solid #d5dfe8;
      border-radius: 6px;
      background: #eaf0f5;
      color: #526474;
      font-size: 11px;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
    }

    .hf-fecha.activa {
      border: 2px solid #147ec7;
      background: #e1f0ff;
      color: #075c9a;
    }

    .hf-fecha:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .hf-contenido {
      min-height: 85px;
      margin-bottom: 12px;
      padding: 12px;
      border: 1px solid #e0e6ed;
      border-radius: 6px;
      background: white;
      color: #27323d;
      font-size: 13px;
      line-height: 1.65;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .hf-navegacion {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .hf-navegacion button {
      padding: 8px 12px;
      min-height: 36px;
      font-size: 12px;
    }

    .hf-contador {
      color: #607080;
      font-size: 12px;
    }
  `;

  document.head.appendChild(estilos);

  // =========================================
  // PANEL DENTRO DEL FORMULARIO
  // =========================================

  const panel = document.createElement("section");

  panel.id = "panelHistorial";
  panel.className = "hf-panel";
  panel.hidden = true;

  panel.innerHTML = `
    <div class="hf-titulo">
      Últimos entrenamientos
    </div>

    <div class="hf-fechas" id="hfFechas">
      <button type="button" class="hf-fecha" disabled>
        Sin registro
      </button>

      <button type="button" class="hf-fecha" disabled>
        Sin registro
      </button>

      <button type="button" class="hf-fecha" disabled>
        Sin registro
      </button>
    </div>

    <div
      id="hfContenido"
      class="hf-contenido"
      aria-live="polite"
    ></div>

    <div class="hf-navegacion">

      <button
        type="button"
        id="hfAnterior"
        class="btn-secundario"
      >
        ← Anterior
      </button>

      <span id="hfContador" class="hf-contador">
      </span>

      <button
        type="button"
        id="hfSiguiente"
        class="btn-secundario"
      >
        Siguiente →
      </button>

    </div>
  `;

  // Insertar justo debajo del botón de consulta
  boton.parentElement.after(panel);

  const contenido = document.getElementById("hfContenido");
  const fechas = document.getElementById("hfFechas");
  const anterior = document.getElementById("hfAnterior");
  const siguiente = document.getElementById("hfSiguiente");
  const contador = document.getElementById("hfContador");


  // =========================================
  // CONSULTAR HISTORIAL
  // =========================================

  boton.addEventListener("click", async () => {

    const nombre = (
      localStorage.getItem("Usuario") || ""
    ).trim();

    const ejercicio = (
      document.getElementById("ejercicio")?.value || ""
    ).trim();

    if (!nombre || !ejercicio) {
      alert("Selecciona primero un ejercicio.");
      return;
    }

    const peticionActual = ++numeroPeticionHistorial;

    panel.hidden = false;
    boton.disabled = true;

    contenido.textContent = "Consultando entrenamientos...";
    contador.textContent = "";

    fechas.hidden = true;
    anterior.disabled = true;
    siguiente.disabled = true;

    try {

      const respuesta = await consultarHistorial(
        nombre,
        ejercicio
      );

      // Ignorar respuestas antiguas
      if (peticionActual !== numeroPeticionHistorial) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          respuesta.error || "Error al consultar"
        );
      }

      registrosHistorial = Array.isArray(respuesta.registros)
        ? respuesta.registros.slice(0, 3)
        : [];

      indiceHistorial = 0;

      mostrarHistorial();

    } catch (error) {

      if (peticionActual === numeroPeticionHistorial) {
        contenido.textContent =
          "No se pudo consultar el historial: " +
          error.message;
      }

    } finally {

      boton.disabled = false;
    }
  });


  // =========================================
  // CAMBIAR ENTRE FECHAS
  // =========================================

  anterior.addEventListener("click", () => {

    if (
      indiceHistorial <
      registrosHistorial.length - 1
    ) {

      indiceHistorial++;
      mostrarHistorial();
    }
  });

  siguiente.addEventListener("click", () => {

    if (indiceHistorial > 0) {

      indiceHistorial--;
      mostrarHistorial();
    }
  });


  // =========================================
  // MOSTRAR LOS TRES LABELS Y EL TEXTO DE AZ
  // =========================================

  function mostrarHistorial() {

    fechas.hidden = false;
    fechas.replaceChildren();

    if (registrosHistorial.length === 0) {

      contenido.textContent =
        "No hay entrenamientos anteriores de este ejercicio.";

      contador.textContent = "";

      anterior.disabled = true;
      siguiente.disabled = true;

      for (let i = 0; i < 3; i++) {

        const vacio = document.createElement("button");

        vacio.type = "button";
        vacio.className = "hf-fecha";
        vacio.textContent = "Sin registro";
        vacio.disabled = true;

        fechas.appendChild(vacio);
      }

      return;
    }

    // Crear los tres botones/labels de fecha
    for (let i = 0; i < 3; i++) {

      const etiqueta = document.createElement("button");

      etiqueta.type = "button";
      etiqueta.className = "hf-fecha";

      if (i < registrosHistorial.length) {

        etiqueta.textContent = extraerFecha(
          registrosHistorial[i],
          i
        );

        if (i === indiceHistorial) {
          etiqueta.classList.add("activa");
        }

        etiqueta.setAttribute(
          "aria-pressed",
          String(i === indiceHistorial)
        );

        etiqueta.addEventListener("click", () => {

          indiceHistorial = i;
          mostrarHistorial();
        });

      } else {

        etiqueta.textContent = "Sin registro";
        etiqueta.disabled = true;
      }

      fechas.appendChild(etiqueta);
    }

    // Contenido literal de la columna AZ
    contenido.textContent =
      registrosHistorial[indiceHistorial];

    contador.textContent =
      `${indiceHistorial + 1} de ${registrosHistorial.length}`;

    // Anterior = fecha más antigua
    anterior.disabled =
      indiceHistorial >= registrosHistorial.length - 1;

    // Siguiente = fecha más reciente
    siguiente.disabled =
      indiceHistorial === 0;
  }


  // =========================================
  // EXTRAER FECHA DE LA PRIMERA LÍNEA DE AZ
  // =========================================

  function extraerFecha(registro, posicion) {

    const primeraLinea = String(registro)
      .split(/\r?\n/)[0]
      .trim();

    // Formato 2026-11-13
    const iso = primeraLinea.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

    if (iso) {

      return (
        iso[3].padStart(2, "0") + "/" +
        iso[2].padStart(2, "0") + "/" +
        iso[1]
      );
    }

    // Formato 13/11/2026
    const esp = primeraLinea.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );

    if (esp) {
      return primeraLinea;
    }

    return "Registro " + (posicion + 1);
  }


  // =========================================
  // OCULTAR HISTORIAL SI CAMBIA EL EJERCICIO
  // =========================================

  function reiniciarHistorial() {

    numeroPeticionHistorial++;

    registrosHistorial = [];
    indiceHistorial = 0;

    panel.hidden = true;
  }

  document.getElementById("ejercicio")
    ?.addEventListener("input", reiniciarHistorial);

  document.getElementById("listPicker1")
    ?.addEventListener("change", reiniciarHistorial);

  document.getElementById("nuevoEjercicio")
    ?.addEventListener("click", reiniciarHistorial);

});


// =========================================
// CONEXIÓN CON APPS SCRIPT
// =========================================

function consultarHistorial(nombre, ejercicio) {

  return new Promise((resolve, reject) => {

    if (!HISTORIAL_URL.startsWith("https://")) {

      reject(new Error(
        "Falta configurar la URL del Apps Script."
      ));

      return;
    }

    const callback =
      "rvbHistorial_" +
      Date.now() +
      Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    let terminado = false;
    let temporizador;

    function limpiar() {

      if (terminado) return false;

      terminado = true;

      clearTimeout(temporizador);
      script.remove();
      delete window[callback];

      return true;
    }

    window[callback] = datos => {

      if (limpiar()) {
        resolve(datos);
      }
    };

    script.onerror = () => {

      if (limpiar()) {

        reject(new Error(
          "No se pudo conectar con Apps Script."
        ));
      }
    };

    temporizador = setTimeout(() => {

      if (limpiar()) {

        reject(new Error(
          "La consulta ha tardado demasiado."
        ));
      }

    }, 20000);

    const url = new URL(HISTORIAL_URL);

    url.searchParams.set(
      "accion",
      "historialFuerza"
    );

    url.searchParams.set(
      "nombre",
      nombre
    );

    url.searchParams.set(
      "ejercicio",
      ejercicio
    );

    url.searchParams.set(
      "callback",
      callback
    );

    url.searchParams.set(
      "_",
      Date.now().toString()
    );

    script.src = url.toString();

    document.head.appendChild(script);
  });
}
