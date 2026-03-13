# 📚 Plataforma de Libros y Eventos (API REST)

¡Amo la lectura y los eventos literarios! Este proyecto es el **Backend (API REST)** para una plataforma diseñada para que los amantes de los libros puedan comprar, alquilar, y asistir a eventos en sus librerías favoritas. Además, incluye un sistema de chat para que compradores y vendedores puedan hablar entre sí.

Este proyecto está construido con **Node.js, Express, TypeScript y MongoDB (Mongoose)**.

---

## 🌟 Funcionalidades Principales

Hemos modelado 5 entidades principales en nuestra base de datos. Cada una tiene sus rutas para crear, leer, actualizar y borrar información (CRUD):

1. **🧑‍💻 Usuarios (`/usuarios`)**: Personas registradas en la plataforma.
2. **🏪 Librerías (`/librerias`)**: Los espacios físicos que organizan eventos y sirven de punto de intercambio de libros.
3. **📖 Libros (`/libros`)**: Obras puestas en subida por los usuarios para *"VENTA"* o *"ALQUILER"*.
4. **🎟️ Eventos (`/eventos`)**: Actividades, charlas o clubes de lectura organizados por una librería.
5. **💬 Chats & Mensajes (`/chats` y `/mensajes`)**: Un sistema para que dos usuarios abran un canal de comunicación para hablar (por ejemplo, sobre un libro que quieren comprar).

---

## 🚀 ¿Cómo arrancar el proyecto?

Para ejecutar esta API en tu ordenador, asegúrate de tener **Node.js** y **MongoDB** instalados y funcionando localmente.

### 1. Instalar dependencias
Abre la terminal en la carpeta del proyecto y descarga todo lo necesario:
```bash
npm install
```

### 2. Arrancar el servidor
Compilamos el código de TypeScript y levantamos la API:
```bash
npm run build
npm start
```

*(Si todo va bien, verás en la consola que Mongo se ha conectado y el servidor corre en el puerto 1337).*

### 3. Ver la Documentación en Swagger 👀
¡No hace falta probar los Endpoints a ciegas con Postman! He preparado una interfaz gráfica para probar la API.
Abre tu navegador una vez el servidor esté encendido y visita:
👉 **[http://localhost:1337/api](http://localhost:1337/api)**

---

## 🛠️ Tecnologías Utilizadas
- **Node.js & Express**: Para el servidor HTTP.
- **TypeScript**: Para que nuestro código sea más tipado y seguro.
- **Mongoose**: Para conectarnos a la base de datos de MongoDB.
- **Joi**: Para validar los datos (que no nos envíen campos sueltos o emails falsos).
- **Swagger**: Para la documentación visual de las rutas.
