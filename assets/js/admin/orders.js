import { supabase } from "../services/supabase-client.js";

const panel = document.querySelector("#panel");
const status = document.querySelector("#status");
const list = document.querySelector("#orders");
const refresh = document.querySelector("#refresh");

const money = value => new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD"
}).format(value);

const paymentLabels = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  partially_refunded: "Reembolso parcial",
  refunded: "Reembolsado"
};

const orderLabels = {
  received: "Recibido",
  confirmed: "Confirmado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado"
};

function addLine(container, label, value) {
  const line = document.createElement("p");
  const heading = document.createElement("strong");

  heading.textContent = `${label}: `;
  line.append(heading, document.createTextNode(String(value ?? "—")));
  container.append(line);
}

async function loadOrders() {
  refresh.disabled = true;
  status.textContent = "Cargando pedidos…";

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, created_at,
        customer_name, customer_email, customer_phone,
        delivery_region, delivery_city,
        delivery_address, delivery_notes,
        subtotal, shipping_amount, total_amount,
        payment_method, payment_status, order_status,
        order_items (
          id, model_code, product_name_es,
          size_label, size_system,
          quantity, unit_price, line_total
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    list.replaceChildren();

    for (const order of data) {
        const card = document.createElement("article");
        card.style.border = "1px solid #ccc";
        card.style.borderRadius = "12px";
        card.style.padding = "20px";
        card.style.margin = "20px 0";

        const title = document.createElement("h2");
        title.textContent = `Pedido #${order.order_number}`;
        card.append(title);

        addLine(card, "Fecha", new Intl.DateTimeFormat("es-PA", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "America/Panama"
        }).format(new Date(order.created_at)));

        addLine(card, "Cliente", order.customer_name);
        addLine(card, "Correo", order.customer_email);
        addLine(card, "Teléfono", order.customer_phone);
        addLine(card, "Provincia o región", order.delivery_region);
        addLine(card, "Distrito o ciudad", order.delivery_city);
        addLine(card, "Dirección", order.delivery_address);

        if (order.delivery_notes) {
            addLine(card, "Indicaciones", order.delivery_notes);
        }

        const itemsTitle = document.createElement("h3");
        itemsTitle.textContent = "Productos";
        card.append(itemsTitle);

        for (const item of order.order_items || []) {
            addLine(
            card,
            `${item.product_name_es} (${item.model_code})`,
            `${item.size_system} ${item.size_label} · ` +
            `${item.quantity} × ${money(item.unit_price)} = ` +
            money(item.line_total)
            );
        }

        addLine(card, "Subtotal", money(order.subtotal));

        addLine(
            card,
            "Envío",
            order.shipping_amount === null
            ? "Por cotizar"
            : money(order.shipping_amount)
        );

        addLine(
            card,
            "Total",
            order.total_amount === null
            ? "Pendiente de cotizar envío"
            : money(order.total_amount)
        );

        addLine(
            card,
            "Método de pago",
            order.payment_method || "Sin seleccionar"
        );

        addLine(
            card,
            "Pago",
            paymentLabels[order.payment_status] || order.payment_status
        );

        addLine(
            card,
            "Estado del pedido",
            orderLabels[order.order_status] || order.order_status
        );

        const canQuoteShipping =
        order.payment_status === "pending" &&
        ["received", "confirmed"].includes(order.order_status);

        if (canQuoteShipping) {
        const shippingForm = document.createElement("form");
        shippingForm.style.margin = "20px 0";

        const shippingLabel = document.createElement("label");
        shippingLabel.textContent = "Costo del envío (USD): ";

        const shippingInput = document.createElement("input");
        shippingInput.type = "number";
        shippingInput.min = "0";
        shippingInput.max = "9999.99";
        shippingInput.step = "0.01";
        shippingInput.required = true;
        shippingInput.inputMode = "decimal";
        shippingInput.placeholder = "Ej.: 5.00";
        shippingInput.style.width = "120px";

        shippingInput.value = order.shipping_amount === null
            ? ""
            : Number(order.shipping_amount).toFixed(2);

        shippingLabel.append(shippingInput);

        const shippingHelp = document.createElement("p");
        shippingHelp.textContent =
            "Usa 0 para envío gratis. Un campo vacío significa que falta cotizar.";

        const saveShipping = document.createElement("button");
        saveShipping.type = "submit";
        saveShipping.textContent = order.shipping_amount === null
            ? "Guardar cotización"
            : "Actualizar cotización";

        const shippingFeedback = document.createElement("p");
        shippingFeedback.setAttribute("role", "status");
        shippingFeedback.setAttribute("aria-live", "polite");

        shippingForm.addEventListener("submit", async event => {
            event.preventDefault();

            if (saveShipping.disabled) return;

            const value = shippingInput.value.trim();
            const amount = Number(value);

            if (
            !value ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            amount > 9999.99 ||
            Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
            ) {
            shippingFeedback.textContent =
                "Ingresa un importe entre 0 y 9999.99, con máximo dos decimales.";
            return;
            }

            const expectedShipping = order.shipping_amount === null
            ? null
            : Number(order.shipping_amount);

            if (expectedShipping === amount) {
            shippingFeedback.textContent =
                "Ese importe ya está guardado.";
            return;
            }

            saveShipping.disabled = true;
            shippingInput.disabled = true;
            shippingFeedback.textContent = "Guardando cotización…";

            try {
            const { data, error } = await supabase.rpc(
                "quote_store_order_shipping",
                {
                p_order_id: order.id,
                p_expected_shipping: expectedShipping,
                p_shipping_amount: amount
                }
            );

            if (error) {
                shippingFeedback.textContent = error.code === "P0001"
                ? error.message
                : "No se pudo confirmar el cambio. Actualiza los pedidos antes de reintentar.";
                return;
            }

            if (data === null || Number(data) !== amount) {
                shippingFeedback.textContent =
                "No se pudo confirmar el importe. Actualiza los pedidos.";
                return;
            }

            await loadOrders();
            } catch {
            shippingFeedback.textContent =
                "No se pudo confirmar la respuesta. Actualiza los pedidos antes de reintentar.";
            } finally {
            saveShipping.disabled = false;
            shippingInput.disabled = false;
            }
        });

        shippingForm.append(
            shippingLabel,
            shippingHelp,
            saveShipping,
            shippingFeedback
        );

        card.append(shippingForm);
        }

      const transitions = {
        received: ["confirmed", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["shipped", "cancelled"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: []
    };

    const nextStates = transitions[order.order_status] || [];

    if (nextStates.length) {
        const label = document.createElement("label");
        label.textContent = "Cambiar estado: ";

        const select = document.createElement("select");

        for (const state of nextStates) {
            const option = document.createElement("option");
            option.value = state;
            option.textContent = orderLabels[state];
            select.append(option);
        }

        label.append(select);

        const updateButton = document.createElement("button");
        updateButton.type = "button";
        updateButton.textContent = "Guardar estado";

        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");

        updateButton.addEventListener("click", async () => {
            const newStatus = select.value;

            if (!window.confirm(
            `¿Cambiar el pedido #${order.order_number} a "${orderLabels[newStatus]}"?`
            )) return;

            updateButton.disabled = true;
            select.disabled = true;
            feedback.textContent = "Guardando…";

            try {
            const { data, error } = await supabase.rpc(
                "update_store_order_status",
                {
                p_order_id: order.id,
                p_expected_status: order.order_status,
                p_new_status: newStatus
                }
            );

            if (error || data !== newStatus) {
                feedback.textContent =
                "No se pudo confirmar el cambio. Pulsa Actualizar pedidos para comprobar el estado.";
                return;
            }

            await loadOrders();
            } catch {
            feedback.textContent =
                "No se pudo confirmar la respuesta. Actualiza los pedidos antes de reintentar.";
            } finally {
            updateButton.disabled = false;
            select.disabled = false;
            }
        });

        card.append(label, updateButton, feedback);
    }

    if (
    order.shipping_amount !== null &&
    order.total_amount !== null &&
    order.payment_status === "pending" &&
    ["received", "confirmed"].includes(order.order_status)
    ) {
    const quoteButton = document.createElement("button");
    quoteButton.type = "button";
    quoteButton.textContent = "Enviar cotización al cliente";

    const quoteFeedback = document.createElement("p");
    quoteFeedback.setAttribute("role", "status");
    quoteFeedback.setAttribute("aria-live", "polite");

    quoteButton.addEventListener("click", async () => {
        if (quoteButton.disabled) return;

        const confirmed = window.confirm(
        `Enviar la cotización del pedido #${order.order_number}` +
        ` a ${order.customer_email}.\n\n` +
        `Subtotal: ${money(order.subtotal)}\n` +
        `Envío: ${money(order.shipping_amount)}\n` +
        `Total: ${money(order.total_amount)}\n\n` +
        "Esto enviará un correo real, sin realizar ningún cobro."
        );

        if (!confirmed) return;

        quoteButton.disabled = true;
        quoteFeedback.textContent = "Enviando cotización…";

        let accepted = false;

        try {
        const { data, error } = await supabase.functions.invoke(
            "send-order-quote",
            {
            body: {
                orderId: order.id,
                expectedEmail: order.customer_email,
                expectedSubtotal: Number(order.subtotal),
                expectedShipping: Number(order.shipping_amount)
            }
            }
        );

        if (error) {
            let detail = "";

            try {
            const response = await error.context?.json();
            detail = response?.error || "";
            } catch {
            // Usar el mensaje general si no hay respuesta JSON.
            }

            throw new Error(
            detail ||
            "No se pudo confirmar el envío. Actualiza los pedidos antes de reintentar."
            );
        }

        if (data?.accepted !== true) {
            throw new Error("No se pudo confirmar el envío.");
        }

        accepted = true;

        quoteFeedback.textContent = data.already_sent
            ? "Esta misma cotización ya fue aceptada por Resend; no se volvió a enviar."
            : data.tracking_saved
            ? "Resend aceptó la cotización para enviarla al cliente."
            : "Resend aceptó la cotización, pero falló su registro. Revisa Resend antes de volver a enviarla.";

        quoteButton.textContent = "Cotización aceptada por Resend";
        } catch (error) {
        quoteFeedback.textContent = error.message;
        } finally {
        quoteButton.disabled = accepted;
        }
    });

    card.append(quoteButton, quoteFeedback);
    }

    const retryEmail = document.createElement("button");
        retryEmail.type = "button";
        retryEmail.textContent = "Reintentar aviso por correo";

        const emailFeedback = document.createElement("p");
        emailFeedback.setAttribute("role", "status");

        retryEmail.addEventListener("click", async () => {
        retryEmail.disabled = true;
        emailFeedback.textContent = "Comprobando y enviando aviso…";

        try {
            const { data, error } = await supabase.functions.invoke(
            "create-order",
            {
                body: {
                action: "retry-notification",
                orderNumber: String(order.order_number)
                }
            }
            );

            if (error) throw error;

            emailFeedback.textContent = data?.notification_accepted
            ? "Resend aceptó el aviso. Revisa tu correo y spam."
            : "El pedido sigue guardado, pero el aviso no fue confirmado. Revisa los Logs de create-order.";
        } catch {
            emailFeedback.textContent =
            "No se pudo confirmar la respuesta. Puedes reintentar desde este botón.";
        } finally {
            retryEmail.disabled = false;
        }
        });

        card.append(retryEmail, emailFeedback);

      list.append(card);
    }

    status.textContent = data.length
      ? `${data.length} pedido(s) cargado(s).`
      : "Todavía no hay pedidos.";
  } catch (error) {
    console.error("Error al consultar pedidos:", error.code);
    list.replaceChildren();
    status.textContent = "No se pudieron cargar los pedidos.";
  } finally {
    refresh.disabled = false;
  }
}

refresh.addEventListener("click", loadOrders);

document.querySelector("#logout").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    status.textContent = "No se pudo cerrar sesión.";
    return;
  }

  location.replace("./login.html");
});

supabase.auth.onAuthStateChange(event => {
  if (event === "SIGNED_OUT") {
    panel.hidden = true;
    list.replaceChildren();
    location.replace("./login.html");
  }
});

async function start() {
  try {
    const { data: { user }, error: userError } =
      await supabase.auth.getUser();

    if (userError || !user) {
      location.replace("./login.html");
      return;
    }

    const { data: isAdmin, error } =
      await supabase.rpc("is_store_admin");

    if (error) {
      status.textContent = "No se pudo verificar el acceso. Recarga.";
      return;
    }

    if (isAdmin !== true) {
      status.textContent = "Esta cuenta no tiene acceso a los pedidos.";
      return;
    }

    panel.hidden = false;
    await loadOrders();
  } catch {
    status.textContent = "No se pudo abrir el panel.";
  }
}

start();