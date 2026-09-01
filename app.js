// URL de tu Google Apps Script recuperada de los bloques
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");
  const loginForm = document.getElementById("loginForm");

  // Replicando la lógica de TinyDB al iniciar pantalla (Initialize)
  const storedCheck = JSON.parse(localStorage.getItem("check"));
  if (storedCheck && storedCheck.Usuario) {
    usernameInput.value = storedCheck.Usuario || "";
    passwordInput.value = storedCheck.Contraseña || "";
    rememberMeCheckbox.checked = true;
  } else {
    rememberMeCheckbox.checked = false;
  }

  // Evento al hacer clic en el botón de Enter (Form Submit)
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Replicando guardado en TinyDB según el checkbox Recuérdame
    if (rememberMeCheckbox.checked) {
      localStorage.setItem("check", JSON.stringify({
        Usuario: username,
        Contraseña: password
      }));
    } else {
      localStorage.setItem("check", JSON.stringify({
        Usuario: "",
        Contraseña: ""
      }));
    }

    localStorage.setItem("Usuario", username);

    try {
      // 1. Petición al endpoint Web/Spreadsheet
      const response = await fetch(`${APPS_SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(username)}`);
      const data = await response.json();

      // Validación del formato de respuesta
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const passValida = item.columna2 === password;
        const tipoLogin = item.columna3; // Tercera columna según lógica del evento GotFilterResult

        localStorage.setItem("Login", tipoLogin || "");

        // Redirección con StartValue (guardado en localStorage para leerlo en la pantalla destino)
        localStorage.setItem("startValue", username);

        if (passValida && tipoLogin === "PF") {
          window.location.href = "Menu_prepas.html";
        } else if (passValida && tipoLogin !== "PF") {
          window.location.href = "RPE.html";
        } else {
          alert("Verifica tus credenciales");
        }
      } else {
        alert("Verifica tus credenciales");
      }
    } catch (error) {
      console.error("Error al validar:", error);
      alert("Error de conexión o credenciales no válidas.");
    }
  });
});