# Projet Final



## Installation
1. En premier lieu, assurez-vous d'avoir correctement installe MongoDB ainsi que Node.js, toutes les etapes <br>
indiquees dans les slides des semaines precedentes
sont primordiales pour le bon fonctionnement de l'application.

    - [**MongoDB**](https://www.mongodb.com/try/download/community)
    - [**Node.js**](https://nodejs.org)

2. Installer les modules:
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
*  #### Accueil
    La page contient notre slogan, une description generale du site, des descriptions de nos 3 fonctionnalites ainsi <br>
    que les champs pour se connecter et se creer un compte.
    
*  #### Groupes
    La page contient tous les groupes dont l'utilisateur fait parti ainsi que les champs pour pouvoir creer, <br>
    se connecter ou quitter un groupe.

*  #### App
    La page contient 3 boutons permettant de choisir entre la todolist, le planning ou les depenses.

*  #### Todolist
    La page affiche les taches a faire et les taches deja faites et permet d'ajouter, de marquer comme realisees <br>
    ou de supprimer des taches

*  #### Planning
    La page affiche les evenements a venir et permet d'en ajouter des nouveaux ou d'en supprimer

*  #### Depenses
    La page affiche les depenses et permet d'ajouter ou de supprimer des depenses, elle affiche aussi les <br>
    transactions a realiser pour que tout le monde recupere son argent.





## Authors
+ Alsteens Louis
+ Arys Simon
+ Thirifay Louis
