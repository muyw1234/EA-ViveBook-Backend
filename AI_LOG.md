# AI_LOG.md

## Eina i model IA usats

- **Eina IA:** ChatGPT
- **Model IA:** GPT-5.3

---

## Entrada 1 [11:02]

**Pregunta**  
Afegir noves entrades a `AI_LOG.md` per cada consulta seguint l'estructura existent.

**Prompt**

```text
Cada vez que te haga una consulta, quiero que añadas una nueva entrada al fichero AI_LOG.md siguiendo la estructura especificada.

Tiene que incluir:
Entrada X (hora a la que se efectua la pregunta)

Pregunta: Resumen de que quiero preguntar.

Promt: Promt exacto que he introducido.

Incoherencias y Solución dejalo solo idicado.

Sige el mismo especificado del que ya existe.
```

**Incoherències**

- Ninguna, funciona correctamente.

**Solució**

- No ha dado problemas, lo unico que a posteriori se ha tenido que ir añadiendo el apartado de incoherencias y soluciones.

---

## Entrada 2 [11:08]

**Pregunta**  
Consultar què cal implementar al backend per afegir un assistent d'IA amb recomanacions usant Weaviate com a BBDD vectorial i un LLM local.

**Prompt**

```text
Quiero implementar un asistenete de IA que ayude a hacer recomendaciones. No hace falta que tenga en cuenta el contexto de la conversacion.

Quiero implementar una BBDD Vectorial con https://weaviate.io/

Un Ejemplo del uso de un LLM sobre una maquina seria:

curl http://10.4.119.50:8080/api/generate -d '{
 "model": "qwen2.5:14b",
 "prompt": "Explica qué es Docker"
 }'

Que deberia implementar para que esto funcione. Recuerda que este codigo hace referencia al backend de mi aplicacion, el frontend se hara mas adelante.
```

**Incoherències**

- Ha dado un par de pasos que no han sido correctos ya que consideraba que weaviete y el modelo LLM se runeaban en local.

**Solució**

- Ignorar esos pasos y poner las credenciales correctas para llamar a la IP proporcionada.

---

## Entrada 3 [11:14]

**Pregunta**  
Afegir al fitxer `.env` les variables d'entorn necessàries per executar en local Weaviate i el servei LLM.

**Prompt**

```text
Las variables de entorno quiero que esten en el archivo .env, modificamelo añadiendo estos parametros teniendo en cuenta que lo voy a runear en local.
```

**Incoherències**

- Me ha puesto localhost en todo.

**Solució**

- Canviar localhost por la IP proporcionada en el enunciado.

---

## Entrada 4 [11:16]

**Pregunta**  
Crear el servei `src/services/Weaviate.ts` amb la lògica necessària per connectar amb Weaviate i gestionar llibres vectoritzats.

**Prompt**

```text
Ahora creame el archivo src/services/Weaviate.ts con todo lo que sea necesario.
```

**Incoherències**

- Ninguna, funciona correctamente, a excepcion de algunos nombres de variables.

**Solució**

- Modificar dichos nombres.

---

## Entrada 5 [11:19]

**Pregunta**  
Crear el servei `src/services/AI.ts` per comunicar el backend amb el LLM local i generar embeddings.

**Prompt**

```text
Ahora continua con el servicio de IA src/services/AI.ts
```

**Incoherències**

- Ha funcionado correctamente.

**Solució**

- Se le ha indicado el cambio de nombres anteiormente y ya lo ha hecho bien.

---

## Entrada 6 [11:23]

**Pregunta**  
Afegir els fitxers de controller, service i route per exposar recomanacions d'IA al backend.

**Prompt**

```text
Añade los tres archivos necesarios:
src/controllers/Recomendacion.ts
src/services/Recomendacion.ts
src/routes/Recomendacion.ts
```

**Incoherències**

- Los ha hecho bien.

**Solució**

- Ninguna.

---

## Entrada 7 [11:26]

**Pregunta**  
Afegir una funció `syncLibrosToWeaviate()` que llegeixi els llibres de MongoDB i els indexi a Weaviate amb text descriptiu.

**Prompt**

```text
Añade una funicon para indexar los libros existentes del tipo syncLibrosToWeaviate() que lea los libros de MongoDB y los mande con texto tipo

Título: Clean Code
Autor: Robert C. Martin
Categoría: programación
Tipo: VENTA
Precio: 12
Estado: usado
```

**Incoherències**

- Ha funcionado correctamente.

**Solució**

- Ninguna.

---

## Entrada 8 [11:51]

**Pregunta**  
Adaptar el sistema de recomanacions perquè usi Ollama remot a `10.4.119.50:8080` i, si no es proporciona context, busqui llibres a MongoDB.

**Prompt**

```text
El servicio de weaviate y Ollama NO estaran en local, sino que se haran las siguientes consultas:

curl http://10.4.119.50:8080/api/generate -d '{
 "model": "qwen2.5:14b",
 "prompt": "Explica qué es Docker"
 }'

Este es un ejemplo donde no se esta usando weaviate, cosa que luego hara falta modificar. Basicamente se hace la llamada a esa IP especificando ese modelo, luego se añade el prompt que vendra especificado por el usuario.

El prompt puede añadir vectores para especificar data qeu quiera usar como contexto. Sino quiero que busque por los libros de la base de datos de MongoDB para buscar contexto.

Esto proporcionara datos que luego seran entregados al cliente.

Haz las modificaciones necesarias para que esto funcione
```

**Incoherències**

- Aqui se ha efectuado el cambio especificado anteriormente.

**Solució**

- Una vez hehco el cambio ha funcionado.

---

## Entrada 9 [12:10]

**Pregunta**  
Afegir al `README.md` una secció `Implementación MINIMO 2` explicant la implementació del sistema de recomanacions amb IA i com provar-lo.

**Prompt**

```text
Añade una sección en el README.md con titulo implementación MINIMO 2 donde se explique todos los pasos que se han realizado y como probar su funcionamiento.
```

**Incoherències**

- Ha puesto cosas de mas.

**Solució**

- Eliminarlas.
