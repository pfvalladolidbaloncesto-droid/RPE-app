
/*
=========================================
EJERCICIOS FUERZA - RV BALONCESTO
=========================================

Sincroniza el selector de ejercicios con
los registros históricos de Google Sheets.

Conserva:
- Los ejercicios básicos.
- Los ejercicios personalizados locales.
- Los ejercicios históricos de Google Sheets.
*/

// =========================================
// CONFIGURACIÓN
// =========================================

const URL_EJERCICIOS_RVB =
  "https://script.google.com/macros/s/AKfycbw4pFSJsejB7Q5SaID_ixMWiED5hE7qVf_oSNuZPvOuecm0eCr7wWhYvBamrJ7CS8O6/exec";


// =========================================
// INICIALIZAR SINCRONIZACIÓN
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  const nombre = usuarioActual().trim();

  if (!nombre) {
    console.warn("No se encontró el usuario.");
    return;
  }

  try {

    const respuesta = await consultarEjerciciosRVB(nombre);

    if (!respuesta.ok) {
      throw new Error(
        respuesta.error || "Error al consultar ejercicios"
      );
    }

    const ejerciciosGoogle = Array.isArray(
      respuesta.ejercicios
    ) ? respuesta.ejercicios : [];

    // Combinar las tres fuentes
    const unicos = new Map();

    [
      ...EJERCICIOS_BASE,
      ...listaEjercicios,
      ...ejerciciosGoogle
    ].forEach(ejercicio => {

      const limpio = String(ejercicio).trim();

      if (!limpio) return;

      const clave = limpio.toLocaleLowerCase("es");

      if (!unicos.has(clave)) {
        unicos.set(clave, limpio);
      }
    });

    // Actualizar el catálogo de la PWA
    listaEjercicios = Array.from(
      unicos.values()
    ).sort((a, b) => a.localeCompare(b, "es"));

    // Guardar una copia local de los ejercicios
    // adicionales para utilizarlos sin conexión.
    const personalizados = listaEjercicios.filter(e =>
      !EJERCICIOS_BASE.some(base =>
        base.toLocaleLowerCase("es") ===
        e.toLocaleLowerCase("es")
      )
    );

    localStorage.setItem(
      claveEjercicios(),
      JSON.stringify(personalizados)
    );

    // Conservar la selección actual si el usuario
    // ya ha empezado a utilizar el formulario.
    const selector =
      document.getElementById("listPicker1");

    const seleccionAnterior = selector.value;

    const filtroActual =
      document.getElementById("buscadorEjercicio").value;

    // Refrescar lista sin borrar el ejercicio escrito
    renderSelector(filtroActual);

    // Restaurar ejercicio seleccionado
    const existeSeleccion = Array.from(
      selector.options
    ).some(op => op.value === seleccionAnterior);

    if (existeSeleccion) {
      selector.value = seleccionAnterior;
    }

    console.log(
      "Ejercicios sincronizados:",
      listaEjercicios.length
    );

  } catch (error) {

    console.warn(
      "No se pudieron sincronizar los ejercicios.",
      error
    );

    // Si falla la conexión, los ejercicios básicos
    // y los guardados localmente siguen disponibles.
  }

});


// =========================================
// CONSULTA A GOOGLE APPS SCRIPT
// =========================================

function consultarEjerciciosRVB(nombre) {

  return new Promise((resolve, reject) => {

    const callback =
      "rvbEjercicios_" +
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
        reject(
          new Error("No se pudo conectar con Apps Script.")
        );
      }
    };

    temporizador = setTimeout(() => {

      if (limpiar()) {
        reject(
          new Error("Tiempo de espera agotado.")
        );
      }

    }, 20000);

    const url = new URL(URL_EJERCICIOS_RVB);

    url.searchParams.set(
      "accion",
      "ejerciciosFuerza"
    );

    url.searchParams.set(
      "nombre",
      nombre
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
