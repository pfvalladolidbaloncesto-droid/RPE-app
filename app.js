const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");
  const btnEnter = document.getElementById("btnEnter");

  // 1. Cargar usuario si 'remember' está activo
  const usuarioRecordado = localStorage.getItem("Usuario") || localStorage.getItem("startValue") || "";
  const estaRecordado = localStorage.getItem("remember") === "true";

  if (estaRecordado && usuarioRecordado) {
    usernameInput.value = usuarioRecordado;
    rememberMeCheckbox.checked = true;
  } else {
    usernameInput.value = "";
    rememberMeCheckbox.checked = false;
  }
  
  passwordInput.value = ""; // La contraseña siempre se pide por seguridad

  // 2. Evento de envío del formulario
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userInput = usernameInput.value.trim();
    const passInput = passwordInput.value.trim();

    if (!userInput || !passInput) {
      alert("Por favor, rellena todos los campos.");
      return;
    }

    if (btnEnter) btnEnter.disabled = true;

    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(userInput)}`, {
        cache: "no-store"
      });
      
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await response.json();
      let loginExitoso = false;

      if (Array.isArray(data) && data.length > 0) {
        const registro = data[0];
        const passBD = String(registro.columna2 ?? "").trim();

        if (passBD === passInput) {
          loginExitoso = true;
        }
      }

      if (loginExitoso) {
        const registro = data[0];
        
        localStorage.setItem("Usuario", userInput);
        localStorage.setItem("startValue", userInput);
        localStorage.setItem("EquipoPrin", registro.columna4 || registro.columna3 || "");

        // Guardar o borrar preferencia de recordar
        if (rememberMeCheckbox.checked) {
          localStorage.setItem("remember", "true");
        } else {
          localStorage.removeItem("remember");
        }

        window.location.href = "RPE.html";
      } else {
        alert("Verifica tus credenciales");
        if (btnEnter) btnEnter.disabled = false;
      }

    } catch (error) {
      console.error("Error en la autenticación:", error);
      alert("Error de conexión al verificar credenciales.");
      if (btnEnter) btnEnter.disabled = false;
    }
  });
});
