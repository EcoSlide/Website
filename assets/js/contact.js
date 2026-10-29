import { getLanguage } from './language.js';

const form = document.querySelector('#contactForm');
const submit = document.querySelector('#contact-submit');
const label = document.querySelector('#contact-submit-label');
const status = document.querySelector('#contact-status');
let busy = false;
let attempt = null;
const copy = {
  sending: ['Enviando…', 'Sending…'],
  sent: ['Tu mensaje fue enviado. Te responderemos por correo. ¡Gracias por escribirnos!', 'Your message has been sent. We’ll reply by email. Thank you for reaching out!'],
  error: ['No pudimos confirmar el envío. Tus datos siguen en el formulario; puedes intentar nuevamente.', 'We couldn’t confirm your message was sent. Your details are still in the form; please try again.'],
  limited: ['Has realizado varios intentos. Espera unos minutos antes de volver a enviar.', 'You have made several attempts. Please wait a few minutes before trying again.'],
  invalid: ['Revisa los campos: nombre, correo, asunto y mensaje (entre 10 y 5000 caracteres).', 'Check your name, email, subject, and message (10 to 5000 characters).']
};
function setCopy(el, pair) {
  [el.dataset.es, el.dataset.en] = pair;
  el.textContent = pair[getLanguage() === 'en' ? 1 : 0];
}
function show(key, state) {
  status.dataset.state = state;
  setCopy(status, copy[key]);
  if (state !== 'sending') status.focus();
}
function buttonState() {
  submit.disabled = busy;
  form.setAttribute('aria-busy', String(busy));
  setCopy(label, busy ? copy.sending : ['Enviar mensaje', 'Send message']);
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  const body = Object.fromEntries(['name', 'email', 'subject', 'message', 'website'].map(key => [key, String(values[key] || '').trim()]));
  if (body.name.length < 2 || body.subject.length < 2 || body.message.length < 10) {
    show('invalid', 'error'); return;
  }
  const fingerprint = JSON.stringify(body);
  // Reuse the same ID after an uncertain response, so a retry doesn't send two emails.
  if (!attempt || attempt.fingerprint !== fingerprint) attempt = { fingerprint, id: crypto.randomUUID() };
  busy = true; buttonState(); show('sending', 'sending');
  try {
    const { supabase } = await import('./services/supabase-client.js');
    const { data, error } = await supabase.functions.invoke('send-contact', {
      body: { ...body, requestId: attempt.id },
      signal: AbortSignal.timeout(25000)
    });
    if (error || data?.ok !== true) {
      let code = data?.code;
      try { code = (await error?.context?.clone().json())?.code || code; } catch { /* Keep generic error. */ }
      show(code === 'rate_limited' ? 'limited' : code === 'invalid_input' ? 'invalid' : 'error', 'error');
      return;
    }
    form.reset(); attempt = null; show('sent', 'success');
  } catch {
    show('error', 'error');
  } finally {
    busy = false; buttonState();
  }
});
document.querySelector('#sendWhatsApp')?.addEventListener('click', () => {
  const values = Object.fromEntries(new FormData(form));
  const es = getLanguage() !== 'en';
  const text = [es ? 'Hola, EcoSlidespty.' : 'Hello, EcoSlidespty.',
    values.name ? `${es ? 'Nombre' : 'Name'}: ${values.name}` : '',
    values.subject ? `${es ? 'Asunto' : 'Subject'}: ${values.subject}` : '',
    values.message || ''].filter(Boolean).join('\n');
  window.open(`https://wa.me/50769265047?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});
buttonState();
