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

  // 1. Actualizar el valor visual del RPE (compatible con PC, iOS y Android)
  if (rpeInput && rpeValueDisplay) {
    const actualizarTextoRPE = () => {
      rpeValueDisplay.textContent = rpeInput.value;
    };

    rpeInput.addEventListener("input", actualizarTextoRPE);
    rpeInput.addEventListener("change", actualizarTextoRPE);
    rpeInput.addEventListener("touchmove", actualizarTextoRPE);
  }

  // 2. Establecer fecha actual local (YYYY-MM-DD)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  fechaInput.value = `${year}-${month}-${day}`;

  // 3. Cargar Nombre de Usuario desde localStorage
  const usuarioGuardado = localStorage.getItem("Usuario") || localStorage.getItem("startValue") || "";
  nombreInput.value = usuarioGuardado;
  nombreInput.readOnly = true;

  // 4. Cargar Equipo instantáneamente desde memoria local
  const equipoGuardado = localStorage.getItem("EquipoPrin") || "";
  if (equipoGuardado) {
    equipoSelect.value = equipoGuardado;
  }

  // 5. Envío del formulario a Google Forms
  rpeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    [fechaInput, nombreInput, equipoSelect, entrenamientoSelect, rpeInput, estatusSelect].forEach(el => {
      el.classList.remove("input-error");
    });

    let isValid = true;
    let mensajeError = "";

    if (!fechaInput.value) { fechaInput.classList.add("input-error"); isValid = false; }
    if (!nombreInput.value) { nombreInput.classList.add("input-error"); isValid = false; }
    if (!equipoSelect.value) { equipoSelect.classList.add("input-error"); isValid = false; }
    if (!entrenamientoSelect.value) { entrenamientoSelect.classList.add("input-error"); isValid = false; }
    if (!rpeInput.value) { rpeInput.classList.add("input-error"); isValid = false; }
    if (!estatusSelect.value) { estatusSelect.classList.add("input-error"); isValid = false; }

    if (!isValid) {
      mensajeError = "Comprueba campos obligatorios";
    }

    const rpeVal = parseInt(rpeInput.value, 10);
    if (isNaN(rpeVal) || rpeVal < 0 || rpeVal > 10) {
      rpeInput.classList.add("input-error");
      isValid = false;
      mensajeError = mensajeError || "Comprueba valores de campos obligatorios";
    }

    if (!isValid) {
      alert(mensajeError);
      return;
    }

    const params = new URLSearchParams({
      'entry.1206689442': fechaInput.value,
      'entry.1144883834': nombreInput.value,
      'entry.697775640': equipoSelect.value,
      'entry.1150680246': entrenamientoSelect.value,
      'entry.961295529': rpeVal.toString(),
      'entry.1650450183': estatusSelect.value,
      'entry.1691140284': comentariosInput.value || ""
    });

    try {
      await fetch(`${GOOGLE_FORM_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors'
      });

      window.location.href = "Final.html";
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Hubo un problema al enviar los datos. Revisa tu conexión.");
    }
  });
});
