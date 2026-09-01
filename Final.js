document.addEventListener("DOMContentLoaded", () => {
  const btnOtraRespuesta = document.getElementById("btnOtraRespuesta");
  const btnLogOut = document.getElementById("btnLogOut");

  // Redirige de nuevo al formulario de registro RPE
  if (btnOtraRespuesta) {
    btnOtraRespuesta.addEventListener("click", () => {
      window.location.href = "RPE.html";
    });
  }

  // Cierra la sesión y redirige a la pantalla 1 (index.html)
  if (btnLogOut) {
    btnLogOut.addEventListener("click", () => {
      // Limpia los datos de sesión activa
      localStorage.removeItem("Usuario");
      localStorage.removeItem("startValue");
      localStorage.removeItem("EquipoPrin");

      // Si prefieres mantener la casilla "Recuérdame" entre cierres de sesión,
      // no eliminamos localStorage.getItem("remember").

      window.location.href = "index.html";
    });
  }
});
