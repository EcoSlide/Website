import { supabase } from "../services/supabase-client.js";
import { createSizeManager } from "./product-sizes.js";

const panel = document.querySelector("#panel");
const status = document.querySelector("#status");
const form = document.querySelector("#product-form");
const list = document.querySelector("#products");
const saveButton = document.querySelector("#save");
const cancelButton = document.querySelector("#cancel");

let editingId = null;
let saving = false;

const textFields = [
  "model_code", "slug", "name_es", "name_en",
  "description_es", "description_en", "category"
];

function resetForm() {
  editingId = null;
  form.reset();
  document.querySelector("#form-title").textContent = "Agregar producto";
  saveButton.textContent = "Guardar producto";
}

async function loadProducts() {
  status.textContent = "Cargando productos…";

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  list.replaceChildren();

  for (const product of data) {
    const article = document.createElement("article");
    const title = document.createElement("h3");
    const details = document.createElement("p");
    const edit = document.createElement("button");

    title.textContent = product.name_es;

    const price = new Intl.NumberFormat("es-PA", {
      style: "currency",
      currency: "USD"
    }).format(product.price);

    details.textContent = [
      product.model_code,
      price,
      product.is_published ? "Publicado" : "Borrador",
      product.is_available ? "Disponible" : "No disponible"
    ].join(" · ");

    edit.type = "button";
    edit.textContent = "Editar";

    edit.addEventListener("click", () => {
      if (saving) return;

      editingId = product.id;

      for (const field of textFields) {
        form.elements.namedItem(field).value = product[field] ?? "";
      }

      form.elements.namedItem("price").value = product.price;
      form.elements.namedItem("production_days").value =
        product.production_days ?? "";

      form.elements.namedItem("is_available").checked =
        product.is_available;

      form.elements.namedItem("is_published").checked =
        product.is_published;

      document.querySelector("#form-title").textContent =
        "Editar producto";

      saveButton.textContent = "Guardar cambios";
      form.scrollIntoView({ behavior: "smooth" });
    });

    const photoInput = document.createElement("input");
    photoInput.type = "file";
    photoInput.accept = "image/jpeg,image/png,image/webp";
    photoInput.setAttribute(
      "aria-label",
      `Seleccionar foto para ${product.name_es}`
    );

    const uploadButton = document.createElement("button");
    uploadButton.type = "button";
    uploadButton.textContent = "Subir foto";

    const photoStatus = document.createElement("p");
    photoStatus.setAttribute("role", "status");

    uploadButton.addEventListener("click", async () => {
      const file = photoInput.files[0];

      if (!file) {
        photoStatus.textContent = "Selecciona una imagen primero.";
        return;
      }

      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      };

      const extension = extensions[file.type];

      if (!extension || file.size === 0 || file.size > 5 * 1024 * 1024) {
        photoStatus.textContent =
          "Usa una imagen JPG, PNG o WebP de hasta 5 MB.";
        return;
      }

      uploadButton.disabled = true;
      photoInput.disabled = true;
      photoStatus.textContent = "Subiendo foto…";

      const imageId = crypto.randomUUID();
      const path = `${product.id}/${imageId}.${extension}`;

      let uploaded = false;

      try {
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        uploaded = true;

        const { error: recordError } = await supabase
          .from("product_images")
          .insert({
            id: imageId,
            product_id: product.id,
            storage_path: path,
            alt_es: product.name_es,
            alt_en: product.name_en
          });

        if (recordError) throw recordError;

        photoInput.value = "";
        photoStatus.textContent =
          "Foto subida y vinculada al producto correctamente.";
      } catch (error) {
        console.error("Error al guardar la foto:", error);

        photoStatus.textContent = uploaded
          ? "El archivo se subió, pero no se pudo confirmar su registro. No vuelvas a subirlo todavía; revisaremos el error."
          : "No se pudo confirmar la subida. Revisa la consola antes de reintentar.";
      } finally {
        uploadButton.disabled = false;
        photoInput.disabled = false;
      }
    });
    const gallery = document.createElement("div");

    const { data: photos, error: photosError } = await supabase
      .from("product_images")
      .select("id, storage_path, alt_es")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (photosError) {
      gallery.textContent = "No se pudieron cargar las fotos.";
    } else {
      for (const photo of photos) {
        const { data, error } = await supabase.storage
          .from("product-images")
          .createSignedUrl(photo.storage_path, 3600);

        if (error || !data?.signedUrl) {
          const warning = document.createElement("p");
          warning.textContent = "No se pudo cargar una de las fotos.";
          gallery.append(warning);
          continue;
        }

        const image = document.createElement("img");
        image.src = data.signedUrl;
        image.alt = photo.alt_es || product.name_es;
        image.loading = "lazy";

        image.style.width = "160px";
        image.style.height = "160px";
        image.style.objectFit = "contain";
        image.style.margin = "8px";
        image.style.borderRadius = "8px";
        image.style.border = "1px solid #ddd";

        image.addEventListener("error", () => {
          image.replaceWith(
            document.createTextNode(
              "No se pudo mostrar la foto. Actualiza la lista."
            )
          );
        });

        const photoCard = document.createElement("div");

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Eliminar foto";

        const deleteStatus = document.createElement("p");
        deleteStatus.setAttribute("role", "status");

        deleteButton.addEventListener("click", async () => {
          if (!window.confirm("¿Eliminar esta foto del producto?")) return;

          deleteButton.disabled = true;
          deleteStatus.textContent = "Eliminando…";

          try {
            // Primero quitar el archivo del almacenamiento.
            const { error: storageError } = await supabase.storage
              .from("product-images")
              .remove([photo.storage_path]);

            if (storageError) throw storageError;

            // Después quitar su referencia de la base de datos.
            const { data: deleted, error: databaseError } = await supabase
              .from("product_images")
              .delete()
              .eq("id", photo.id)
              .eq("product_id", product.id)
              .select("id")
              .single();

            if (databaseError || !deleted) {
              deleteStatus.textContent =
                "El archivo se eliminó, pero falta quitar su registro. Pulsa otra vez para reintentar.";
              return;
            }

            photoCard.remove();
            status.textContent = "Foto eliminada correctamente.";
          } catch (error) {
            console.error("Error al eliminar la foto:", error);
            deleteStatus.textContent =
              "No se pudo confirmar la eliminación. Puedes reintentar.";
          } finally {
            deleteButton.disabled = false;
          }
        });

        photoCard.append(image, deleteButton, deleteStatus);
        gallery.append(photoCard);
      }
    }
    const sizeManager = await createSizeManager(product);

    article.append(
      title,
      details,
      gallery,
      sizeManager,
      edit,
      photoInput,
      uploadButton,
      photoStatus
    );
    list.append(article);
  }

  status.textContent = data.length
    ? `${data.length} producto(s) guardado(s).`
    : "Todavía no hay productos.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;

  const values = new FormData(form);
  const product = {};

  for (const field of textFields) {
    product[field] = String(values.get(field) ?? "").trim();
  }

  const days = String(values.get("production_days") ?? "").trim();

  product.price = Number(values.get("price"));
  product.production_days = days ? Number(days) : null;
  product.is_available =
    form.elements.namedItem("is_available").checked;
  product.is_published =
    form.elements.namedItem("is_published").checked;

  if (
    !product.model_code ||
    !product.name_es ||
    !product.name_en ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(product.slug) ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    (days && (
      !Number.isInteger(product.production_days) ||
      product.production_days < 1
    ))
  ) {
    status.textContent = "Revisa los campos del producto.";
    return;
  }

  saving = true;
  saveButton.disabled = true;
  cancelButton.disabled = true;
  status.textContent = "Guardando…";

  try {
    const query = editingId
      ? supabase.from("products").update(product).eq("id", editingId)
      : supabase.from("products").insert(product);

    const { data, error } = await query.select("id").single();

    if (error || !data) {
      status.textContent = error?.code === "23505"
        ? "Ese código de modelo o identificador ya existe."
        : "No se pudo guardar. Revisa los datos y tus permisos.";
      return;
    }

    resetForm();

    try {
      await loadProducts();
      status.textContent = "Producto guardado correctamente.";
    } catch {
      status.textContent =
        "El producto se guardó, pero no se pudo actualizar la lista.";
    }
  } catch {
    status.textContent =
      "No se pudo confirmar el guardado. Actualiza la lista antes de reintentar.";
  } finally {
    saving = false;
    saveButton.disabled = false;
    cancelButton.disabled = false;
  }
});

cancelButton.addEventListener("click", () => {
  if (!saving) resetForm();
});

document.querySelector("#refresh").addEventListener("click", async () => {
  try {
    await loadProducts();
  } catch {
    status.textContent = "No se pudo cargar la lista.";
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    status.textContent = "No se pudo cerrar sesión.";
    return;
  }

  location.replace("./login.html");
});

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    panel.hidden = true;
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
      status.textContent =
        "No se pudo verificar el acceso. Recarga la página.";
      return;
    }

    if (isAdmin !== true) {
      status.textContent =
        "Esta cuenta no tiene permisos de administración.";
      return;
    }

    panel.hidden = false;
    await loadProducts();
  } catch {
    status.textContent =
      "No se pudo cargar el panel. Revisa la conexión y recarga.";
  }
}

start();