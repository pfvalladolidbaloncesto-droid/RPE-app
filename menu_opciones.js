
/*
========================================
MENÚ DE OPCIONES - RV BALONCESTO
========================================
*/

const PAGINAS = {
  rpe: "RPE.html",
  fuerza: "EntrenamientoFuerza.html",
  rendimiento: "ConsultarRendimientoFuerza.html",
  test: "ConsultarTests.html",
  inicio: "index.html",
  cambiarContrasena: "cambiar_contrasena.html"
};

document.addEventListener("DOMContentLoaded", () => {

  // ======================================
  // MOSTRAR DATOS DEL JUGADOR
  // ======================================

  const usuario =
    localStorage.getItem("Usuario") || "";

  const equipo =
    localStorage.getItem("EquipoPrin") || "";

  const saludo =
    document.getElementById("saludoUsuario");

  if (saludo) {
    if (usuario && equipo) {
      saludo.textContent =
        `Hola, ${usuario} · ${equipo}`;
    } else if (usuario) {
      saludo.textContent = `Hola, ${usuario}`;
    } else {
      saludo.textContent =
        "Selecciona una opción para continuar";
    }
  }

  // ======================================
  // REGISTRAR RPE
  // ======================================

  const btnRPE = document.getElementById("btnRPE");

  if (btnRPE) {
    btnRPE.addEventListener("click", () => {
      window.location.href = PAGINAS.rpe;
    });
  }

  // ======================================
  // REGISTRAR ENTRENAMIENTO DE FUERZA
  // ======================================

  const btnFuerza =
    document.getElementById("btnFuerza");

  if (btnFuerza) {
    btnFuerza.addEventListener("click", () => {
      window.location.href = PAGINAS.fuerza;
    });
  }

  // ======================================
  // CONSULTAR RENDIMIENTO DE FUERZA
  // ======================================

  const btnRendimiento =
    document.getElementById("btnRendimiento");

  if (btnRendimiento) {
    btnRendimiento.addEventListener("click", () => {
      window.location.href = PAGINAS.rendimiento;
    });
  }

  // ======================================
  // CONSULTAR TEST
  // ======================================

    const btnTest =
    document.getElementById("btnTest");

  if (btnTest) {
    btnTest.addEventListener("click", () => {
      window.location.href = PAGINAS.test;
    });
  }

  // CAMBIAR CONTRASEÑA (la propia cuenta)
  const btnCambio = document.getElementById("btnCambiarContrasena");
  if (btnCambio) btnCambio.addEventListener("click", () => {
    window.location.href = PAGINAS.cambiarContrasena;
  });

  // CERRAR SESIÓN
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", () => {
    window.RVBJugadorAPI.salir();
  });
});
