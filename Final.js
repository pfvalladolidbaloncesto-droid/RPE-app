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

      // Si NO eligió recordar, limpiamos todo. Si eligió recordar, mantenemos "Usuario" y "remember"
      if (!estaRecordado) {
        localStorage.removeItem("Usuario");
        localStorage.removeItem("startValue");
      }
      
      localStorage.removeItem("EquipoPrin"); // Borramos datos del equipo de la sesión activa

      window.location.replace("index.html");
    });
  }
});
