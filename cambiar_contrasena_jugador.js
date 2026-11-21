/* Cambio de contraseña de la cuenta autenticada de RVB Jugadores.
 * No acepta un ID de jugador desde la PWA: el servidor utiliza el del token.
 */
document.addEventListener("DOMContentLoaded", () => {
  const api = window.RVBJugadorAPI;
  const sesion = api.sesion();
  const $ = id => document.getElementById(id);
  if (!sesion?.token) { location.replace("index.html"); return; }
  $("usuarioConectado").value = sesion.usuario;
  $("btnVolverMenu").addEventListener("click", () => { location.href = "menu_opciones.html"; });

  function informar(mensaje, clase = "") {
    $("estadoCambio").textContent = mensaje;
    $("estadoCambio").className = clase;
  }

  $("formCambiarContrasena").addEventListener("submit", async evento => {
    evento.preventDefault();
    const actual = $("passwordActual").value;
    const nueva = $("passwordNueva").value;
    const confirmacion = $("passwordConfirmar").value;
    if (!actual) return informar("Introduce la contraseña actual.", "error");
    if (nueva.length < 8 || nueva.length > 128 || nueva.trim() !== nueva || /[\r\n]/.test(nueva) || nueva.startsWith("=")) {
      return informar("La contraseña nueva debe tener entre 8 y 128 caracteres, sin espacios en los extremos.", "error");
    }
    if (actual === nueva) return informar("La contraseña nueva debe ser diferente de la actual.", "error");
    if (nueva !== confirmacion) return informar("Las contraseñas nuevas no coinciden.", "error");
    const boton = $("btnGuardarContrasena");
    boton.disabled = true;
    informar("Actualizando la contraseña...");
    try {
      await api.solicitarConEstado(
        "cambiarContrasenaJugador", "estadoCambioContrasenaJugador",
        { token: sesion.token, passwordActual: actual, passwordNueva: nueva }, sesion.token
      );
      if (localStorage.getItem("remember") === "true" && navigator.credentials?.store &&
          typeof PasswordCredential === "function") {
        try {
          await navigator.credentials.store(new PasswordCredential({
            id: sesion.usuario, password: nueva, name: sesion.usuario
          }));
        } catch (_) { /* Puede ser necesario actualizarla manualmente en el navegador. */ }
      }
      ["passwordActual", "passwordNueva", "passwordConfirmar"].forEach(id => { $(id).value = ""; });
      informar("Contraseña actualizada. La sesión continúa abierta; utiliza la nueva clave en el próximo login.", "exito");
    } catch (error) {
      console.error("Cambio contraseña RVB:", error);
      informar(error.message || "No se pudo cambiar la contraseña.", "error");
    } finally { boton.disabled = false; }
  });
});
