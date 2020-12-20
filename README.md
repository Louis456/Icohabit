# Projet Final



## Installation
1. En premier lieu, assurez-vous d'avoir correctement installe MongoDB ainsi que Node.js

    - [**MongoDB**](https://www.mongodb.com/try/download/community)
    - [**Node.js**](https://nodejs.org)

2. Installer les modules:
    - Ouvrez un terminal et executez ces commandes dans le dossier racine (ici) :
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

    - (Pour utiliser les tests :)
        ```sh
        $ npm install selenium-webdriver selenium
        $ npm install jest
        ```

3. Importer la base de donnees remplie en exemple: 
    - Executer la commande suivante dans le dossier racine (ici):
        `mongorestore -d icohabitdb ./example_db`



## Utilisation
1. Executer la commande `node server.js` dans le dossier racine (ici).

2. Ouvrir un navigateur.

3. Entrer l'url suivante: `https://localhost:8080`.

4. Si vous utilisez la base de donnees d'exemple vous pouvez utiliser ces identifiants:
    - **Nom d'utilisateur**:    username
    - **Mot de passe**:         123
    (tous les mots de passe des utilisateurs et des groupes sont 123)

5. (Pour executer les tests:)
    - Ouvrir le dossier tests puis ouvrir le fichier **main.test.js**
    - **Choisir la langue de votre navigateur** à la ligne 15 pour eviter les conflits entre les formats de date.
    - Executer la commande suivante dans le dossier racine: `npm test`



## Application
*  #### Accueil
    La page contient notre logo et notre slogan, une description generale du site, des descriptions de nos 3 fonctionnalites <br>
    ainsi que les champs pour se connecter et se creer un compte.

*  #### Groupes
    La page contient tous les groupes dont l'utilisateur fait parti ainsi que les champs pour pouvoir creer, <br>
    se connecter ou quitter un groupe.

*  #### App
    La page contient 3 boutons permettant de choisir entre la todolist, le planning ou les depenses.

*  #### Todolist
    La page affiche les taches a faire et les taches deja faites et permet d'ajouter, de marquer comme realisees <br>
    ou de supprimer des taches.

*  #### Planning
    La page affiche les evenements a venir ou passes en fonction de la date actuelle et permet d'en ajouter des <br>
    nouveaux ou d'en supprimer.

*  #### Depenses
    La page affiche les depenses et permet d'ajouter ou de supprimer des depenses, elle affiche aussi de <br>
    combien les personnes sont en positif ou negatif ainsi que les transactions a realiser pour que tout <br>
    le monde recupere son argent.






## Authors
+ Alsteens Louis
+ Arys Simon
+ Thirifay Louis
