# Minimo 2

## Ejercicio: Medir metrica con Matomo.

La ruta implementada es `/matomo` y las subrutas pueden ser `/version` o `/summary`. Me ha costado.

Pideme los secrets si necesitais hacer los tests.

Pero tambien se puede desplegar localmente con docker. El archivo docker compose seria

```yaml
services:
    matomo-db:
        image: mysql:8.0
        container_name: matomo-db
        restart: always
        environment:
            MYSQL_ROOT_PASSWORD: root
            MYSQL_DATABASE: matomo
            MYSQL_USER: matomo
            MYSQL_PASSWORD: matomo
        volumes:
            - db_data:/var/lib/mysql
    matomo:
        image: matomo
        container_name: matomo
        restart: always
        ports:
            - '9010:80'
        depends_on:
            - matomo-db
volumes:
    db_data:
```

## Referencias usadas

- [Repositorio del paquete instalado](https://github.com/mj-kiwi/matomo-js)
- [Documentacion oficial de matomo](https://developer.matomo.org/guides/integrate-introduction)
- [OAuth2 de matomo](https://developer.matomo.org/guides/oauth2/setup)
- [Reporting api](https://developer.matomo.org/api-reference/reporting-api)
- [What is matomo and how to set up matomo locally](https://medium.com/@svsh227/what-is-matomo-and-how-to-set-up-matomo-locally-3d92fcb8e4b4)
