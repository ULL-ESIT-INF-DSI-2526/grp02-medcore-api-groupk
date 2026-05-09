# ***Segundo trabajo en grupo: Medcore Api***

## ***Miembros del gupo***:

Gonzalo Barroso González - alu0101137094

Pablo González Martín - alu0101421179

## ***Api desplegada en Render***:

El enlace a la api desplegada en Render es el siguiente => [Medcore API](https://medcore-api-groupk.onrender.com/api-docs/).

Desde ahí se pueden ver todos los endpoints así como ejemplos de cada uno y sus códigos de error.


## ***Modo de ejecución del proyecto en local:***

* Tendremos que tener dos consolas abiertas a la vez, una para MongoDB y otra para ejecutar el proyecto. Primero de todo tenemos que iniciar el servidor en nuestra máquina local, para lo que se usa el comando:
```
sudo /home/usuario/mongodb/bin/mongod --dbpath /home/usuario/mongodb-data/
```

* Una vez esté el Mongo DB en marcha se ejecuta la aplicación en la otra consola de la siguente forma:
    * Primero instalar las dependencias:
    ```
    npm install
    ```
    * Luego compilar la aplicación con el escript **build**:
    ```
    npm run build
    ```
    * A continuación iniciamos el servidor con el comando:
        ```
        npm start
        ```
        Pone la base de datos guardada en la variable **dev.env** que es la que guarda la base de datos que estamos usando.

        De esta forma ya tendrás la aplicación ejecutando y puedes trabajar con Postman para mandarle solicitudes.

## ***Test:***

Si se quiere ejecutar los test hay dos métodos, uno para ejecutar vitest solamente y otro para coveralls:

```
npm run test
```
```
npm run coverage
```



[![CI Tests](https://github.com/ULL-ESIT-INF-DSI-2526/grp02-medcore-api-groupk/actions/workflows/ci.yml/badge.svg)](https://github.com/ULL-ESIT-INF-DSI-2526/grp02-medcore-api-groupk/actions/workflows/ci.yml)

[![Coverage Status](https://coveralls.io/repos/github/ULL-ESIT-INF-DSI-2526/grp02-medcore-api-groupk/badge.svg?branch=main)](https://coveralls.io/github/ULL-ESIT-INF-DSI-2526/grp02-medcore-api-groupk?branch=main)
