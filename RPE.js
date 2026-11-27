
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/1eca4eShUyVGaxiuB13ONX_dzXynArxuUQmtfFBx5veU/formResponse";

document.addEventListener("DOMContentLoaded", () => {

  const fechaInput = document.getElementById("fecha");
  const nombreInput = document.getElementById("nombre");
  const equipoSelect = document.getElementById("equiposel");
  const entrenamientoSelect = document.getElementById("entrenamiento");
  const rpeInput = document.getElementById("rpe");
  const rpeValueDisplay = document.getElementById("rpeValue");
  const estatusSelect = document.getElementById("estatus");
  const comentariosInput = document.getElementById("comentarios");
  const rpeForm = document.getElementById("rpeForm");

  // ==========================================
  // BOTÓN MENÚ DE OPCIONES
  // ==========================================

  const btnFunciones =
    document.getElementById("btnFunciones");

  if (btnFunciones) {
    btnFunciones.addEventListener("click", () => {
      window.location.href = "menu_opciones.html";
    });
  }

  // ==========================================
  // ACTUALIZACIÓN VISUAL DEL RPE
  // ==========================================

  if (rpeInput && rpeValueDisplay) {

    const actualizarTextoRPE = () => {
      window.requestAnimationFrame(() => {
        rpeValueDisplay.textContent = rpeInput.value;
      });
    };

    [
      "input",
      "change",
      "touchmove",
      "pointermove",
      "touchend"
    ].forEach(evt => {
      rpeInput.addEventListener(
        evt,
        actualizarTextoRPE,
        { passive: true }
      );
    });
  }

  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  fechaInput.value = `${year}-${month}-${day}`;

  // ==========================================
  // USUARIO
  // ==========================================

  const usuarioGuardado =
    localStorage.getItem("Usuario") ||
    localStorage.getItem("startValue") ||
    "";

  nombreInput.value = usuarioGuardado;
  nombreInput.readOnly = true;

  // ==========================================
  // EQUIPO PREDETERMINADO DEL JUGADOR
  // ==========================================

  // Recuperar la sesión activa del jugador.

  let sesionJugador = null;

  try {
    sesionJugador = JSON.parse(
      sessionStorage.getItem("rvb_jugador_sesion") || "null"
    );
  } catch (error) {
    console.warn(
      "No se pudo recuperar la sesión del jugador:",
      error
    );
  }

  // Priorizar el equipo de la sesión activa.
  // Utilizar EquipoPrin como alternativa.

  const equipoGuardado =
    sesionJugador?.equipo ||
    localStorage.getItem("EquipoPrin") ||
    "";

  // Normalizar los nombres de los equipos.
  // Ejemplo: JUNIOR A = Junior A.

  function normalizarEquipo(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  // Buscar la opción correspondiente del selector.

  const opcionEquipo = Array.from(equipoSelect.options).find(
    opcion =>
      opcion.value !== "" &&
      normalizarEquipo(opcion.value) ===
      normalizarEquipo(equipoGuardado)
  );

  if (opcionEquipo) {

    equipoSelect.value = opcionEquipo.value;

    console.log(
      "Equipo predeterminado seleccionado:",
      opcionEquipo.value
    );

  } else {

    equipoSelect.value = "";

    console.warn(
      "Equipo predeterminado no encontrado:",
      equipoGuardado
    );

  }

  // El jugador puede seguir seleccionando
  // manualmente otro equipo si ha entrenado con él.

  // ==========================================
  // ENVÍO A GOOGLE FORMS
  // ==========================================

  rpeForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    [
      fechaInput,
      nombreInput,
      equipoSelect,
      entrenamientoSelect,
      rpeInput,
      estatusSelect
    ].forEach(el => {
      el.classList.remove("input-error");
    });

    let isValid = true;
    let mensajeError = "";

    if (!fechaInput.value) {
      fechaInput.classList.add("input-error");
      isValid = false;
    }

    if (!nombreInput.value) {
      nombreInput.classList.add("input-error");
      isValid = false;
    }

    if (!equipoSelect.value) {
      equipoSelect.classList.add("input-error");
      isValid = false;
    }

    if (!entrenamientoSelect.value) {
      entrenamientoSelect.classList.add("input-error");
      isValid = false;
    }

    if (!rpeInput.value) {
      rpeInput.classList.add("input-error");
      isValid = false;
    }

    if (!estatusSelect.value) {
      estatusSelect.classList.add("input-error");
      isValid = false;
    }

    if (!isValid) {
      mensajeError = "Comprueba campos obligatorios";
    }

    const rpeVal = parseInt(rpeInput.value, 10);

    if (isNaN(rpeVal) || rpeVal < 0 || rpeVal > 10) {

      rpeInput.classList.add("input-error");

      isValid = false;

      mensajeError =
        mensajeError ||
        "Comprueba valores de campos obligatorios";
    }

    if (!isValid) {
      alert(mensajeError);
      return;
    }

    // ==========================================
    // PARÁMETROS DE GOOGLE FORMS
    // ==========================================

    const params = new URLSearchParams({
      "entry.1206689442": fechaInput.value,
      "entry.1144883834": nombreInput.value,
      "entry.697775640": equipoSelect.value,
      "entry.1150680246": entrenamientoSelect.value,
      "entry.961295529": rpeVal.toString(),
      "entry.1650450183": estatusSelect.value,
      "entry.1691140284": comentariosInput.value || ""
    });

    try {

      await fetch(
        `${GOOGLE_FORM_URL}?${params.toString()}`,
        {
          method: "GET",
          mode: "no-cors"
        }
      );

      window.location.href = "Final.html";

    } catch (error) {

      console.error(
        "Error al enviar el formulario:",
        error
      );

      alert(
        "Hubo un problema al enviar los datos. Revisa tu conexión."
      );

    }
  });

});
