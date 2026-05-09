# ***Segundo trabajo en grupo: Medcore Api***

## Miembros del gupo:

Gonzalo Barroso González - alu0101137094

Pablo González Martín - alu0101421179

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
    * A continuación inicamos el servidor con dos comandos
        * El primero pone la base de datos guardada en la variable **dev.env**:
        ```
        npm run dev
        ```
        
        De esta forma ya tendrás la aplicación ejecutando y puedes trabajar con Postman para mandarle solicitudes.