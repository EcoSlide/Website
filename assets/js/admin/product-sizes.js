import { supabase } from "../services/supabase-client.js";

export async function createSizeManager(product) {
  const container = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "Tallas";
  container.append(legend);

  const list = document.createElement("div");

  const system = document.createElement("select");
  system.setAttribute("aria-label", "Sistema de tallas");

  for (const value of ["US", "EU"]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    system.append(option);
  }

  const size = document.createElement("input");
  size.type = "text";
  size.inputMode = "decimal";
  size.placeholder = "Ejemplo: 7 o 30";
  size.maxLength = 10;
  size.setAttribute("aria-label", "Talla");

  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "Agregar talla";

  const message = document.createElement("p");
  message.setAttribute("role", "status");

  container.append(list, system, size, add, message);

  async function loadSizes() {
    const { data, error } = await supabase
      .from("product_sizes")
      .select("id, size_label, size_system, is_available")
      .eq("product_id", product.id);

    if (error) throw error;

    data.sort((a, b) =>
      a.size_system.localeCompare(b.size_system) ||
      Number(a.size_label) - Number(b.size_label) ||
      a.size_label.localeCompare(b.size_label)
    );

    list.replaceChildren();

    if (!data.length) {
      list.textContent = "Sin tallas registradas.";
      return;
    }

    for (const item of data) {
      const row = document.createElement("p");
      const label = document.createElement("span");

      label.textContent =
        `${item.size_system} ${item.size_label} · ` +
        (item.is_available ? "Disponible " : "No disponible ");

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.textContent = item.is_available
        ? "Marcar no disponible"
        : "Marcar disponible";

      toggle.addEventListener("click", async () => {
        toggle.disabled = true;
        message.textContent = "Guardando…";

        try {
          const { error } = await supabase
            .from("product_sizes")
            .update({ is_available: !item.is_available })
            .eq("id", item.id)
            .eq("product_id", product.id)
            .select("id")
            .single();

          if (error) throw error;

          message.textContent =
            "Disponibilidad guardada. Actualizando lista…";

          await loadSizes();
          message.textContent = "Lista actualizada.";
        } catch (error) {
          console.error(error);
          message.textContent =
            "No se pudo completar la operación. Actualiza la lista para comprobar el estado.";
        } finally {
          toggle.disabled = false;
        }
      });

      row.append(label, toggle);
      list.append(row);
    }
  }

  add.addEventListener("click", async () => {
    const raw = size.value.trim().replace(",", ".");
    const number = Number(raw);

    if (
      !/^\d+(\.\d+)?$/.test(raw) ||
      !Number.isFinite(number) ||
      number <= 0 ||
      number > 100
    ) {
      message.textContent = "Escribe una talla válida.";
      return;
    }

    const label = String(number);

    add.disabled = true;
    size.disabled = true;
    system.disabled = true;
    message.textContent = "Guardando talla…";

    try {
      const { error } = await supabase
        .from("product_sizes")
        .insert({
          product_id: product.id,
          size_label: label,
          size_system: system.value,
          is_available: true,
          sort_order: Math.round(number * 100)
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          message.textContent =
            "Esa talla ya está registrada para este producto.";
          return;
        }

        throw error;
      }

      size.value = "";
      message.textContent = "Talla guardada. Actualizando lista…";

      await loadSizes();
      message.textContent = "Lista actualizada.";
    } catch (error) {
      console.error(error);
      message.textContent =
        "No se pudo completar la operación. Actualiza la lista antes de reintentar.";
    } finally {
      add.disabled = false;
      size.disabled = false;
      system.disabled = false;
    }
  });

  try {
    await loadSizes();
  } catch (error) {
    console.error(error);
    message.textContent =
      "No se pudieron cargar las tallas. Pulsa Actualizar lista.";
  }

  return container;
}