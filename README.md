# 📚 Plataforma de Libros y Eventos (API REST)

¡Amo la lectura y los eventos literarios! Este proyecto es el **Backend (API REST)** para una plataforma diseñada para que los amantes de los libros puedan comprar, alquilar, y asistir a eventos en
sus librerías favoritas. Además, incluye un sistema de chat para que compradores y vendedores puedan hablar entre sí.

Este proyecto está construido con **Node.js, Express, TypeScript y MongoDB (Mongoose)**.

---

## Minim 2

# AI_LOG.md

**Eina utilitzada:** Google Gemini  
**Model:** Gemini 1.5 Pro (Gener 2026)

## Consulta 1: Millora visual de les notificacions

- **Pregunta:** Com puc substituir els `alert()` natius del navegador per un sistema d'avisos flotants més modern, visual i net?
- **Prompt:** _"ahora si quiero cambiar el alert por un otro estilo para que se quede visualmente mejor?"_ i posteriorment el fitxer `App.tsx` de rutes.
- **Incoherències:** El model va oferir el canvi directe del servei de notificacions, però en implementar-ho directament a l'estructura del component es generava un bucle de renderitzat que feia
  saltar la barra d'avís constantment.
- **Solució:** S'instal·la la llibreria `react-toastify`. S'importen els estils CSS i el `<ToastContainer />` directament a l'arrel del projecte (dins de `App.tsx` envoltat pel `<Router>`) perquè
  estigui disponible globalment a totes les pantalles de l'aplicació.

## Consulta 2: Resolució de bucle infinit en els efectes de React (`useEffect`)

- **Pregunta:** Per què el Toast d'avís de notificació es dispara indefinidament en un bucle constant?
- **Prompt:** _"[Codi complet del component Home.tsx amb la lògica de Geonavegació i els dos useEffects de càrrega]"_
- **Incoherències:** El segon `useEffect` de la pàgina principal tenia configurat un array de dependències basat en `[loading, user]`. Com que la pròpia funció interna alterava o depenia d'aquests
  estats en finalitzar, tornava a subscriure l'escutador `onMessage` de Firebase una vegada i una altra, acumulant desenes de subscripcions duplicades en memòria.
- **Solució:** Es va eliminar completament el segon `useEffect`. Es va unificar i reestructurar tota la lògica d'inicialització de Firebase Cloud Messaging a la fi del primer bloc sota la funció
  asíncrona `fetchData`, assegurant que la subscripció a l'escutador actiu s'executi una única vegada quan l'usuari estigui autenticat i confirmat des del backend. Es van canviar tots els `alert()`
  vells de llibres i esdeveniments per mètodes del tipus `toast.success` i `toast.error`.

---

---

## Consulta: Resolució de l'error d'autenticació 401 en la subscripció de FCM

- **Pregunta:** Per què l'API de Google llança un error `401 (Unauthorized)` amb el missatge "Request is missing required authentication credential" quan el frontend intenta obtenir el token de
  dispositiu?
- **Prompt:** _"[imatge adjunta de la consola del navegador amb l'error de fcmregistrations.googleapis.com 401 Unauthorized]"_
- **Incoherències:** El model inicialment va suggerir que la clau d'API web ("Browser key") estava mal copiada al fitxer de configuració del frontend o que l'usuari no estava loguejat correctament a
  l'aplicació.
- **Solució:** Es va detectar que l'error venia derivat de les **Restriccions d'API** de la clau a la consola de Google Cloud Platform (GCP). Per solucionar-ho, es va accedir a la configuració de la
  credencial i, a l'apartat _"Elige las restricciones de API"_, es va canviar l'estat per incloure i autoritzar explícitament el llistat de les 26 API habilitades del projecte, assegurant especialment
  la **Firebase Cloud Messaging API** i la **FCM Registration API**. Amb aquesta restricció per llista blanca configurada correctament, els servidors de Google van començar a validar les peticions
  `POST` de subscripció Web Push de manera immediata i reeixida.

---

## 🌟 Funcionalidades Principales

Hemos modelado 5 entidades principales en nuestra base de datos. Cada una tiene sus rutas para crear, leer, actualizar y borrar información (CRUD):

1. **🧑‍💻 Usuarios (`/usuarios`)**: Personas registradas en la plataforma.
2. **🏪 Librerías (`/librerias`)**: Los espacios físicos que organizan eventos y sirven de punto de intercambio de libros.
3. **📖 Libros (`/libros`)**: Obras puestas en subida por los usuarios para _"VENTA"_ o _"ALQUILER"_.
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
npm run go
```

_(Si todo va bien, verás en la consola que Mongo se ha conectado y el servidor corre en el puerto 1337)._

### 3. Ver la Documentación en Swagger 👀

¡No hace falta probar los Endpoints a ciegas con Postman! He preparado una interfaz gráfica para probar la API. Abre tu navegador una vez el servidor esté encendido y visita: 👉
**[http://localhost:1337/swagger](http://localhost:1337/swagger)**

---

## 🛠️ Tecnologías Utilizadas

- **Node.js & Express**: Para el servidor HTTP.
- **TypeScript**: Para que nuestro código sea más tipado y seguro.
- **Mongoose**: Para conectarnos a la base de datos de MongoDB.
- **Joi**: Para validar los datos (que no nos envíen campos sueltos o emails falsos).
- **Swagger**: Para la documentación visual de las rutas.
