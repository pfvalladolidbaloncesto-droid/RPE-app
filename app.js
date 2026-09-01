const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberMeCheckbox = document.getElementById("rememberMe");
  const btnEnter = document.getElementById("btnEnter");

  // 1. Cargar Usuario Y Contraseña al iniciar si está marcado recuérdame
  const estaRecordado = localStorage.getItem("remember") === "true";
  if (estaRecordado) {
    usernameInput.value = localStorage.getItem("Usuario") || "";
    passwordInput.value = localStorage.getItem("PassRecordada") || "";
    rememberMeCheckbox.checked = true;
  }

  // 2. Evento Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userInput = usernameInput.value.trim();
    const passInput = passwordInput.value.trim();

    if (!userInput || !passInput) {
      alert("Por favor, rellena todos los campos.");
      return;
    }

    if (btnEnter) btnEnter.disabled = true;

    // 3. Guardar INMEDIATAMENTE la preferencia de Recuérdame local
    if (rememberMeCheckbox.checked) {
      localStorage.setItem("remember", "true");
      localStorage.setItem("Usuario", userInput);
      localStorage.setItem("PassRecordada", passInput);
    } else {
      localStorage.removeItem("remember");
      localStorage.removeItem("Usuario");
      localStorage.removeItem("PassRecordada");
    }

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
        
        // Guardar sesión activa del equipo
        localStorage.setItem("Usuario", userInput);
        localStorage.setItem("EquipoPrin", registro.columna4 || registro.columna3 || "");

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
