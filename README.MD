# Semantic Highlighter Chrome Extension

Un resaltador de texto "inteligente" para Chrome. Esta extensión te permite buscar en una base de datos de 100+ tópicos y resalta todo el texto semánticamente relacionado en la página que estás leyendo.

![WiseOwl_demo.png]


---

## 🚀 Características

* **Búsqueda Rápida:** Encuentra tópicos al instante usando [Fuse.js](https://fusejs.io/) para una búsqueda "fuzzy" (difusa) mientras escribes.
* **Base de Datos Inteligente:** Incluye más de 100 tópicos pre-calculados, cada uno con una lista expandida de palabras clave semánticamente relacionadas.
* **100% Privado y Rápido:** Todo el procesamiento se realiza localmente en tu navegador. Tus datos de navegación nunca salen de tu máquina.
* **Limpieza Fácil:** Un solo clic para eliminar todos los resaltados de la página.

---

## 🛠️ Cómo Funciona (Arquitectura)

Este proyecto utiliza un enfoque **híbrido** para balancear inteligencia y rendimiento, evitando cargar modelos de IA pesados en el navegador.

1.  **En Tiempo de Build (Offline):**
    * Un script de Python (`generate_topics.py`) usa `nltk (WordNet)` para generar un corpus de miles de palabras clave.
    * Usa `sentence-transformers` para comparar los 100+ "tópicos base" contra el corpus.
    * Genera el "cerebro" de la extensión: un archivo `topics.json` masivo que mapea cada tópico a su lista de palabras clave semánticamente similares.

2.  **En Tiempo de Ejecución (En la Extensión):**
    * **Popup (`popup.js`):** Carga solo los *nombres* de los tópicos desde `topics.json` y usa `Fuse.js` para potenciar la barra de búsqueda.
    * **Content Script (`content.js`):** Cuando el usuario selecciona un tópico, el script carga el `topics.json` completo (una sola vez, con caché), busca la lista de palabras clave para ese tópico y recorre el DOM de la página para resaltar las coincidencias.

---

## 💻 Instalación (para Desarrollo)

Para clonar y ejecutar este proyecto localmente:

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/chrome-nlp-highlighter.git](https://github.com/tu-usuario/chrome-nlp-highlighter.git)
    cd chrome-nlp-highlighter
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Construye la extensión:**
    * Para una compilación de producción (minificada):
        ```bash
        npm run build
        ```
    * Para modo de desarrollo (se reconstruye automáticamente al guardar cambios):
        ```bash
        npm run dev
        ```

4.  **Carga la extensión en Chrome:**
    * Abre Chrome y ve a `chrome://extensions`.
    * Activa el **"Developer mode" (Modo desarrollador)** en la esquina superior derecha.
    * Haz clic en **"Load unpacked" (Cargar descomprimida)**.
    * Selecciona la carpeta `dist` que se generó en tu proyecto.

---

## 📜 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.
