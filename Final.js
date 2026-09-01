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
      // Limpiar datos de la sesión activa
      localStorage.removeItem("Usuario");
      localStorage.removeItem("startValue");
      localStorage.removeItem("EquipoPrin");

      // Redirección limpia
      window.location.replace("index.html");
    });
  }
});
