/*
 * RVB Jugadores - Control de acceso a páginas interiores (v2).
 *
 * El login crea una sesión temporal en sessionStorage después de que
 * Apps Script autentique las credenciales y emita un token RVBJ_.
 *
 * Las páginas comprueban esa sesión y su vencimiento localmente.
 * No vuelven a consultar Apps Script en cada salto de página: una
 * caída o fallo puntual de red no debe destruir una sesión vigente.
 *
 * IMPORTANTE: este guard solo protege la navegación/interfaz.
 * Cada endpoint sensible del servidor debe validar el token, como
 * hacen las operaciones de autenticación y cambio de contraseña.
 */
(function () {
  "use strict";

  let sesion = null;
  try {
    sesion = JSON.parse(
      sessionStorage.getItem("rvb_jugador_sesion") || "null"
    );
  } catch (_) {
    // Un dato de sesión ilegible no constituye una sesión válida.
  }

  const activa = Boolean(
    sesion &&
    typeof sesion.token === "string" &&
    /^RVBJ_[0-9a-f]{64}$/.test(sesion.token) &&
    typeof sesion.usuario === "string" &&
    sesion.usuario.trim() !== "" &&
    Number.isFinite(Number(sesion.exp)) &&
    Number(sesion.exp) > Date.now()
  );

  if (!activa) {
    sessionStorage.removeItem("rvb_jugador_sesion");
    sessionStorage.removeItem("rvb_sesion_activa");
    location.replace("index.html");
  }
})();
