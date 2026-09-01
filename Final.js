document.addEventListener("DOMContentLoaded", () => {
  const btnOtraRespuesta = document.getElementById("btnOtraRespuesta");
  const btnLogOut = document.getElementById("btnLogOut");

  if (btnOtraRespuesta) {
    btnOtraRespuesta.addEventListener("click", () => {
      window.location.href = "RPE.html";
    });
  }
if (btnLogOut) {
    btnLogOut.addEventListener("click", () => {
      const estaRecordado = localStorage.getItem("remember") === "true";

      // Si NO eligió recordar, borramos las credenciales guardadas
      if (!estaRecordado) {
        localStorage.removeItem("Usuario");
        localStorage.removeItem("PassRecordada");
      }
      
      localStorage.removeItem("EquipoPrin"); // Limpia la sesión actual del equipo

      window.location.replace("index.html");
    });
  }

});
