&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
#----------------- Projet Final -----------------
&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

            ~    **Installation**    ~
1. En premier lieu, assurez-vous d'avoir correctement installe MongoDB ainsi que Node.js, toutes les etapes indiquees dans les slides des semaines precedentes
sont primordiales pour le bon fonctionnement de l'application.

MongoDB : https://www.mongodb.com/try/download/community
Node.js : https://nodejs.org

2. Installer la base de donnees:
    - Ouvrez un terminal et executez ces commandes :
      * mongo
      * use database (assurez-vous de ne pas deja avoir une base de donnees du meme nom "database")
      * db.createCollection("users")

3. Installer les modules:
    - Ouvrez un terminal et executez ces commandes :
      * npm install express
      * npm install hogan
      * npm install consolidate
      * npm install bcrypt
    (Pour utiliser les tests :)
      * npm install selenium-webdriver selenium
      * npm install jest


            ~    **Utilisation**    ~
1. Executer la commande "node server.js" dans le dossier racine (ici).

2. Ouvrir un navigateur.

3. Entrer l'url suivante: "https://localhost:8080".


            ~    **Application**    ~
* La page d'accueil affiche les evenements.
* La page ajouter permet d'ajouter un evenement si vous etes connecte, ou sinon redirige vers la page identification.
* La page identification permet de se connecter ou de se creer un compte.
* La barre de recherche permet de chercher parmi les evenements.


              ~    **F.A.Q**    ~
* Je ne parviens pas a lancer le serveur que faire ?
  il se peut d'avoir une erreur concernant bcrypt en fonction de votre système d'exploitation.
  Essayez de reinstaller bcrypt (npm install bcrypt) sinon, verifiez l'erreur affichee dans l'invite de commande


              ~    **Authors**    ~
+ Alsteens Louis
+ Arys Simon
+ Thirifay Louis
