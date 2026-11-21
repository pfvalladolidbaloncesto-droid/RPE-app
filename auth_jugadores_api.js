/* API de autenticación de la PWA de jugadores.
 * Se reutiliza el proyecto de Apps Script de Coach RVB,
 * pero con tokens exclusivos de jugador (prefijo RVBJ_).
 * Ninguna contraseña se envía mediante una URL GET.
 */
(function (global) {
  "use strict";
  const URL_API_JUGADORES = "https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec";
  let contador = 0;

  function leer(accion, parametros = {}) {
    return new Promise((resolve, reject) => {
      const callback = `rvbAlta_${Date.now()}${++contador}`;
      const script = document.createElement("script");
      const destino = new URL(URL_API_JUGADORES);
      let concluido = false;
      const reloj = setTimeout(() => terminar(new Error("Tiempo de espera agotado.")), 20000);

      function terminar(error, datos) {
        if (concluido) return;
        concluido = true;
        clearTimeout(reloj);
        script.remove();
        delete global[callback];
        if (error) reject(error);
        else resolve(datos);
      }

      global[callback] = datos => terminar(null, datos);
      script.onerror = () => terminar(new Error("No se pudo conectar con el servidor."));
      script.onload = () => {
        // Algunos navegadores ejecutan onload después del callback.
        if (!concluido) terminar(new Error("El servidor no devolvió una respuesta válida."));
      };
      destino.searchParams.set("accion", accion);
      Object.entries(parametros).forEach(([clave, valor]) => {
        destino.searchParams.set(clave, String(valor));
      });
      destino.searchParams.set("callback", callback);
      destino.searchParams.set("_", String(Date.now()));
      script.crossOrigin = "anonymous";
      script.src = destino.toString();
      document.head.appendChild(script);
    });
  }

  async function enviar(accion, parametros = {}) {
    // El POST evita exponer la contraseña en historial, URL y logs de GET.
    await fetch(URL_API_JUGADORES, {
      method: "POST", mode: "no-cors", credentials: "omit", cache: "no-store",
      body: new URLSearchParams({ accion, ...parametros })
    });
  }

  async function solicitarConEstado(accion, estadoAccion, parametros, token = "") {
    const solicitudId = crypto.randomUUID();
    await enviar(accion, { ...parametros, solicitudId });
    for (let i = 0; i < 15; i++) {
      const respuesta = await leer(estadoAccion, {
        solicitudId, ...(token ? { token } : {})
      });
      if (!respuesta || respuesta.ok !== true) {
        throw new Error(respuesta?.error || "Error comprobando la solicitud.");
      }
      if (respuesta.estado === "error") {
        throw new Error(respuesta.error || "Operación rechazada por el servidor.");
      }
      if (respuesta.estado === "ok") return respuesta;
      await new Promise(r => setTimeout(r, 600));
    }
    throw new Error("No se ha podido confirmar la operación. Comprueba el resultado antes de repetir.");
  }

  function sesion() {
    try { return JSON.parse(sessionStorage.getItem("rvb_jugador_sesion") || "null"); }
    catch (_) { return null; }
  }

  function salir() {
    const actual = sesion();
    sessionStorage.removeItem("rvb_jugador_sesion");
    sessionStorage.removeItem("rvb_sesion_activa");
    localStorage.removeItem("EquipoPrin");
    localStorage.removeItem("PassRecordada"); // Eliminar legado inseguro.
    if (localStorage.getItem("remember") !== "true") {
      localStorage.removeItem("Usuario");
    }
    if (actual?.token) {
      const cuerpo = new URLSearchParams({ accion: "cerrarSesionJugador", token: actual.token });
      try {
        if (navigator.sendBeacon) navigator.sendBeacon(URL_API_JUGADORES, cuerpo);
        else void enviar("cerrarSesionJugador", { token: actual.token });
      } catch (_) { /* Cierre local inmediato; el token expira en el servidor. */ }
    }
    global.location.replace("index.html");
  }

  global.RVBJugadorAPI = { URL: URL_API_JUGADORES, leer, enviar, solicitarConEstado, sesion, salir };
})(window);
