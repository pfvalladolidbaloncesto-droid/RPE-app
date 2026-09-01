const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/1eca4eShUyVGaxiuB13ONX_dzXynArxuUQmtfFBx5veU/formResponse";

document.addEventListener("DOMContentLoaded", async () => {
  const fechaInput = document.getElementById("fecha");
  const nombreInput = document.getElementById("nombre");
  const equipoSelect = document.getElementById("equiposel");
  const entrenamientoSelect = document.getElementById("entrenamiento");
  const rpeInput = document.getElementById("rpe");
  const estatusSelect = document.getElementById("estatus");
  const comentariosInput = document.getElementById("comentarios");
  const rpeForm = document.getElementById("rpeForm");

  // Establecer fecha actual por defecto (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  fechaInput.value = today;

  // Recuperar el usuario guardado previamente en el Login
  const usuarioGuardado = localStorage.getItem("Usuario") || localStorage.getItem("startValue") || "";
  nombreInput.value = usuarioGuardado;

  // Consultar equipo asignado desde Apps Script
  if (usuarioGuardado) {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(usuarioGuardado)}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const equipoEncontrado = data[0].columna3 || "";
        if (equipoEncontrado) {
          equipoSelect.value = equipoEncontrado;
        }
      }
    } catch (error) {
      console.error("Error al consultar equipo:", error);
    }
  }

  // Envío del formulario con validaciones estrictas
  rpeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Limpiar marcas de error de previa validación
    [fechaInput, nombreInput, equipoSelect, entrenamientoSelect, rpeInput, estatusSelect].forEach(el => {
      el.classList.remove("input-error");
    });

    let isValid = true;
    let mensajeError = "";

    // Validar campos vacíos
    if (!fechaInput.value) { fechaInput.classList.add("input-error"); isValid = false; }
    if (!nombreInput.value) { nombreInput.classList.add("input-error"); isValid = false; }
    if (!equipoSelect.value) { equipoSelect.classList.add("input-error"); isValid = false; }
    if (!entrenamientoSelect.value) { entrenamientoSelect.classList.add("input-error"); isValid = false; }
    if (!rpeInput.value) { rpeInput.classList.add("input-error"); isValid = false; }
    if (!estatusSelect.value) { estatusSelect.classList.add("input-error"); isValid = false; }

    if (!isValid) {
      mensajeError = "Comprueba campos obligatorios";
    }

    // Validar rango numérico de RPE (0 - 10)
    const rpeVal = parseFloat(rpeInput.value);
    if (isNaN(rpeVal) || rpeVal < 0 || rpeVal > 10) {
      rpeInput.classList.add("input-error");
      isValid = false;
      mensajeError = mensajeError || "Comprueba valores de campos obligatorios";
    }

    if (!isValid) {
      alert(mensajeError);
      return;
    }

    // Construir los parámetros URL para Google Form
    const params = new URLSearchParams({
      'entry.1206689442': fechaInput.value,
      'entry.1144883834': nombreInput.value,
      'entry.697775640': equipoSelect.value,
      'entry.1150680246': entrenamientoSelect.value,
      'entry.961295529': rpeInput.value,
      'entry.1650450183': estatusSelect.value,
      'entry.1691140284': comentariosInput.value || ""
    });

    try {
      // Enviar datos al Google Form
      await fetch(`${GOOGLE_FORM_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      });

      // Redirigir a la pantalla Final
      window.location.href = "Final.html";
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Hubo un problema al enviar los datos. Revisa tu conexión.");
    }
  });
});