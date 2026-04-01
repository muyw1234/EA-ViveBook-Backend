# Documentacion Interna de rutas

## auth/

Ruta que maneja autenticacion de usuarios y controla el acceso a los recursos internos. Las rutas son:

- `POST /auth/signup` Registra un usuario y devuelve el token de autenticacion en la cabecera con el parámetro `auth-token`.
- `POST /auth/signin` Inicia sesion y devuelve el token de autenticacion en la cabecera con el parámetro `auth-token`.
- `GET /auth/profile` Devuelve la informacion a partir del token en la cabecera en el parámetro `Authorization:`. Ojo, vigila que tiene que seguir este formato: `Authorization: Bearer <token>`, esto
  es porque nos lo manda Swagger.
