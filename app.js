const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");

  // Cargar usuario recordado si existe
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
      // Petición al servidor evitando la caché del navegador
      const response = await fetch(`${APPS_SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(userInput)}`, {
        cache: "no-store"
      });
      
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await response.json();
      let loginExitoso = false;

      if (Array.isArray(data) && data.length > 0) {
        for (const fila of data) {
          // Convertimos ambas columnas a String
          const usuarioBD = String(fila.columna1 ?? fila.num ?? "").trim();
          const passBD = String(fila.columna2 ?? "").trim();

          // Comprobamos que la contraseña en la BD no esté vacía
          if (passBD !== "") {
            const usuarioCoincide = usuarioBD.toLowerCase() === userInput.toLowerCase() || 
                                    userInput.toLowerCase() === String(fila.num ?? "").toLowerCase();
            const passwordCoincide = passBD === passInput;

            if (usuarioCoincide && passwordCoincide) {
              loginExitoso = true;
              break;
            }
          }
        }
      }

      if (loginExitoso) {
        localStorage.setItem("Usuario", userInput);
        localStorage.setItem("startValue", userInput);

        if (rememberMeCheckbox.checked) {
          localStorage.setItem("remember", "true");
        } else {
          localStorage.removeItem("remember");
        }

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
