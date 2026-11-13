
const FORM_RESPONSE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdlXoK_igArw20URYqD4AA5-Jjdrlcr25rdfXAJr2F2xkEOOw/formResponse";

const CAMPOS = {
  usuario: "entry.1052562463",
  fecha: "entry.2002526298",
  ejercicio: "entry.1315747589",
  vbt: "entry.9949262",
  observaciones: "entry.636191433",

  kg: [
    "entry.631342381",
    "entry.1579682820",
    "entry.34824846",
    "entry.910847423",
    "entry.2004267982",
    "entry.1166189654"
  ],

  int: [
    "entry.1743166598",
    "entry.1209305030",
    "entry.528917915",
    "entry.831909719",
    "entry.207883616",
    "entry.1135214150"
  ],

  rep: [
    "entry.189884999",
    "entry.676283789",
    "entry.788505499",
    "entry.1951974537",
    "entry.1594603315",
    "entry.1557441991"
  ],

  rir: [
    "entry.164706516",
    "entry.1940734848",
    "entry.1498087804",
    "entry.424157927",
    "entry.1303875824",
    "entry.301613450"
  ],

  rec: [
    "entry.297841540",
    "entry.1689760695",
    "entry.1917477661",
    "entry.1976325897",
    "entry.1101581192",
    "entry.490439673"
  ],

  rm: [
    "entry.1607583138",
    "entry.337634217",
    "entry.975920808",
    "entry.810637765",
    "entry.30846413",
    "entry.408397467"
  ]
};

// ================================================
// CATÁLOGO FIJO DE EJERCICIOS
// ================================================

const EJERCICIOS_BASE = [
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

// ================================================
// VARIABLES
// ================================================

let inicioDescanso = 0;
let intervaloDescanso = null;
let listaEjercicios = [];
let enviando = false;

const $ = id => document.getElementById(id);

const valor = id =>
  ($(id)?.value || "").trim();

const numero = id =>
  Number(valor(id).replace(",", "."));

const texto = (id, contenido) => {
  const elemento = $(id);
  if (elemento) elemento.textContent = contenido;
};

const usuarioActual = () =>
  localStorage.getItem("Usuario") ||
  localStorage.getItem("startValue") ||
  "";

const modoVBT = () => $("vbt").checked;

function fechaLocal() {
  const f = new Date();

  return [
    f.getFullYear(),
    String(f.getMonth() + 1).padStart(2, "0"),
    String(f.getDate()).padStart(2, "0")
  ].join("-");
}

// ================================================
// INICIALIZACIÓN
// ================================================

window.addEventListener("DOMContentLoaded", () => {

  $("fechaRegistro").value = fechaLocal();

  texto(
    "nombreJugador",
    usuarioActual() || "Usuario no identificado"
  );

  crearSeries();
  cargarEjercicios();
  enlazarEventos();
  actualizarPorcentaje();

});

// ================================================
// CREAR LAS 6 SERIES
// ================================================

function crearSeries() {

  $("seriesContainer").innerHTML = "";

  for (let n = 1; n <= 6; n++) {

    const fila = document.createElement("div");

    fila.className = "serie-row";
    fila.id = `fila${n}`;

    fila.innerHTML = `
      <div class="grid-8col">

        <input
          type="checkbox"
          id="s${n}"
          aria-label="Activar serie ${n}"
          ${n === 1 ? "checked" : ""}
        >

        <b>${n}</b>

        <input
          type="text"
          id="kg${n}"
          inputmode="decimal"
          aria-label="Kg serie ${n}"
        >

        <input
          type="text"
          id="i${n}"
          inputmode="decimal"
          aria-label="Intensidad o MVP serie ${n}"
        >

        <input
          type="text"
          id="Rep${n}"
          inputmode="numeric"
          aria-label="Repeticiones serie ${n}"
        >

        <input
          type="text"
          id="RIR${n}"
          inputmode="decimal"
          aria-label="RIR o VL serie ${n}"
        >

        <input
          type="text"
          id="rec${n}"
          inputmode="decimal"
          aria-label="Recuperación serie ${n}"
        >

        <input
          type="text"
          id="rm${n}"
          readonly
          aria-label="RM estimado serie ${n}"
        >

      </div>
    `;

    $("seriesContainer").appendChild(fila);
  }

  actualizarSeries();
}

// ================================================
// EVENTOS
// ================================================

function enlazarEventos() {

  $("btnVolverMenu").addEventListener("click", () => {
    location.href = "menu_opciones.html";
  });

  $("fin").addEventListener("click", () => {
    location.href = "menu_opciones.html";
  });

  $("nuevoEjercicio").addEventListener(
    "click",
    limpiarFormulario
  );

  $("enviar").addEventListener(
    "click",
    enviarFormulario
  );

  $("listPicker1").addEventListener("change", e => {
    $("ejercicio").value = e.target.value;
    recalcularTodo();
  });

  $("buscadorEjercicio").addEventListener("input", e => {
    renderSelector(e.target.value);
  });

  $("ejercicio").addEventListener(
    "change",
    recalcularTodo
  );

  $("slider1").addEventListener(
    "input",
    actualizarPorcentaje
  );

  // CAMBIAR ENTRE MODO CONVENCIONAL Y VBT
  $("vbt").addEventListener("change", () => {

    // Limpiar campos cuyo significado cambia
    // y todos los valores anteriores de RM.
    for (let n = 1; n <= 6; n++) {
      $("i" + n).value = "";
      $("RIR" + n).value = "";
      $("rm" + n).value = "";
    }

    actualizarSeries();
    recalcularTodo();
  });

  // ACTIVAR / DESACTIVAR SERIES
  $("seriesContainer").addEventListener("change", e => {

    const coincidencia =
      /^s([1-6])$/.exec(e.target.id);

    if (!coincidencia) return;

    const n = Number(coincidencia[1]);

    // Copiar carga de la serie anterior
    if (
      e.target.checked &&
      n > 1 &&
      !valor("kg" + n)
    ) {
      $("kg" + n).value =
        valor("kg" + (n - 1));
    }

    if (e.target.checked) {
      iniciarDescanso();
    }

    actualizarSeries();
    recalcularTodo();
  });

  // INTRODUCCIÓN DE DATOS
  $("seriesContainer").addEventListener("input", e => {

    if (
      !e.target.matches('input[type="text"]') ||
      e.target.readOnly ||
      e.target.disabled
    ) return;

    // Normalización de números
    e.target.value = e.target.value
      .replace(/,/g, ".")
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    const coincidencia =
      /^(kg|i|Rep|RIR|rec)([1-6])$/
        .exec(e.target.id);

    if (!coincidencia) return;

    const n = Number(coincidencia[2]);

    if (
      !modoVBT() &&
      ["Rep", "RIR"].includes(coincidencia[1])
    ) {
      calcularIntensidad(n);
    }

    if (
      ["kg", "i", "Rep", "RIR"]
        .includes(coincidencia[1])
    ) {
      calcularRM(n);
    }
  });
}

// ================================================
// ESTADOS DE LAS SERIES
// ================================================

function actualizarSeries() {

  const vbt = modoVBT();

  texto("cabeceraInt", vbt ? "MVP" : "Int");
  texto("cabeceraRir", vbt ? "VL" : "RIR");

  for (let n = 1; n <= 6; n++) {

    const habilitada =
      n === 1 ||
      $("s" + (n - 1)).checked;

    const check = $("s" + n);

    if (!habilitada) {
      check.checked = false;
    }

    check.disabled = !habilitada;

    $("fila" + n).classList.toggle(
      "disabled",
      !habilitada
    );

    const activa =
      habilitada && check.checked;

    for (
      const prefijo of
      ["kg", "i", "Rep", "RIR", "rec", "rm"]
    ) {

      const campo = $(prefijo + n);

      // NUEVO:
      // En modo VBT el campo RM queda bloqueado
      // aunque la serie esté activa.
      campo.disabled =
        !activa ||
        (vbt && prefijo === "rm");

      campo.readOnly =
        prefijo === "rm" ||
        (prefijo === "i" && !vbt);

      // Vaciar los RM cuando está activo VBT
      if (
        !activa ||
        (vbt && prefijo === "rm")
      ) {
        campo.value = "";
      }
    }

    $("i" + n).placeholder =
      vbt ? "m/s" : "Auto";

    $("RIR" + n).placeholder =
      vbt ? "%" : "RIR";

    if (activa && !vbt) {
      calcularIntensidad(n);
    }
  }

  actualizarMaximoRM();
}

// ================================================
// INTENSIDAD AUTOMÁTICA
// ================================================

function calcularIntensidad(n) {

  if (modoVBT()) return;

  const reps = valor("Rep" + n);
  const rir = valor("RIR" + n);

  $("i" + n).value =
    reps !== "" && rir !== ""
      ? String(
          numero("Rep" + n) +
          numero("RIR" + n)
        )
      : "";
}

// ================================================
// CÁLCULO DEL RM
// ================================================

function calcularRM(n) {

  const campoRM = $("rm" + n);

  // NUEVO: DESACTIVAR EL RM EN MODO VBT
  if (modoVBT()) {

    campoRM.value = "";
    campoRM.disabled = true;

    actualizarMaximoRM();
    return;
  }

  // Comprobar datos en modo convencional
  if (
    !$("s" + n).checked ||
    !valor("kg" + n) ||
    !valor("i" + n)
  ) {

    campoRM.value = "";
    actualizarMaximoRM();
    return;
  }

  const kg = numero("kg" + n);
  const intensidad = numero("i" + n);

  // Fórmula original de RM convencional
  const estimacion =
    kg > 0 && intensidad > 0
      ? kg * Math.pow(intensidad, 0.1)
      : NaN;

  campoRM.value =
    Number.isFinite(estimacion) &&
    estimacion > 0
      ? estimacion.toFixed(2)
      : "";

  actualizarMaximoRM();
}

function recalcularTodo() {

  for (let n = 1; n <= 6; n++) {

    if (!modoVBT()) {
      calcularIntensidad(n);
    }

    calcularRM(n);
  }
}

// ================================================
// RM MÁXIMO Y PORCENTAJES
// ================================================

function actualizarMaximoRM() {

  // NUEVO: BLOQUEAR TAMBIÉN EL CÁLCULO
  // DE CARGA PORCENTUAL CUANDO VBT ESTÁ ACTIVO.
  if (modoVBT()) {

    $("rmRef").value = "";
    $("rmResultKg").value = "";

    $("rmRef").disabled = true;
    $("rmResultKg").disabled = true;
    $("slider1").disabled = true;

    $("percentage").value = "";

    return;
  }

  // MODO CONVENCIONAL
  $("rmRef").disabled = false;
  $("rmResultKg").disabled = false;
  $("slider1").disabled = false;

  let max = 0;

  for (let n = 1; n <= 6; n++) {

    if ($("s" + n).checked) {
      max = Math.max(
        max,
        Number(valor("rm" + n)) || 0
      );
    }
  }

  $("rmRef").value =
    max ? max.toFixed(2) : "";

  actualizarPorcentaje();
}

function actualizarPorcentaje() {

  // No calcular porcentajes en VBT
  if (modoVBT()) {

    $("percentage").value = "";
    $("rmResultKg").value = "";

    return;
  }

  const porcentaje =
    Number($("slider1").value);

  $("percentage").value =
    porcentaje + "%";

  const rm =
    Number(valor("rmRef")) || 0;

  $("rmResultKg").value =
    rm > 0
      ? (rm * porcentaje / 100)
          .toFixed(1) + " kg"
      : "";
}

// ================================================
// CRONÓMETRO DE DESCANSO
// ================================================

function iniciarDescanso() {

  clearInterval(intervaloDescanso);

  inicioDescanso = Date.now();

  const marcar = () => {

    const segundos = Math.floor(
      (Date.now() - inicioDescanso) / 1000
    );

    texto(
      "minutos",
      String(Math.floor(segundos / 60))
    );

    texto(
      "segundos",
      String(segundos % 60).padStart(2, "0")
    );
  };

  marcar();

  intervaloDescanso = setInterval(
    marcar,
    1000
  );
}

// ================================================
// CATÁLOGO DE EJERCICIOS
// ================================================

function claveEjercicios() {

  return "rvb_ejercicios_" +
    usuarioActual().trim().toLowerCase();
}

function cargarEjercicios() {

  let personalizados = [];

  try {

    const datos = JSON.parse(
      localStorage.getItem(
        claveEjercicios()
      ) || "[]"
    );

    personalizados = Array.isArray(datos)
      ? datos.filter(
          x =>
            typeof x === "string" &&
            x.trim()
        )
      : [];

  } catch (error) {

    console.warn(
      "No se pudo leer la lista de ejercicios",
      error
    );
  }

  // Combinar catálogo fijo y ejercicios personales.
  // Eliminar nombres duplicados.
  const unicos = new Map();

  [
    ...EJERCICIOS_BASE,
    ...personalizados
  ].forEach(ejercicio => {

    const limpio = ejercicio.trim();

    const clave =
      limpio.toLocaleLowerCase("es");

    if (
      limpio &&
      !unicos.has(clave)
    ) {
      unicos.set(clave, limpio);
    }
  });

  listaEjercicios = [...unicos.values()];

  listaEjercicios.sort(
    (a, b) => a.localeCompare(b, "es")
  );

  renderSelector("");
}

function renderSelector(filtro) {

  const picker = $("listPicker1");

  picker.replaceChildren(
    new Option("Seleccionar ejercicio", "")
  );

  listaEjercicios
    .filter(e =>
      e.toLocaleLowerCase("es").includes(
        filtro.toLocaleLowerCase("es")
      )
    )
    .forEach(e => {
      picker.add(new Option(e, e));
    });

  picker.value = "";
}

function guardarEjercicio(ejercicio) {

  const limpio = ejercicio.trim();

  if (!limpio) return;

  const yaExiste = listaEjercicios.some(
    e =>
      e.toLocaleLowerCase("es") ===
      limpio.toLocaleLowerCase("es")
  );

  if (!yaExiste) {

    listaEjercicios.push(limpio);

    listaEjercicios.sort(
      (a, b) => a.localeCompare(b, "es")
    );

    // Guardar únicamente los ejercicios extra.
    // Los básicos ya están en el código.
    const personalizados =
      listaEjercicios.filter(e =>
        !EJERCICIOS_BASE.some(base =>
          base.toLocaleLowerCase("es") ===
          e.toLocaleLowerCase("es")
        )
      );

    localStorage.setItem(
      claveEjercicios(),
      JSON.stringify(personalizados)
    );
  }

  $("buscadorEjercicio").value = "";

  renderSelector("");
}

// ================================================
// NUEVO EJERCICIO
// ================================================

function limpiarFormulario() {

  $("ejercicio").value = "";
  $("buscadorEjercicio").value = "";

  renderSelector("");

  $("vbt").checked = false;
  $("fechaRegistro").value = fechaLocal();
  $("textBox1").value = "";

  for (let n = 1; n <= 6; n++) {

    $("s" + n).checked = n === 1;

    for (
      const p of
      ["kg", "i", "Rep", "RIR", "rec", "rm"]
    ) {

      $(p + n).value = "";
    }
  }

  actualizarSeries();

  $("slider1").value = 50;

  actualizarMaximoRM();

  clearInterval(intervaloDescanso);

  texto("minutos", "0");
  texto("segundos", "00");
  texto("estadoEnvio", "");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ================================================
// VALIDACIÓN DEL REGISTRO
// ================================================

function revisarRegistro() {

  if (!usuarioActual()) {
    return "No se ha encontrado el usuario. Vuelve a iniciar sesión.";
  }

  if (!valor("fechaRegistro")) {
    return "Falta la fecha.";
  }

  if (!valor("ejercicio")) {
    return "Selecciona o escribe un ejercicio.";
  }

  const activas = Array.from(
    { length: 6 },
    (_, i) => i + 1
  ).filter(n => $("s" + n).checked);

  if (!activas.length) {
    return "Activa al menos una serie.";
  }

  for (const n of activas) {

    const kg = numero("kg" + n);
    const reps = numero("Rep" + n);

    if (
      !valor("kg" + n) ||
      !Number.isFinite(kg) ||
      kg <= 0
    ) {
      return `Comprueba los kg de la serie ${n}.`;
    }

    if (
      !valor("Rep" + n) ||
      !Number.isInteger(reps) ||
      reps <= 0
    ) {
      return `Comprueba las repeticiones de la serie ${n}.`;
    }

    if (modoVBT()) {

      // NUEVO:
      // En modo VBT no se exige ningún RM.
      // Solo la velocidad registrada.
      if (
        !valor("i" + n) ||
        !Number.isFinite(numero("i" + n)) ||
        numero("i" + n) <= 0
      ) {
        return `Introduce la MVP de la serie ${n}.`;
      }

    } else {

      if (
        !valor("RIR" + n) ||
        !Number.isFinite(numero("RIR" + n)) ||
        numero("RIR" + n) < 0
      ) {
        return `Comprueba el RIR de la serie ${n}.`;
      }

      if (!valor("rm" + n)) {
        return `No se puede estimar el RM de la serie ${n}; revisa sus datos.`;
      }
    }
  }

  return "";
}

// ================================================
// ENVÍO A GOOGLE FORMS
// ================================================

function enviarFormulario() {

  if (enviando) return;

  recalcularTodo();

  const error = revisarRegistro();

  if (error) {
    alert(error);
    return;
  }

  const datos = {

    [CAMPOS.usuario]:
      usuarioActual(),

    [CAMPOS.fecha]:
      valor("fechaRegistro"),

    [CAMPOS.ejercicio]:
      valor("ejercicio"),

    [CAMPOS.vbt]:
      modoVBT() ? "VBT" : "",

    [CAMPOS.observaciones]:
      valor("textBox1")
  };

  // Datos de las seis series
  for (let i = 0; i < 6; i++) {

    const n = i + 1;

    const activa =
      $("s" + n).checked;

    for (
      const [grupo, prefijo] of [
        ["kg", "kg"],
        ["int", "i"],
        ["rep", "Rep"],
        ["rir", "RIR"],
        ["rec", "rec"],
        ["rm", "rm"]
      ]
    ) {

      // NUEVO:
      // Los campos RM se envían obligatoriamente
      // vacíos cuando VBT está activo.
      datos[CAMPOS[grupo][i]] =
        activa &&
        !(modoVBT() && grupo === "rm")
          ? valor(prefijo + n)
          : "";
    }
  }

  try {

    enviando = true;
    $("enviar").disabled = true;

    // Crear iframe oculto
    const marco =
      document.createElement("iframe");

    marco.name =
      "rvb_form_oculto_" + Date.now();

    marco.style.display = "none";

    document.body.appendChild(marco);

    // Formulario temporal para Google Forms
    const formulario =
      document.createElement("form");

    formulario.method = "POST";
    formulario.action = FORM_RESPONSE_URL;
    formulario.target = marco.name;

    for (
      const [campo, dato] of Object.entries(datos)
    ) {

      const input =
        document.createElement("input");

      input.type = "hidden";
      input.name = campo;
      input.value = dato;

      formulario.appendChild(input);
    }

    document.body.appendChild(formulario);

    formulario.submit();
    formulario.remove();

    // Guardar nombre del ejercicio en el dispositivo
    guardarEjercicio(valor("ejercicio"));

    texto(
      "estadoEnvio",
      "Solicitud enviada a Google Forms. " +
      "Comprueba en Sheets que aparece la respuesta; " +
      "esta pantalla no puede confirmar su recepción."
    );

    // Evitar doble envío inmediato
    setTimeout(() => {

      enviando = false;
      $("enviar").disabled = false;
      marco.remove();

    }, 6000);

  } catch (errorEnvio) {

    console.error(
      "Error al intentar enviar:",
      errorEnvio
    );

    texto(
      "estadoEnvio",
      "No se ha podido iniciar el envío. Revisa la conexión."
    );

    enviando = false;
    $("enviar").disabled = false;
  }
}
