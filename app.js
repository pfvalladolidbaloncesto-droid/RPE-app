const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");

  // Recargar el usuario recordado si existe
  const usuarioRecordado = localStorage.getItem("Usuario") || localStorage.getItem("startValue") || "";
  const estaRecordado = localStorage.getItem("remember") === "true";

  if (estaRecordado && usuarioRecordado) {
    usernameInput.value = usuarioRecordado;
    rememberMeCheckbox.checked = true;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userInput = usernameInput.value.trim();
    const passInput = passwordInput.value.trim();

    if (!userInput || !passInput) {
      alert("Por favor, rellena todos los campos.");
      return;
    }

    try {
      // Petición a Apps Script enviando la acción de consulta
      const response = await fetch(`${APPS_SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(userInput)}`);
      
      if (!response.ok) {
        throw new Error("Error en la respuesta de la red");
      }

      const data = await response.json();
      let loginExitoso = false;

      // Verificación adaptada tanto a objetos JSON como a arrays devueltos por Apps Script
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(fila => {
          // Extraemos los valores soportando diferentes formatos de clave (columna1, Columna1, o array por índice)
          const usuarioBD = String(fila.columna1 || fila.Columna1 || fila[0] || "").trim();
          const passBD = String(fila.columna2 || fila.Columna2 || fila[1] || "").trim();

          if (usuarioBD.toLowerCase() === userInput.toLowerCase() && passBD === passInput) {
            loginExitoso = true;
          }
        });
      } else if (typeof data === "object" && data !== null) {
        const usuarioBD = String(data.columna1 || data.Columna1 || "").trim();
        const passBD = String(data.columna2 || data.Columna2 || "").trim();

        if (usuarioBD.toLowerCase() === userInput.toLowerCase() && passBD === passInput) {
          loginExitoso = true;
        }
      }

      if (loginExitoso) {
        // Guardar variables de sesión globales idénticas a la APK
        localStorage.setItem("Usuario", userInput);
        localStorage.setItem("startValue", userInput);

        if (rememberMeCheckbox.checked) {
          localStorage.setItem("remember", "true");
        } else {
          localStorage.removeItem("remember");
        }

        // Redirigir a la pantalla de registro RPE
        window.location.href = "RPE.html";
      } else {
        alert("Verifica tus credenciales");
      }

    } catch (error) {
      console.error("Error en la autenticación:", error);
      alert("Error de conexión al verificar credenciales.");
    }
  });
});
