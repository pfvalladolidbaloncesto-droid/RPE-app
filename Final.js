
document.addEventListener("DOMContentLoaded", () => {

  const btnOtraRespuesta =
    document.getElementById("btnOtraRespuesta");

  const btnLogOut =
    document.getElementById("btnLogOut");

  const btnMenu =
    document.getElementById("btnMenu");

  // VOLVER AL MENÚ
  if (btnMenu) {
    btnMenu.addEventListener("click", () => {
      window.location.href = "menu_opciones.html";
    });
  }

  // REGISTRAR OTRO RPE
  if (btnOtraRespuesta) {
    btnOtraRespuesta.addEventListener("click", () => {
      window.location.href = "RPE.html";
    });
  }

  // CERRAR SESIÓN
  if (btnLogOut) {
    btnLogOut.addEventListener("click", () => {

      const estaRecordado =
        localStorage.getItem("remember") === "true";

      if (!estaRecordado) {
        localStorage.removeItem("Usuario");
        localStorage.removeItem("PassRecordada");
      }

      localStorage.removeItem("EquipoPrin");
      sessionStorage.removeItem("rvb_sesion_activa");

      window.location.replace("index.html");
    });
  }

});
