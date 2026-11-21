/* Guard de navegación de RVB Jugadores.
 * Comprueba presencia/expiración local de la sesión ANTES de mostrar
 * la página, y valida el token contra Apps Script en cada apertura.
 * La comprobación visual no sustituye al control de servidor.
 */
(function () {
  "use strict";
  document.documentElement.style.visibility = "hidden";
  const api = window.RVBJugadorAPI;
  const sesion = api?.sesion();
  const validaLocal = sesion &&
    typeof sesion.token === "string" && /^RVBJ_[0-9a-f]{64}$/.test(sesion.token) &&
    typeof sesion.usuario === "string" && !!sesion.usuario.trim() &&
    Number(sesion.exp) > Date.now();

  function volverAlLogin() {
    sessionStorage.removeItem("rvb_jugador_sesion");
    sessionStorage.removeItem("rvb_sesion_activa");
    window.location.replace("index.html");
  }

  if (!validaLocal) { volverAlLogin(); return; }
  api.leer("validarSesionJugador", { token: sesion.token }).then(respuesta => {
    if (!respuesta?.ok || respuesta.usuario !== sesion.usuario ||
        Number(respuesta.exp) <= Date.now()) {
      volverAlLogin();
      return;
    }
    // El usuario no puede simplemente cambiar localStorage para suplantar a otro.
    localStorage.setItem("Usuario", respuesta.usuario);
    document.documentElement.style.visibility = "";
  }).catch(() => {
    // Sin autenticación comprobable no se habilitan páginas privadas.
    volverAlLogin();
  });
})();
