# Projet Final

## Installation
1. En premier lieu, assurez-vous d'avoir correctement installe MongoDB ainsi que Node.js, toutes les etapes indiquees dans les slides des semaines precedentes
sont primordiales pour le bon fonctionnement de l'application.

    - **MongoDB** : https://www.mongodb.com/try/download/community
    - **Node.js** : https://nodejs.org

2. Installer la base de donnees:
    - Ouvrez un terminal et executez ces commandes :
      ```sh
      $ mongo
      $ use database
      $ db.createCollection("users")
      ```
      (assurez-vous de ne pas deja avoir une base de donnees du meme nom "database")

3. Installer les modules:
    - Ouvrez un terminal et executez ces commandes :
      ```sh
      $ npm install express
      $ npm install hogan
      $ npm install consolidate
      $ npm install mongodb
      $ npm install express-session
      $ npm install body-parser
      $ npm install https
      $ npm install fs
      $ npm install bcrypt
      ```

    (Pour utiliser les tests :)
      ```sh
      $ npm install selenium-webdriver selenium
      $ npm install jest
      ```



## Utilisation
1. Executer la commande `node server.js` dans le dossier racine (ici).

2. Ouvrir un navigateur.

3. Entrer l'url suivante: `https://localhost:8080`.



## Application
* La page d'accueil contient une description et permet de se connecter ou de se creer un compte.



## Authors
+ Alsteens Louis
+ Arys Simon
+ Thirifay Louis
