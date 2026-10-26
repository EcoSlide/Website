import { supabase } from "../services/supabase-client.js";

const form = document.querySelector("#login-form");
const message = document.querySelector("#message");
const loginButton = document.querySelector("#login-button");
const logoutButton = document.querySelector("#logout-button");

function showSession(session) {
  const connected = Boolean(session);

  form.hidden = connected;
  logoutButton.hidden = !connected;

  message.textContent = connected
    ? "Sesión iniciada correctamente. Falta conectar el panel."
    : "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  message.textContent = "Iniciando sesión…";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: document.querySelector("#email").value.trim(),
      password: document.querySelector("#password").value
    });

    if (error) throw error;

    form.reset();
    showSession(data.session);
  } catch {
    message.textContent =
      "No se pudo iniciar sesión. Revisa tus datos y la conexión.";
  } finally {
    document.querySelector("#password").value = "";
    loginButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    showSession(null);
    message.textContent = "Sesión cerrada.";
  } catch {
    message.textContent = "No se pudo cerrar sesión. Intenta de nuevo.";
  } finally {
    logoutButton.disabled = false;
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  showSession(session);
});