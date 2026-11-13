
const PAGINAS = Object.freeze({
  rpe: "RPE.html",
  fuerza: "EntrenamientoFuerza.html",
  rendimiento: "ConsultarRendimientoFuerza.html",
  inicio: "index.html"
});

document.addEventListener("DOMContentLoaded", () => {

  const sesionActiva =
    sessionStorage.getItem("rvb_sesion_activa") === "true";

  const usuario =
    localStorage.getItem("Usuario") || "";

  // Comprobación básica de navegación
  if (!sesionActiva || !usuario) {
    window.location.replace(PAGINAS.inicio);
    return;
  }

  // SALUDO PERSONALIZADO
  const equipo =
    localStorage.getItem("EquipoPrin") || "";

  const saludo =
    document.getElementById("saludoUsuario");

  if (saludo) {
    saludo.textContent = equipo
      ? `Hola, ${usuario} · ${equipo}`
      : `Hola, ${usuario}. Selecciona una opción para continuar.`;
  }

  // BOTÓN RPE
  document.getElementById("btnRPE")
    .addEventListener("click", () => {
      window.location.href = PAGINAS.rpe;
    });

  // BOTÓN ENTRENAMIENTO DE FUERZA
  document.getElementById("btnFuerza")
    .addEventListener("click", () => {
      window.location.href = PAGINAS.fuerza;
    });

  // BOTÓN RENDIMIENTO DE FUERZA
  document.getElementById("btnRendimiento")
    .addEventListener("click", () => {
      window.location.href = PAGINAS.rendimiento;
    });

  // CONSULTAR TEST
  // Permanece desactivado en el HTML.

  // CERRAR SESIÓN
  document.getElementById("btnLogout")
    .addEventListener("click", () => {

      sessionStorage.removeItem("rvb_sesion_activa");
      localStorage.removeItem("EquipoPrin");

      if (localStorage.getItem("remember") !== "true") {
        localStorage.removeItem("Usuario");
        localStorage.removeItem("PassRecordada");
      }

      window.location.replace(PAGINAS.inicio);
    });

});
