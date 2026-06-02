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
npm run go
```

*(Si todo va bien, verás en la consola que Mongo se ha conectado y el servidor corre en el puerto 1337).*

### 3. Ver la Documentación en Swagger 👀
¡No hace falta probar los Endpoints a ciegas con Postman! He preparado una interfaz gráfica para probar la API.
Abre tu navegador una vez el servidor esté encendido y visita:
👉 **[http://localhost:1337/swagger](http://localhost:1337/swagger)**

---

## 🛠️ Tecnologías Utilizadas
- **Node.js & Express**: Para el servidor HTTP.
- **TypeScript**: Para que nuestro código sea más tipado y seguro.
- **Mongoose**: Para conectarnos a la base de datos de MongoDB.
- **Joi**: Para validar los datos (que no nos envíen campos sueltos o emails falsos).
- **Swagger**: Para la documentación visual de las rutas.

---

## Implementación MINIMO 2

En esta segunda parte se ha añadido un sistema de recomendaciones asistido por IA dentro del backend. El frontend no se ha implementado todavía, por lo que toda la funcionalidad se expone mediante endpoints REST.

### 1. Configuración del servicio IA

Se ha configurado el backend para llamar a un servicio remoto compatible con la API de Ollama. La configuración se encuentra en el archivo `.env`:

```env
LLM_BASE_URL="http://10.4.119.50:8080"
LLM_MODEL="qwen2.5:14b"
```

El backend usa estos valores desde `src/config/config.ts` y realiza llamadas al endpoint:

```http
POST /api/generate
```

El modelo recibe un prompt generado por el backend a partir de la petición del usuario y del contexto disponible.

### 2. Servicio de IA

Se ha creado `src/services/AI.ts`, que centraliza la comunicación con el modelo:

- `checkAIConnection()`: comprueba si el servicio IA está disponible.
- `generateText()`: envía un prompt al modelo remoto.
- `buildRecommendationPrompt()`: construye el prompt final con la petición del usuario y el contexto.
- `generateRecommendation()`: genera la recomendación final.

### 3. Sistema de recomendaciones

Se han añadido los siguientes archivos:

- `src/services/Recomendacion.ts`
- `src/controllers/Recomendacion.ts`
- `src/routes/Recomendacion.ts`

El endpoint principal es:

```http
POST /recomendaciones
```

Funcionamiento:

1. El usuario envía una consulta en el campo `query`.
2. Si el body incluye `context`, el backend usa ese contexto directamente.
3. Si no se proporciona `context`, el backend busca libros en MongoDB para generar contexto automáticamente.
4. Con la consulta y el contexto se construye un prompt.
5. El prompt se envía al modelo `qwen2.5:14b`.
6. La respuesta generada se devuelve al cliente.

Ejemplo de petición sin contexto:

```json
{
  "query": "Recomiéndame un libro de programación barato",
  "limit": 5
}
```

Ejemplo de petición con contexto:

```json
{
  "query": "Recomiéndame el mejor libro de esta lista",
  "context": [
    {
      "title": "Clean Code",
      "text": "Título: Clean Code\nAutor: Robert C. Martin\nCategoría: programación\nTipo: VENTA\nPrecio: 12\nEstado: usado"
    }
  ]
}
```

### 4. Preparación para Weaviate

También se ha creado `src/services/Weaviate.ts` como base para una futura integración con base de datos vectorial. Incluye funciones para:

- comprobar conexión con Weaviate
- crear el esquema de libros
- indexar libros con vectores
- buscar libros mediante búsqueda vectorial

Además, existe la función `syncLibrosToWeaviate()` en `src/services/Recomendacion.ts`, que lee libros de MongoDB, genera embeddings e intenta sincronizarlos con Weaviate. Actualmente las recomendaciones principales no dependen de Weaviate, ya que el flujo activo usa MongoDB como fuente de contexto.

### 5. Cómo probar el funcionamiento

Primero, levanta el backend:

```bash
npm run go
```

Comprueba que el servicio IA remoto responde:

```powershell
curl.exe "http://localhost:1337/recomendaciones/health"
```

Prueba una recomendación desde PowerShell:

```powershell
$body = @{
  query = "Recomiéndame un libro de programación barato"
  limit = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:1337/recomendaciones" -Method POST -ContentType "application/json" -Body $body
```

Para ver la respuesta completa desplegada:

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:1337/recomendaciones" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 10
```

También se ha añadido el script `test-recomendacion.ts` fuera de `src`, que ejecuta la consulta y muestra el resultado completo:

```bash
npx ts-node test-recomendacion.ts
```

Este script imprime:

- el body enviado
- la respuesta JSON completa
- la respuesta textual generada por la IA
- el contexto usado por el modelo
