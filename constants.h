#ifndef _constants_h
#define _constants_h

// =================================================================
// ==           CHOIX DU CONTRÔLEUR D'ENTRÉE (1 SEUL !)           ==
// =================================================================
// Décommentez UNE SEULE des lignes suivantes pour choisir votre méthode de contrôle.

#define USE_JOYSTICK
// #define USE_SNES_CONTROLLER
// #define USE_BUTTONS


// =================================================================
// ==            CONFIGURATION DES BROCHES                      ==
// =================================================================

#if defined(USE_JOYSTICK)
  // -- BROCHES POUR LE JOYSTICK HW-504 --
  #define JOY_X_PIN           A0  // Broche analogique pour l'axe X
  #define JOY_Y_PIN           A1  // Broche analogique pour l'axe Y
  #define JOY_SW_PIN          D7  // Broche numérique pour le bouton (tir)

#elif defined(USE_SNES_CONTROLLER)
  // -- BROCHES POUR LA MANETTE SNES --
  constexpr uint8_t DATA_CLOCK   = 11;
  constexpr uint8_t DATA_LATCH   = 12;
  constexpr uint8_t DATA_SERIAL  = 13;
  // La directive SNES_CONTROLLER est nécessaire pour le reste du code
  #define SNES_CONTROLLER

#else // Par défaut, on utilise les boutons
  // -- BROCHES POUR LES BOUTONS --
  #define USE_INPUT_PULLUP
  #define K_LEFT              1
  #define K_RIGHT             2
  #define K_UP                3
  #define K_DOWN              4
  #define K_FIRE              5
#endif


// -- BROCHES POUR L'ÉCRAN ST7920 (en mode Software SPI) --
#define LCD_CLOCK_PIN       12
#define LCD_DATA_PIN        11
#define LCD_CS_PIN          10
#define LCD_RST_PIN         9

// -- BROCHE POUR LE SON --
constexpr uint8_t SOUND_PIN   = 8;


// ===============================================================
// ==               PARAMÈTRES GRAPHIQUES & JEU                 ==
// ===============================================================

// GFX settings - U8g2 est maintenant utilisé à la place du pilote SSD1306
#define FRAME_TIME              33.333333   // ~30 fps, l'ESP32 est plus rapide !
// #define FRAME_TIME          16.666       // Essayez de viser 60 images par seconde (1000ms / 60fps ≈ 16.6ms). Le processeur est largement assez rapide pour cela.
#define RES_DIVIDER             1           // 1 pour pleine résolution, l'ESP32 peut le gérer
#define Z_RES_DIVIDER           1           // Z-buffer en pleine résolution
#define DISTANCE_MULTIPLIER     20
#define MAX_RENDER_DEPTH        12
#define MAX_SPRITE_DEPTH        8

#define ZBUFFER_SIZE            SCREEN_WIDTH / Z_RES_DIVIDER

// Level 
#define LEVEL_WIDTH_BASE        6
#define LEVEL_WIDTH             (1 << LEVEL_WIDTH_BASE)
#define LEVEL_HEIGHT            57
#define LEVEL_SIZE              LEVEL_WIDTH / 2 * LEVEL_HEIGHT

// scenes
#define INTRO                   0
#define GAME_PLAY               1
#define OPTIONS                 2 // <-- OPTIONS
#define NEXT_LEVEL              3 // <-- NEXT_LEVEL
#define MAX_LEVELS              2 // Mettez le bon nombre de niveaux ici.

// Game
#define GUN_TARGET_POS          18
#define GUN_SHOT_POS            GUN_TARGET_POS + 4

#define ROT_SPEED               .12
#define MOV_SPEED               .2
#define MOV_SPEED_INV           5           // 1 / MOV_SPEED

#define JOGGING_SPEED           .005
#define ENEMY_SPEED             .02
#define FIREBALL_SPEED          .2
#define FIREBALL_ANGLES         45          // Num of angles per PI

#define MAX_ENTITIES            20          // Max num of active entities
#define MAX_STATIC_ENTITIES     28          // Max num of entities in sleep mode

#define MAX_ENTITY_DISTANCE     200         // * DISTANCE_MULTIPLIER
#define MAX_ENEMY_VIEW          80          // * DISTANCE_MULTIPLIER
#define ITEM_COLLIDER_DIST      6           // * DISTANCE_MULTIPLIER
#define ENEMY_COLLIDER_DIST     4           // * DISTANCE_MULTIPLIER
#define FIREBALL_COLLIDER_DIST  2           // * DISTANCE_MULTIPLIER
#define ENEMY_MELEE_DIST        6           // * DISTANCE_MULTIPLIER
#define WALL_COLLIDER_DIST      .2

#define ENEMY_MELEE_DAMAGE      8
#define ENEMY_FIREBALL_DAMAGE   20
#define GUN_MAX_DAMAGE          15

// Identifiants de texture spéciaux pour les portes
#define DOOR_TEXTURE            100
#define LOCKED_DOOR_TEXTURE     101
#define MAX_DOORS               20      // Nombre maximum de portes par niveau
#define DOOR_SPEED              0.05f   // Vitesse de l'animation d'ouverture de la porte
#define DOOR_OPEN_TIME          75      // Durée en "frames" (images) avant qu'une porte ne se ferme (75 frames à 30fps = 2.5 secondes)

// display
constexpr uint8_t SCREEN_WIDTH     =  128;
constexpr uint8_t SCREEN_HEIGHT    =  64;
constexpr uint8_t HALF_WIDTH       =  SCREEN_WIDTH/2;
constexpr uint8_t RENDER_HEIGHT    =  56;         // raycaster working height (the rest is for the hud)
constexpr uint8_t HALF_HEIGHT      =  SCREEN_HEIGHT/2;

#endif
