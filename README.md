# 🚀 MONGO-CLI - INTERFAZ PERSONALIZADA

Una interfaz de línea de comandos (CLI) profesional y dinámica construida con **Node.js** para interactuar con MongoDB de forma intuitiva y visual.

## ✨ Características Principales

* **Autocompletado (TAB):** Sugiere comandos base y nombres de colecciones en tiempo real mientras escribes.
* **Navegación Dinámica:** Cambia entre entornos fácilmente con comandos simplificados como `use <db>` y `collection <col>`.
* **Visualización Inteligente:**
    * **Recorte Automático:** Los strings largos se truncan automáticamente para mantener la integridad de la tabla.
    * **Modo JSON Automático:** Si una consulta devuelve más de 15 documentos, el sistema cambia automáticamente a un formato de lista detallada para mejorar la legibilidad.
* **Estado de Conexión:** El prompt cambia de color y emite alertas sonoras basándose en si el cliente está en línea.
* **Sistema de Ayuda:** Incluye un comando `--help` o `--h` que despliega todos los comandos disponibles y su sintaxis.

## 🛠️ Instalación Global

Para usar esta herramienta desde cualquier carpeta en tu terminal:

1. **Clona el repositorio:**
```bash
git clone https://github.com/lerma-dev/mongodb-custom-shell.git
cd mongodb-custom-shell
```
2. **Instala dependecias y enlaza globalmente:**
```bash
npm install
npm link
```
3. **¡Listo! Ahora puedes ejecutarlo en cualquier lugar con:**
```bash
mongo-cli
```

## ⌨️ Guía de Comandos

Comando,Descripción
* `use <nombre_db>` --Cambia o crea una base de datos.
* `collection <nombre_col>` --Selecciona la colección para las consultas.
* `show dbs` --Lista todas las bases de datos en el servidor.
* `show collections` --Lista las colecciones de la base de datos actual.
* `find().limit(n)` --Ejecuta consultas MQL estándar.
* `cls / clear` --Limpia la pantalla de la terminal.
* `exit()` --Cierra la conexión y sale de la app.

## 🎨 Tematización (Colores ANSI)

La shell aplica estilos visuales para diferenciar los tipos de datos en los resultados:

* 🆔 **IDs:** Púrpura
* 📝 **Strings:** Verde
* 🔢 **Números:** Naranja
* 🔘 **Booleanos/Null:** Azul
* ⚠️ **Errores:** Rojo
* 🌐 **Prompt:** Dinámico entre Verde (conectado) y Rojo (desconectado)

## 📝 Requisitos
* **Node.js v20+**
* Instancia de **MongoDB** activa (Local o Atlas)
* Dependencias: `console-table-printer`, `mongodb`
