/* Login RVB Jugadores: token temporal validado por el servidor.
 * El gestor de contraseñas del navegador puede recordar la clave.
 * Nunca se almacena la clave como texto en localStorage.
 */
document.addEventListener("DOMContentLoaded", () => {
  const api = window.RVBJugadorAPI;
  const form = document.getElementById("loginForm");
  const usuario = document.getElementById("username");
  const password = document.getElementById("password");
  const recuerda = document.getElementById("rememberMe");
  const boton = document.getElementById("btnEnter");

  // Retirar contraseñas almacenadas por versiones antiguas de RVB.
  localStorage.removeItem("PassRecordada");
  sessionStorage.removeItem("rvb_sesion_activa");
  const recordado = localStorage.getItem("remember") === "true";
  recuerda.checked = recordado;
  if (recordado) usuario.value = localStorage.getItem("Usuario") || "";

  async function recuperarPassword() {
    if (!recuerda.checked || !navigator.credentials?.get) return;
    try {
      const c = await navigator.credentials.get({ password: true, mediation: "silent" });
      if (!c || c.type !== "password" || typeof c.password !== "string") return;
      if (usuario.value && usuario.value.trim().toUpperCase() !== c.id.toUpperCase()) return;
      if (password.value || document.activeElement === password) return;
      usuario.value = c.id;
      password.value = c.password;
    } catch (_) { /* Chrome puede requerir selección manual de credencial. */ }
  }
  void recuperarPassword();

  async function guardarPassword(identidad, clave) {
    if (!recuerda.checked || !navigator.credentials?.store ||
        typeof PasswordCredential !== "function") return;
    try {
      await navigator.credentials.store(new PasswordCredential({
        id: identidad, password: clave, name: identidad
      }));
    } catch (_) { /* Autocompletado HTML como alternativa. */ }
  }

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    const nombre = usuario.value.trim().toUpperCase();
    const clave = password.value; // No modificar contraseñas con espacios arbitrariamente.
    if (!nombre || !clave) { alert("Introduce usuario y contraseña."); return; }
    boton.disabled = true;
    boton.textContent = "Conectando...";
    try {
      const r = await api.solicitarConEstado(
        "iniciarSesionJugador", "estadoLoginJugador", { usuario: nombre, password: clave }
      );
      if (!/^RVBJ_[0-9a-f]{64}$/.test(r.token) || Number(r.exp) <= Date.now()) {
        throw new Error("El servidor no ha generado una sesión válida.");
      }
      sessionStorage.setItem("rvb_jugador_sesion", JSON.stringify({
        token: r.token, usuario: r.usuario, equipo: r.equipo || "", exp: Number(r.exp)
      }));
      localStorage.setItem("Usuario", r.usuario);
      localStorage.setItem("EquipoPrin", r.equipo || "");
      if (recuerda.checked) {
        localStorage.setItem("remember", "true");
        await guardarPassword(r.usuario, clave);
      } else {
        localStorage.removeItem("remember");
        if (navigator.credentials?.preventSilentAccess) {
          try { await navigator.credentials.preventSilentAccess(); } catch (_) {}
        }
      }
      password.value = "";
      // Conservar RPE como pantalla inicial, tal como estaba.
      window.location.replace("RPE.html");
    } catch (error) {
      console.error("Login jugadores:", error);
      alert(error.message || "No se ha podido iniciar sesión.");
    } finally {
      boton.disabled = false;
      boton.textContent = "Enter";
    }
  });
});
