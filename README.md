# Doom-Nano-ESP32

![Doom nano ESP32](https://github.com/ZelTroN-2k3/Doom-Nano-ESP32/blob/main/images/Doom-nano-ESP32.jpg)

Un moteur de jeu de tir à la première personne (FPS) de style rétro, inspiré par des classiques comme Wolfenstein 3D,
conçu pour tourner sur un microcontrôleur Arduino Nano ESP32-S2 avec un écran LCD ST7920.

Ce projet est une démonstration complète des capacités de la plateforme ESP32 pour le "demomaking" et le jeu rétro, 
incluant un moteur de rendu 3D par raycasting, une IA pour les ennemis, une gestion de la physique, des effets sonores, et un éditeur de niveau complet.

![Doom nano ESP32](https://github.com/ZelTroN-2k3/Doom-Nano-ESP32/blob/main/images/Doom-nano-ESP32-menu.jpg)
![Doom nano ESP32](https://github.com/ZelTroN-2k3/Doom-Nano-ESP32/blob/main/images/Doom-nano-ESP32-game.jpg)

## Table des Matières

  - [Fonctionnalités](https://www.google.com/search?q=%23fonctionnalit%C3%A9s)
  - [Matériel Requis](https://www.google.com/search?q=%23mat%C3%A9riel-requis)
  - [Logiciels et Dépendances](https://www.google.com/search?q=%23logiciels-et-d%C3%A9pendances)
  - [Installation et Compilation](https://www.google.com/search?q=%23installation-et-compilation)
  - [Comment Jouer](https://www.google.com/search?q=%23comment-jouer)
  - [L'Éditeur de Niveau](https://www.google.com/search?q=%23l%C3%A9diteur-de-niveau)
  - [Structure du Code](https://www.google.com/search?q=%23structure-du-code)
  - [Crédits et Remerciements](https://www.google.com/search?q=%23cr%C3%A9dits-et-remerciements)

## Fonctionnalités

  * **Moteur de Rendu 3D Raycasting** : Affiche un environnement 3D fluide sur un écran monochrome 128x64.
  * **Textures et Sprites** : Murs texturés avec effets d'ombrage et sprites pour les ennemis et les objets.
  * **Entités Dynamiques** : Gestion des ennemis avec une IA basée sur des états (repos, alerte, attaque en mêlée, tir à distance) et des objets à collecter (clés, kits de soin).
  * **Portes Interactives** : Portes standards et portes verrouillées nécessitant des clés pour être ouvertes.
  * **Système de Niveaux Multiples** : Le jeu peut charger plusieurs niveaux stockés efficacement en mémoire `PROGMEM`.
  * **Effets Sonores** : Sons pour les tirs, la collecte d'objets, les pas, etc., joués sur un simple buzzer.
  * **Menu d'Options** : Un menu pour configurer le son et inverser l'axe Y des contrôles.
  * **Contrôles Flexibles** : Le code est structuré pour supporter un joystick analogique, une manette SNES ou des boutons poussoirs.
  * **Éditeur de Niveau Complet** : Un outil web (HTML/JS/CSS) pour créer, modifier et exporter des cartes directement au format C++ requis par le jeu.

![Doom nano ESP32](https://github.com/ZelTroN-2k3/Doom-Nano-ESP32/blob/main/level-editor/level-editor-multilingual%20.png)

## Matériel Requis

1.  **Microcontrôleur** : **Arduino Nano ESP32-S2**.
2.  **Écran** : Écran LCD **ST7920 128x64** (mode SPI).
3.  **Contrôleur (au choix)** :
      * **Joystick Analogique** (par défaut) : Type HW-504 avec bouton poussoir.
      * **Manette SNES** (optionnel).
      * **Boutons poussoirs** (optionnel).
4.  **Son** : Un simple buzzer piézo-électrique.

Le brochage exact est défini dans le fichier `constants.h`.

## Logiciels et Dépendances

1.  **Arduino IDE** (version 2.x recommandée).
2.  **Support pour les cartes ESP32** : À installer via le gestionnaire de cartes de l'Arduino IDE.
3.  **Bibliothèque `U8g2lib`** : La bibliothèque graphique essentielle pour l'écran. Elle peut être installée via le gestionnaire de bibliothèques de l'Arduino IDE.

## Installation et Compilation

1.  **Installation** :
      * Installez l'Arduino IDE.
      * Ajoutez le support pour les cartes ESP32 dans le gestionnaire de cartes.
      * Installez la bibliothèque `U8g2lib` depuis le gestionnaire de bibliothèques.
2.  **Configuration** :
      * Clonez ou téléchargez ce projet.
      * Ouvrez le fichier principal (`main.h` ou le `.ino` correspondant) dans l'Arduino IDE.
      * Dans `constants.h`, choisissez votre type de contrôleur en décommentant la ligne appropriée (`USE_JOYSTICK`, `USE_SNES_CONTROLLER`, ou `USE_BUTTONS`).
3.  **Branchement** : Branchez le matériel en suivant les définitions de broches dans `constants.h`.
4.  **Téléversement** :
      * Sélectionnez "Arduino Nano ESP32" dans le menu des cartes.
      * Choisissez le bon port COM.
      * Cliquez sur "Téléverser".

## Comment Jouer

Le jeu est configuré par défaut pour utiliser un joystick analogique.

  * **Stick analogique** : Déplacer le joueur (avant/arrière) et le faire tourner (gauche/droite).
  * **Bouton du Joystick (clic)** : Tirer / Interagir avec les portes / Sélectionner une option dans les menus.
  * **Bouton + Stick vers le bas** : Afficher la carte du niveau en vue de dessus.

## L'Éditeur de Niveau

Un éditeur de niveau basé sur le web est fourni pour faciliter la création de cartes.

  * **Pour l'utiliser** : Ouvrez le fichier `index.html` dans un navigateur web moderne (Chrome, Firefox).
  * **Fonctionnalités clés** :
      * Interface graphique pour dessiner les niveaux.
      * Palette complète avec tous les éléments du jeu.
      * Fonctions de chargement/sauvegarde de cartes.
      * Outils de sélection, copier et coller.
      * **Exportation directe** : Le bouton "Sauvegarder (C++)" génère un fichier `.txt` contenant le tableau `PROGMEM` à copier directement dans votre fichier `level.h`.

## Structure du Code

Le projet est organisé en plusieurs fichiers pour plus de clarté :

  * `main.h`: Cœur du programme, boucle principale, machine à états.
  * `constants.h`: Toutes les constantes globales, configuration des broches et du contrôleur.
  * `display.h`: Fonctions de rendu, initialisation de l'écran.
  * `entities.h`: Définition des structures `Player`, `Entity`, `Door`, etc.
  * `input.h`/`.cpp`: Gestion des entrées pour les différents contrôleurs.
  * `level.h`: Stockage des données des niveaux.
  * `sound.h`: Moteur sonore simple.
  * `sprites.h`: Toutes les données des images (bitmaps).
  * `types.h`/`.cpp`: Structures de base (`Coords`, `UID`) et fonctions associées.
  * `editor/`: Dossier contenant les fichiers de l'éditeur de niveau (`index.html`, `style.css`, `script.js`).

## Crédits et Remerciements

  * **Développement** : Votre Nom / Pseudo ici.
  * **Algorithme de Raycasting** : Le moteur de rendu est basé sur l'excellent tutoriel de [Lode Vandevenne](https://lodev.org/cgtutor/raycasting.html).
  * **Bibliothèque Graphique** : Un grand merci aux contributeurs de la bibliothèque [U8g2lib](https://github.com/olikraus/u8g2).
