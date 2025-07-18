// ===============================================================
// ==                       INCLUDES                            ==
// ===============================================================
#include <Arduino.h>
#include <U8g2lib.h>
#include "constants.h"
#include "level.h"
#include "sprites.h"
#include "input.h"
#include "entities.h"
#include "types.h"
#include "display.h"
#include "sound.h"

// ===============================================================
// ==                  DÉCLARATIONS ANTICIPÉES                  ==
// ===============================================================
uint8_t getBlockAt(const uint8_t level[], uint8_t x, uint8_t y);
Coords translateIntoView(Coords *pos);
void updateEntities(const uint8_t level[]);
void renderMap(const uint8_t level[], double view_height);
void renderEntities(double view_height);
void renderGun(uint8_t gun_pos, double amount_jogging);
void renderHud();
void renderStats();
void loopIntro();
void loopGamePlay();
void renderTopDownMap();
void openDoor(uint8_t door_index);
void renderMessage();


// ===============================================================
// ==                 MACROS ET VARIABLES GLOBALES              ==
// ===============================================================
#define swap(a, b)            do { typeof(a) temp = a; a = b; b = temp; } while (0)
#define sign(a, b)            (double) (a > b ? 1 : (b > a ? -1 : 0))

// Variables de scène
uint8_t scene = INTRO;
bool exit_scene = false;
bool invert_screen = false;
uint8_t flash_screen = 0;

// --- VARIABLES POUR LES OPTIONS ---
uint8_t selected_option = 0;
const uint8_t num_options = 3; // 0: Son, 1: Inverser Y, 2: Commencer
bool sound_enabled = true;
bool y_axis_inverted = false;
// --- FIN DES VARIABLES OPTIONS ---

// Variables de jeus
Player player;
Entity entity[MAX_ENTITIES];
StaticEntity static_entity[MAX_STATIC_ENTITIES];
uint8_t num_entities = 0;
uint8_t num_static_entities = 0;

// --- Tableau pour stocker les portes du niveau ---
Door doors[MAX_DOORS];
uint8_t num_doors = 0;

// --- Variables pour les messages à l'écran ---
char hud_message[32] = "";
unsigned long message_timer_end = 0;

// --- CODE POUR LA GESTION DES NIVEAUX ---
uint8_t current_level_index = 0; // Commence au niveau 0 (le premier)

const uint8_t* all_levels[MAX_LEVELS] = {
  sto_level_1,
  sto_level_2, // Décommentez quand vous l'aurez créé
};
// --- FIN DU CODE ---



void setup(void) {
  Serial.begin(115200); // Pour le débogage
  setupDisplay();
  input_setup();
  sound_init();
}

// Jump to another scene
void jumpTo(uint8_t target_scene) {
  scene = target_scene;
  exit_scene = true;
}

// Finds the player in the map
void initializeLevel(const uint8_t level[]) {
  // On réinitialise les compteurs d'entités et de portes
  num_entities = 0;
  num_doors = 0;
  
  bool player_found = false;
  
  for (int16_t y = LEVEL_HEIGHT - 1; y >= 0; y--) {
    for (uint8_t x = 0; x < LEVEL_WIDTH; x++) {
      uint8_t block = getBlockAt(level, x, y);

      if (block == E_PLAYER) {
        player = create_player(x, y);
        player_found = true;
      } 
      else if ((block == E_DOOR || block == E_LOCKEDDOOR) && num_doors < MAX_DOORS) {
        doors[num_doors] = {
          create_uid(block, x, y),
          x, y,
          block,
          S_DOOR_CLOSED,
          0.0f
        };
        num_doors++;
      }
    }
  }

  // Si on n'a pas trouvé de point de départ 'P'
  if (!player_found) {
    // On place le joueur à une position de secours pour éviter un bug
    player = create_player(1, 1); 
  }
}

uint8_t getBlockAt(const uint8_t level[], uint8_t x, uint8_t y) {
  // Le warning du compilateur sur les conditions < 0 était correct.
  // Le type uint8_t ne peut pas être négatif. La condition reste pour x et y >= WIDTH/HEIGHT.
  if (x >= LEVEL_WIDTH || y >= LEVEL_HEIGHT) {
    return E_FLOOR;
  }
  
  return pgm_read_byte(level + (((LEVEL_HEIGHT - 1 - y) * LEVEL_WIDTH + x) / 2))
         >> (!(x % 2) * 4)
         & 0b1111;
}

bool isSpawned(UID uid) {
  for (uint8_t i = 0; i < num_entities; i++) {
    if (entity[i].uid == uid) return true;
  }

  return false;
}

bool isStatic(UID uid) {
  for (uint8_t i = 0; i < num_static_entities; i++) {
    if (static_entity[i].uid == uid) return true;
  }

  return false;
}

void spawnEntity(uint8_t type, uint8_t x, uint8_t y) {
  // Limit the number of spawned entities
  if (num_entities >= MAX_ENTITIES) {
    return;
  }

  // todo: read static entity status
  
  switch (type) {
    case E_ENEMY:
      entity[num_entities] = create_enemy(x, y);
      num_entities++;
      break;

    case E_KEY:
      entity[num_entities] = create_key(x, y);
      num_entities++;
      break;

    case E_MEDIKIT:
      entity[num_entities] = create_medikit(x, y);
      num_entities++;
      break;
  }
}

void spawnFireball(double x, double y) {
  // Limit the number of spawned entities
  if (num_entities >= MAX_ENTITIES) {
    return;
  }

  UID uid = create_uid(E_FIREBALL, x, y);
  // Remove if already exists, don't throw anything. Not the best, but shouldn't happen too often
  if (isSpawned(uid)) return;

  // Calculate direction. 32 angles
  int16_t dir = FIREBALL_ANGLES + atan2(y - player.pos.y, x - player.pos.x) / PI * FIREBALL_ANGLES;
  if (dir < 0) dir += FIREBALL_ANGLES * 2;
  entity[num_entities] = create_fireball(x, y, dir);
  num_entities++;
}

void removeEntity(UID uid, bool makeStatic = false) {
  uint8_t i = 0;
  bool found = false;

  while (i < num_entities) {
    if (!found && entity[i].uid == uid) {
      // todo: doze it
      found = true;
      num_entities--;
    }

    // displace entities
    if (found) {
      entity[i] = entity[i + 1];
    }

    i++;
  }
}

void removeStaticEntity(UID uid) {
  uint8_t i = 0;
  bool found = false;

  while (i < num_static_entities) {
    if (!found && static_entity[i].uid == uid) {
      found = true;
      num_static_entities--;
    }

    // displace entities
    if (found) {
      static_entity[i] = static_entity[i + 1];
    }

    i++;
  }
}

UID detectCollision(const uint8_t level[], Coords *pos, double relative_x, double relative_y, bool only_walls = false) {
  // Collision avec les murs et les portes
  uint8_t round_x = int(pos->x + relative_x);
  uint8_t round_y = int(pos->y + relative_y);
  uint8_t block = getBlockAt(level, round_x, round_y);

  // --- On vérifie les murs ET les portes ---
  if (block == E_WALL) { // Les murs bloquent toujours
    playSound(hit_wall_snd, HIT_WALL_SND_LEN);
    return create_uid(block, round_x, round_y);
  }

  // --- LOGIQUE DE COLLISION AVEC LES PORTES ---
  if (block == E_DOOR || block == E_LOCKEDDOOR) {
    for (uint8_t i = 0; i < num_doors; i++) {
      if (doors[i].x == round_x && doors[i].y == round_y) {
        
        // Si la porte est fermée au moment du contact...
        if (doors[i].state == S_DOOR_CLOSED) {
          openDoor(i); // ...on déclenche son ouverture.
          // On retourne une collision pour ce tour de boucle pour arrêter le joueur.
          // À l'image suivante, la porte sera en ouverture et laissera passer.
          return doors[i].uid;
        }

        // Si la porte est en train de se fermer, elle est solide.
        if (doors[i].state == S_DOOR_CLOSING) {
            return doors[i].uid;
        }

        // Si la porte est en train de s'ouvrir ou déjà ouverte, on ne retourne pas de collision.
        break; 
      }
    }
  }
  // --- FIN DE LA LOGIQUE ---

  if (only_walls) {
    return UID_null;
  }

  // Collision avec les entités
  for (uint8_t i=0; i < num_entities; i++) {
    // Don't collide with itself
    if (&(entity[i].pos) == pos) {
      continue;
    }

    uint8_t type = uid_get_type(entity[i].uid);

    // Only ALIVE enemy collision
    if (type != E_ENEMY || entity[i].state == S_DEAD || entity[i].state == S_HIDDEN) {
      continue;
    }

    Coords new_coords = { entity[i].pos.x - relative_x, entity[i].pos.y - relative_y };
    uint8_t distance = coords_distance(pos, &new_coords);

    // Check distance and if it's getting closer
    if (distance < ENEMY_COLLIDER_DIST && distance < entity[i].distance) {
      return entity[i].uid;
    }
  }

  return UID_null;
}

// Shoot
void fire() {
  // Logique d'interaction avec les portes
  uint8_t check_x = player.pos.x + player.dir.x * 0.6;
  uint8_t check_y = player.pos.y + player.dir.y * 0.6;
  uint8_t block = getBlockAt(all_levels[current_level_index], check_x, check_y);

  if (block == E_DOOR || block == E_LOCKEDDOOR) {
    for (uint8_t i = 0; i < num_doors; i++) {
      if (doors[i].x == check_x && doors[i].y == check_y) {
        if (doors[i].state == S_DOOR_CLOSED) {
          if (doors[i].type == E_LOCKEDDOOR) {
            if (player.keys > 0) {
              player.keys--;
              // playSound(open_door_snd, ...);
              doors[i].state = S_DOOR_OPENING;
            } else {
              // playSound(locked_door_snd, ...);
            }
          } else {
            // playSound(open_door_snd, ...);
            doors[i].state = S_DOOR_OPENING;
          }
        }
        return; 
      }
    }
  }

  // Si on n'a pas interagi avec une porte, on tire
  playSound(shoot_snd, SHOOT_SND_LEN);
  
  for (uint8_t i = 0; i < num_entities; i++) {
    if (uid_get_type(entity[i].uid) != E_ENEMY || entity[i].state == S_DEAD || entity[i].state == S_HIDDEN) {
      continue;
    }
    Coords transform = translateIntoView(&(entity[i].pos));
    if (abs(transform.x) < 20 && transform.y > 0) {
      uint8_t damage = (uint8_t)min((double)GUN_MAX_DAMAGE, (double)GUN_MAX_DAMAGE / (abs(transform.x) * entity[i].distance) / 5.0);
      if (damage > 0) {
        entity[i].health = max(0, (int)(entity[i].health - damage));
        entity[i].state = S_HIT;
        entity[i].timer = 4;
      }
    }
  }
}

// Update coords if possible. Return the collided uid, if any
UID updatePosition(const uint8_t level[], Coords *pos, double relative_x, double relative_y, bool only_walls = false) {
  UID collide_x = detectCollision(level, pos, relative_x, 0, only_walls);
  UID collide_y = detectCollision(level, pos, 0, relative_y, only_walls);

  if (!collide_x) pos->x += relative_x;
  if (!collide_y) pos->y += relative_y;

  // --- LOGIQUE DE TRANSITION ---
  uint8_t current_block = getBlockAt(level, (uint8_t)pos->x, (uint8_t)pos->y);
  if (current_block == E_EXIT) {
    // On déclenche la scène de transition vers le niveau suivant
    jumpTo(NEXT_LEVEL); 
  }
  // --- FIN DE LA TRANSITION ---

  return collide_x || collide_y || UID_null;
}

void updateEntities(const uint8_t level[]) {
  uint8_t i = 0;
  while (i < num_entities) {
    entity[i].distance = coords_distance(&(player.pos), &(entity[i].pos));
    if (entity[i].timer > 0) entity[i].timer--;

    if (entity[i].distance > MAX_ENTITY_DISTANCE) {
      removeEntity(entity[i].uid);
      continue;
    }
    if (entity[i].state == S_HIDDEN) {
      i++;
      continue;
    }

    uint8_t type = uid_get_type(entity[i].uid);

    switch (type) {
      case E_ENEMY: {
          if (entity[i].health == 0) {
            if (entity[i].state != S_DEAD) {
              entity[i].state = S_DEAD;
              entity[i].timer = 6;
            }
          } else  if (entity[i].state == S_HIT) {
            if (entity[i].timer == 0) {
              entity[i].state = S_ALERT;
              entity[i].timer = 40;
            }
          } else if (entity[i].state == S_FIRING) {
            if (entity[i].timer == 0) {
              entity[i].state = S_ALERT;
              entity[i].timer = 40;
            }
          } else {
            if (entity[i].distance > ENEMY_MELEE_DIST && entity[i].distance < MAX_ENEMY_VIEW) {
              if (entity[i].state != S_ALERT) {
                entity[i].state = S_ALERT;
                entity[i].timer = 20;
              } else {
                if (entity[i].timer == 0) {
                  spawnFireball(entity[i].pos.x, entity[i].pos.y);
                  entity[i].state = S_FIRING;
                  entity[i].timer = 6;
                } else {
                  updatePosition( level, &(entity[i].pos), sign(player.pos.x, entity[i].pos.x) * ENEMY_SPEED * delta, sign(player.pos.y, entity[i].pos.y) * ENEMY_SPEED * delta, true);
                }
              }
            } else if (entity[i].distance <= ENEMY_MELEE_DIST) {
              if (entity[i].state != S_MELEE) {
                entity[i].state = S_MELEE;
                entity[i].timer = 10;
              } else if (entity[i].timer == 0) {
                player.health = max(0, (int)(player.health - ENEMY_MELEE_DAMAGE));
                entity[i].timer = 14;
                flash_screen = 1;
                renderHud(); // On appelle renderHud()
              }
            } else {
              entity[i].state = S_STAND;
            }
          }
          break;
        }

      case E_FIREBALL: {
          if (entity[i].distance < FIREBALL_COLLIDER_DIST) {
            player.health = max(0, (int)(player.health - ENEMY_FIREBALL_DAMAGE));
            flash_screen = 1;
            renderHud(); // On appelle renderHud()
            removeEntity(entity[i].uid);
            continue;
          } else {
            UID collided = updatePosition( level, &(entity[i].pos), cos((double) entity[i].health / FIREBALL_ANGLES * PI) * FIREBALL_SPEED, sin((double) entity[i].health / FIREBALL_ANGLES * PI) * FIREBALL_SPEED, true);
            if (collided) {
              removeEntity(entity[i].uid);
              continue;
            }
          }
          break;
        }

      case E_MEDIKIT: {
          if (entity[i].distance < ITEM_COLLIDER_DIST) {
            playSound(medkit_snd, MEDKIT_SND_LEN);
            entity[i].state = S_HIDDEN;
            player.health = min(100, (int)(player.health + 50));
            renderHud(); // On appelle renderHud()
            flash_screen = 1;
          }
          break;
        }

      case E_KEY: {
          if (entity[i].distance < ITEM_COLLIDER_DIST) {
            playSound(get_key_snd, GET_KEY_SND_LEN);
            entity[i].state = S_HIDDEN;
            player.keys++;
            renderHud(); // On appelle renderHud()
            flash_screen = 1;
          }
          break;
        }
    }
    i++;
  }
}
// The map raycaster. Based on https://lodev.org/cgtutor/raycasting.html
void renderMap(const uint8_t level[], double view_height) {
  UID last_uid;
  for (uint8_t x = 0; x < SCREEN_WIDTH; x += RES_DIVIDER) {
    double camera_x = 2 * (double) x / SCREEN_WIDTH - 1;
    double ray_x = player.dir.x + player.plane.x * camera_x;
    double ray_y = player.dir.y + player.plane.y * camera_x;
    uint8_t map_x = uint8_t(player.pos.x);
    uint8_t map_y = uint8_t(player.pos.y);
    Coords map_coords = { (double)map_x, (double)map_y };
    double delta_x = abs(1 / ray_x);
    double delta_y = abs(1 / ray_y);
    int8_t step_x; 
    int8_t step_y;
    double side_x;
    double side_y;

    if (ray_x < 0) { step_x = -1; side_x = (player.pos.x - map_x) * delta_x; }
    else { step_x = 1; side_x = (map_x + 1.0 - player.pos.x) * delta_x; }
    if (ray_y < 0) { step_y = -1; side_y = (player.pos.y - map_y) * delta_y; }
    else { step_y = 1; side_y = (map_y + 1.0 - player.pos.y) * delta_y; }

    uint8_t depth = 0;
    bool hit = false;
    bool side;
    
    while (!hit && depth < MAX_RENDER_DEPTH) {
      if (side_x < side_y) { side_x += delta_x; map_x += step_x; side = 0; }
      else { side_y += delta_y; map_y += step_y; side = 1; }
      depth++;

      uint8_t block_hit = getBlockAt(level, map_x, map_y);
      
      if (block_hit == E_WALL) {
        hit = true;
      } else if (block_hit == E_DOOR || block_hit == E_LOCKEDDOOR) {
        // C'est une porte, on vérifie son état
        bool door_is_solid = false;
        for (uint8_t i = 0; i < num_doors; i++) {
          if (doors[i].x == map_x && doors[i].y == map_y) {
            // Calculer où le rayon frappe sur le mur (de 0.0 à 1.0)
            double wall_x;
            if (side == 0) wall_x = player.pos.y + ((map_x - player.pos.x + (1 - step_x) / 2) / ray_x) * ray_y;
            else wall_x = player.pos.x + ((map_y - player.pos.y + (1 - step_y) / 2) / ray_y) * ray_x;
            wall_x -= floor(wall_x);

            // Si le point de contact est au-delà de l'ouverture de la porte, c'est un "hit"
            if (wall_x >= doors[i].open_offset) {
              door_is_solid = true;
            }
            break;
          }
        }
        if (door_is_solid) {
          hit = true;
        }
      } else {
         if (block_hit == E_ENEMY || (block_hit & 0b00001000)) {
          if (coords_distance(&(player.pos), &map_coords) < MAX_ENTITY_DISTANCE) {
            UID uid = create_uid(block_hit, map_x, map_y);
            if (last_uid != uid && !isSpawned(uid)) {
              spawnEntity(block_hit, map_x, map_y);
              last_uid = uid;
            }
          }
        }
      }
    }

    if (hit) {
      double distance;
      if (side == 0) distance = max(1.0, (map_x - player.pos.x + (1 - step_x) / 2) / ray_x);
      else distance = max(1.0, (map_y - player.pos.y + (1 - step_y) / 2) / ray_y);
      
      zbuffer[x / Z_RES_DIVIDER] = min((double)(distance * DISTANCE_MULTIPLIER), 255.0);
      uint8_t line_height = RENDER_HEIGHT / distance;
      uint8_t intensity;
      uint8_t block = getBlockAt(level, map_x, map_y);

      switch (block) {
        case E_DOOR: intensity = DOOR_TEXTURE; break;
        case E_LOCKEDDOOR: intensity = LOCKED_DOOR_TEXTURE; break;
        default: intensity = GRADIENT_COUNT - int(distance / MAX_RENDER_DEPTH * GRADIENT_COUNT) - side * 2; break;
      }
      drawVLine(x, view_height / distance - line_height / 2 + RENDER_HEIGHT / 2, view_height / distance + line_height / 2 + RENDER_HEIGHT / 2, intensity);
    }
  }
}

void updateDoors() {
  for (uint8_t i = 0; i < num_doors; i++) {
    
    switch(doors[i].state) {
      
      case S_DOOR_OPENING:
        // La porte est en train de s'ouvrir
        doors[i].open_offset += DOOR_SPEED * delta;
        if (doors[i].open_offset >= 1.0f) {
          doors[i].open_offset = 1.0f;
          doors[i].state = S_DOOR_OPEN;
          doors[i].timer = DOOR_OPEN_TIME; // On lance le minuteur !
        }
        break;

      case S_DOOR_OPEN:
        // La porte est ouverte, on décompte le temps
        if (doors[i].timer > 0) {
          doors[i].timer--;
        } else {
          // Le temps est écoulé, on commence à fermer la porte
          doors[i].state = S_DOOR_CLOSING;
        }
        break;

      case S_DOOR_CLOSING:
        // La porte est en train de se fermer
        doors[i].open_offset -= DOOR_SPEED * delta;
        if (doors[i].open_offset <= 0.0f) {
          doors[i].open_offset = 0.0f;
          doors[i].state = S_DOOR_CLOSED;
        }
        break;

      // Pas besoin de case pour S_DOOR_CLOSED, car la porte ne fait rien.
    }
  }
}

// Sort entities from far to close
// La fonction renvoie void maintenant
void sortEntities() {
  uint8_t gap = num_entities;
  bool swapped = false;
  while (gap > 1 || swapped) {
    gap = (gap * 10) / 13;
    if (gap == 9 || gap == 10) gap = 11;
    if (gap < 1) gap = 1;
    swapped = false;
    for (uint8_t i = 0; i < num_entities - gap; i++)
    {
      uint8_t j = i + gap;
      if (entity[i].distance < entity[j].distance)
      {
        swap(entity[i], entity[j]);
        swapped = true;
      }
    }
  }
}

Coords translateIntoView(Coords *pos) {
  //translate sprite position to relative to camera
  double sprite_x = pos->x - player.pos.x;
  double sprite_y = pos->y - player.pos.y;

  //required for correct matrix multiplication
  double inv_det = 1.0 / (player.plane.x * player.dir.y - player.dir.x * player.plane.y);
  double transform_x = inv_det * (player.dir.y * sprite_x - player.dir.x * sprite_y);
  double transform_y = inv_det * (- player.plane.y * sprite_x + player.plane.x * sprite_y); // Z in screen

  return { transform_x, transform_y };
}

void renderEntities(double view_height) {
  sortEntities();

  for (uint8_t i = 0; i < num_entities; i++) {
    if (entity[i].state == S_HIDDEN) continue;

    Coords transform = translateIntoView(&(entity[i].pos));

    // don´t render if behind the player or too far away
    if (transform.y <= 0.1 || transform.y > MAX_SPRITE_DEPTH) {
      continue;
    }

    int16_t sprite_screen_x = HALF_WIDTH * (1.0 + transform.x / transform.y);
    int8_t sprite_screen_y = RENDER_HEIGHT / 2 + view_height / transform.y;
    uint8_t type = uid_get_type(entity[i].uid);

    // don´t try to render if outside of screen
    // doing this pre-shortcut due int16 -> int8 conversion makes out-of-screen
    // values fit into the screen space
    if (sprite_screen_x < - HALF_WIDTH || sprite_screen_x > SCREEN_WIDTH + HALF_WIDTH) {
      continue;
    }

    switch (type) {
      case E_ENEMY: {
          uint8_t sprite;
          if (entity[i].state == S_ALERT) {
            // walking
            sprite = int(millis() / 500) % 2;
          } else if (entity[i].state == S_FIRING) {
            // fireball
            sprite = 2;
          } else if (entity[i].state == S_HIT) {
            // hit
            sprite = 3;
          } else if (entity[i].state == S_MELEE) {
            // melee atack
            sprite = entity[i].timer > 10 ? 2 : 1;
          } else if (entity[i].state == S_DEAD) {
            // dying
            sprite = entity[i].timer > 0 ? 3 : 4;
          } else {
            // stand
            sprite = 0;
          }

          drawSprite(
            sprite_screen_x - BMP_IMP_WIDTH * .5 / transform.y,
            sprite_screen_y - 8 / transform.y,
            bmp_imp_bits,
            bmp_imp_mask,
            BMP_IMP_WIDTH,
            BMP_IMP_HEIGHT,
            sprite,
            transform.y
          );
          break;
        }

      case E_FIREBALL: {
          drawSprite(
            sprite_screen_x - BMP_FIREBALL_WIDTH / 2 / transform.y,
            sprite_screen_y - BMP_FIREBALL_HEIGHT / 2 / transform.y,
            bmp_fireball_bits,
            bmp_fireball_mask,
            BMP_FIREBALL_WIDTH,
            BMP_FIREBALL_HEIGHT,
            0,
            transform.y
          );
          break;
        }

      case E_MEDIKIT: {
          drawSprite(
            sprite_screen_x - BMP_ITEMS_WIDTH / 2 / transform.y,
            sprite_screen_y + 5 / transform.y,
            bmp_items_bits,
            bmp_items_mask,
            BMP_ITEMS_WIDTH,
            BMP_ITEMS_HEIGHT,
            0,
            transform.y
          );
          break;
        }

      case E_KEY: {
          drawSprite(
            sprite_screen_x - BMP_ITEMS_WIDTH / 2 / transform.y,
            sprite_screen_y + 5 / transform.y,
            bmp_items_bits,
            bmp_items_mask,
            BMP_ITEMS_WIDTH,
            BMP_ITEMS_HEIGHT,
            1,
            transform.y
          );
          break;
        }
    }
  }
}

void renderGun(uint8_t gun_pos, double amount_jogging) {
  // Le calcul de la position du pistolet reste le même
  char x = 48 + sin((double) millis() * JOGGING_SPEED) * 10 * amount_jogging;
  char y = RENDER_HEIGHT - gun_pos + abs(cos((double) millis() * JOGGING_SPEED)) * 8 * amount_jogging;

  // --- DESSIN MANUEL DU FEU ---
  if (gun_pos > GUN_SHOT_POS - 2) {
    // On remplace u8g2.drawXBM par notre propre boucle pour gérer la transparence
    int16_t fire_x = x + 6;
    int16_t fire_y = y - 11;
    int16_t fire_w = BMP_FIRE_WIDTH;
    int16_t fire_h = BMP_FIRE_HEIGHT;
    // La largeur en octets est la largeur en pixels divisée par 8
    int16_t byteWidth = (fire_w + 7) / 8;

    for (int16_t j = 0; j < fire_h; j++) {
      // On ne dessine pas les lignes en dehors de l'écran
      if (fire_y + j < 0 || fire_y + j >= RENDER_HEIGHT) continue;

      for (int16_t i = 0; i < fire_w; i++) {
        // On ne dessine pas les pixels en dehors de l'écran
        if (fire_x + i < 0 || fire_x + i >= SCREEN_WIDTH) continue;

        // On lit le bit correspondant dans le sprite
        uint16_t byte_offset = j * byteWidth + i / 8;
        bool pixel = read_bit(pgm_read_byte(bmp_fire_bits + byte_offset), i % 8);

        // Si le pixel est allumé (1), on le dessine. Sinon, on ne fait rien (transparent).
        if (pixel) {
          u8g2.drawPixel(fire_x + i, fire_y + j);
        }
      }
    }
  }
  // --- FIN DESSIN MANUEL DU FEU ---

  // Le dessin du pistolet lui-même reste inchangé
  int16_t w = BMP_GUN_WIDTH;
  int16_t h = BMP_GUN_HEIGHT;
  int16_t byteWidth = w / 8;

  // On parcourt chaque pixel du sprite du pistolet
  for (int16_t j = 0; j < h; j++) {
    if (y + j < 0 || y + j >= RENDER_HEIGHT) {
      continue;
    }

    for (int16_t i = 0; i < w; i++) {
      uint16_t byte_offset = j * byteWidth + i / 8;
      
      bool maskPixel = read_bit(pgm_read_byte(bmp_gun_mask + byte_offset), i % 8);

      if (maskPixel) { // Si le pixel n'est pas transparent
        bool spritePixel = read_bit(pgm_read_byte(bmp_gun_bits + byte_offset), i % 8);

        if (spritePixel) {
          // Si le pixel du sprite est blanc (1), on le dessine
          u8g2.drawPixel(x + i, y + j);
        } else {
          // Si le pixel du sprite est noir (0), on dessine un pixel noir
          u8g2.setDrawColor(0);
          u8g2.drawPixel(x + i, y + j);
          u8g2.setDrawColor(1); // On remet la couleur à blanc pour le pixel suivant
        }
      }
    }
  }
}

// Only needed first time
void renderHud() {
  // On appelle la nouvelle fonction avec les caractères spéciaux
  // pour dessiner les icônes de la police personnalisée.
  drawCustomChar(2, 58, '{');  // Affiche l'icône '+' de santé
  drawCustomChar(2 + CHAR_WIDTH, 58, '}');
  drawCustomChar(40, 58, '['); // Affiche l'icône de clé
  drawCustomChar(40 + CHAR_WIDTH, 58, ']');

  // Le reste de la fonction est inchangé, elle dessine les nombres par-dessus
  u8g2.setDrawColor(0);
  u8g2.drawBox(12, 58, 15, 6);
  u8g2.drawBox(50, 58, 5, 6);
  u8g2.setDrawColor(1);

  // La fonction standard drawText continue d'utiliser la police de U8g2 pour les chiffres
  drawText(12, 58, player.health);
  drawText(50, 58, player.keys);
}

// Debug stats
void renderStats() {
  u8g2.setDrawColor(0);
  u8g2.drawBox(58, 58, 50, 6);
  u8g2.setDrawColor(1);
  
  drawText(114, 58, (int)getActualFps());
  drawText(82, 58, num_entities);
}

void loopIntro() {
  // --- ÉTAPE 1: Écran noir au début ---
  u8g2.clearBuffer();
  u8g2.sendBuffer();
  delay(1500); // Pause de 1.5 secondes sur un écran noir

  // --- ÉTAPE 2: Animation de fondu pour le logo ---
  // On fait une boucle qui va de l'intensité maximale du fondu à zéro
  for (int8_t i = GRADIENT_COUNT - 1; i >= 0; i--) {
    u8g2.clearBuffer(); // On efface l'écran à chaque image de l'animation
    
    // On dessine le logo en arrière-plan
    u8g2.drawXBM(
      (SCREEN_WIDTH - BMP_LOGO_WIDTH) / 2,
      (SCREEN_HEIGHT - BMP_LOGO_HEIGHT) / 3,
      BMP_LOGO_WIDTH,
      BMP_LOGO_HEIGHT,
      bmp_logo_bits
    );

    // On dessine par-dessus un "voile" noir qui devient de plus en plus transparent
    fadeScreen(i, 0); 
    
    u8g2.sendBuffer(); // On affiche l'image
    delay(60); // Contrôle la vitesse du fondu
  }

  // --- ÉTAPE 3: Affichage de l'écran final avec le texte ---
  // On redessine une dernière fois l'écran complet, avec le logo bien visible et le texte
  u8g2.clearBuffer();
  u8g2.drawXBM(
    (SCREEN_WIDTH - BMP_LOGO_WIDTH) / 2,
    (SCREEN_HEIGHT - BMP_LOGO_HEIGHT) / 3,
    BMP_LOGO_WIDTH,
    BMP_LOGO_HEIGHT,
    bmp_logo_bits
  );
  drawText(SCREEN_WIDTH / 2 - 25, SCREEN_HEIGHT * .8, "PRESS FIRE", 1);
  u8g2.sendBuffer();
  
  // --- ÉTAPE 4: Attente de l'action du joueur et transition ---
  while (!exit_scene) {
    #ifdef SNES_CONTROLLER
    getControllerData();
    #endif

    if (input_fire()) {
      // Animation de chute du logo
      for (int16_t y = (SCREEN_HEIGHT - BMP_LOGO_HEIGHT) / 3; y < SCREEN_HEIGHT; y += 4) {
        u8g2.clearBuffer();
        u8g2.drawXBM(
          (SCREEN_WIDTH - BMP_LOGO_WIDTH) / 2,
          y,
          BMP_LOGO_WIDTH,
          BMP_LOGO_HEIGHT,
          bmp_logo_bits
        );
        u8g2.sendBuffer();
        delay(15);
      }
      
      jumpTo(OPTIONS); // MODIFIÉ: Anciennement jumpTo(GAME_PLAY); 
    }
    
    delay(10);
  }
}


// ===================================
// ==        BOUCLE DE JEU          ==
// ===================================
void loopGamePlay() {
  bool gun_fired = false;
  bool walkSoundToggle = false;
  uint8_t gun_pos = 0;
  double rot_speed;
  double old_dir_x;
  double old_plane_x;
  double view_height = 0; // Initialisation
  double jogging = 0;     // Initialisation
  uint8_t fade = GRADIENT_COUNT - 1;

  // Charger le niveau actuel
  initializeLevel(all_levels[current_level_index]);

  do {
    fps();

    #ifdef SNES_CONTROLLER
    getControllerData();
    #endif

    // --- LOGIQUE D'AFFICHAGE DE LA CARTE ---
    // Si le bouton "carte" est maintenu, on affiche la carte et on saute le reste
    if (input_map()) {
      renderTopDownMap();
      continue; // On passe directement à la prochaine itération de la boucle
    }
    // --- FIN DE LA LOGIQUE ---

    u8g2.clearBuffer();

    // Si le joueur est en vie
    if (player.health > 0) {
      // Logique de vitesse du joueur

      // --- LOGIQUE POUR L'INVERSION DE L'AXE Y ---
      bool move_forward = y_axis_inverted ? input_down() : input_up();
      bool move_backward = y_axis_inverted ? input_up() : input_down();
      
      // Logique de vitesse du joueur
      if (move_forward) { // Remplacer input_up() par move_forward
        player.velocity += (MOV_SPEED - player.velocity) * .4;
        jogging = abs(player.velocity) * MOV_SPEED_INV;
      } else if (move_backward) { // Remplacer input_down() par move_backward
        player.velocity += (-MOV_SPEED - player.velocity) * .4;
        jogging = abs(player.velocity) * MOV_SPEED_INV;
      } else { //
      // ... reste de la logique
        player.velocity *= .5;
        jogging = abs(player.velocity) * MOV_SPEED_INV;
      }

      // Logique de rotation du joueur
      if (input_right()) {
        rot_speed = ROT_SPEED * delta;
        old_dir_x = player.dir.x;
        player.dir.x = player.dir.x * cos(-rot_speed) - player.dir.y * sin(-rot_speed);
        player.dir.y = old_dir_x * sin(-rot_speed) + player.dir.y * cos(-rot_speed);
        old_plane_x = player.plane.x;
        player.plane.x = player.plane.x * cos(-rot_speed) - player.plane.y * sin(-rot_speed);
        player.plane.y = old_plane_x * sin(-rot_speed) + player.plane.y * cos(-rot_speed);
      } else if (input_left()) {
        rot_speed = ROT_SPEED * delta;
        old_dir_x = player.dir.x;
        player.dir.x = player.dir.x * cos(rot_speed) - player.dir.y * sin(rot_speed);
        player.dir.y = old_dir_x * sin(rot_speed) + player.dir.y * cos(rot_speed);
        old_plane_x = player.plane.x;
        player.plane.x = player.plane.x * cos(rot_speed) - player.plane.y * sin(rot_speed);
        player.plane.y = old_plane_x * sin(rot_speed) + player.plane.y * cos(rot_speed);
      }

      view_height = abs(sin((double) millis() * JOGGING_SPEED)) * 6 * jogging;

      if(view_height > 5.9) {
        if(sound_is_playing == false) {
          if(walkSoundToggle) {
            playSound(walk1_snd, WALK1_SND_LEN);
            walkSoundToggle = false;
          } else {
            playSound(walk2_snd, WALK2_SND_LEN);
            walkSoundToggle = true;
          }
        }
      }
      
      // Logique de l'arme
      if (gun_pos > GUN_TARGET_POS) {
        gun_pos -= 1;
      } else if (gun_pos < GUN_TARGET_POS) {
        gun_pos += 2;
      } else if (!gun_fired && input_fire()) {
        gun_pos = GUN_SHOT_POS;
        gun_fired = true;
        fire();
      } else if (gun_fired && !input_fire()) {
        gun_fired = false;
      }
    
    // --- DÉBUT DU BLOC DE MORT ---
    } else {
      // Le joueur est mort
      if (view_height > -10) {
        // L'animation de chute est en cours
        view_height--;
      } else {
        // L'animation est finie, on ajoute une pause
        delay(2000); // Délai de 2000 millisecondes (2 secondes)
        
        // On retourne au menu
        jumpTo(INTRO);
      }
      
      // L'animation du pistolet continue pendant la chute
      if (gun_pos > 1) gun_pos -= 2;
    } 
    // --- FIN DU BLOC DE MORT ---
    
    // Mouvement du joueur
    if (abs(player.velocity) > 0.003) {
      updatePosition(
        sto_level_1,
        &(player.pos),
        player.dir.x * player.velocity * delta,
        player.dir.y * player.velocity * delta
      );
    } else {
      player.velocity = 0;
    }

    // Mises à jour
    updateSound();
    updateEntities(sto_level_1);
    updateDoors();

    // Rendu
    renderMap(sto_level_1, view_height);
    renderEntities(view_height);
    renderGun(gun_pos, jogging);

    // Effet de fondu
    if (fade > 0) {
      fadeScreen(fade);
      fade--;
    } else {
      renderMessage();
      renderHud();
      renderStats();
    }

    // Effet de flash
    if (flash_screen > 0) {
      u8g2.setDrawColor(1);
      u8g2.drawBox(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      flash_screen--;
    }

    // Envoyer l'image à l'écran
    u8g2.sendBuffer();

    // Routine de sortie
    #ifdef SNES_CONTROLLER
    if (input_start()) {
    #else
    if (input_left() && input_right()) {
    #endif
      jumpTo(INTRO);
    }
  } while (!exit_scene);
}

// ===================================
// ==   BOUCLE DU MENU D'OPTIONS    ==
// ===================================
void renderOptionsMenu() { // Fonction pour dessiner le menu
    // Titre
    drawText(SCREEN_WIDTH / 2 - 22, 10, "OPTIONS");

    // Options
    const char* option_names[] = {"SON", "INVERSER Y", "COMMENCER"};
    
    for (uint8_t i = 0; i < num_options; i++) {
        int y_pos = 25 + i * 10;
        
        // Affiche un curseur '#' devant l'option sélectionnée
        if (i == selected_option) {
            drawText(30, y_pos, "#");
        }

        drawText(40, y_pos, option_names[i]);

        // Affiche l'état de l'option (ON/OFF)
        if (i == 0) { // Option SON
            drawText(90, y_pos, sound_enabled ? " ON" : " OFF");
        } else if 
          (i == 1) { // Option INVERSER Y
            drawText(90, y_pos, y_axis_inverted ? " ON" : " OFF");
        }
    }
}

// Boucle principale du menu
void loopOptions() {
    selected_option = 0; // On réinitialise la sélection à chaque entrée dans le menu

    do {
        fps();

        // Gestion des entrées
        if (input_down()) {
            selected_option = (selected_option + 1) % num_options;
            delay(150); // Petit délai pour éviter les sélections trop rapides
        }
        if (input_up()) {
            selected_option = (selected_option == 0) ? num_options - 1 : selected_option - 1;
            delay(150); // Petit délai
        }

        if (input_fire()) {
            switch (selected_option) {
                case 0: // Activer/Désactiver le son
                    sound_enabled = !sound_enabled;
                    break;
                case 1: // Inverser l'axe Y
                    y_axis_inverted = !y_axis_inverted;
                    break;
                case 2: // Commencer le jeu
                    jumpTo(GAME_PLAY);
                    break;
            }
            delay(200); // Délai pour éviter de double-cliquer
        }
        
        // Rendu
        u8g2.clearBuffer();
        renderOptionsMenu();
        u8g2.sendBuffer();

    } while (!exit_scene);
}

void openDoor(uint8_t door_index) {
  // On ne fait quelque chose que si la porte est bien fermée
  if (doors[door_index].state == S_DOOR_CLOSED) {
    // S'il s'agit d'une porte verrouillée
    if (doors[door_index].type == E_LOCKEDDOOR) {
      if (player.keys > 0) {
        player.keys--; // On utilise une clé
        renderHud();
        doors[door_index].state = S_DOOR_OPENING; // On lance l'animation d'ouverture
        // playSound(unlock_snd...); // On pourrait jouer un son de déverrouillage
      } else {
        // --- On affiche le message ---
        strcpy(hud_message, "YOU NEED A KEY");
        message_timer_end = millis() + 2000; // Affiche pendant 2 secondes

        // playSound(locked_snd...); // Son de porte verrouillée
      }
    } else { // C'est une porte normale
      doors[door_index].state = S_DOOR_OPENING;
      // playSound(open_snd...); // Son d'ouverture de porte
    }
  }
}

void renderMessage() {
  // On vérifie si un message doit être affiché
  if (millis() < message_timer_end) {
    // Calcul pour centrer le texte
    int msg_len = strlen(hud_message);
    // Largeur de chaque caractère (4px) + espacement (1px)
    int text_width = msg_len * (CHAR_WIDTH + 1) - 1;
    int text_x = (SCREEN_WIDTH - text_width) / 2;
    
    // On dessine le texte en haut de l'écran
    drawText(text_x, 2, hud_message); 
  }
}

void renderTopDownMap() {
  u8g2.clearBuffer();

  // On dessine la carte à une échelle de 1 pixel par case.
  // La carte fait 64x57, l'écran 128x64. On la centre.
  const int offsetX = (SCREEN_WIDTH - LEVEL_WIDTH) / 2;
  const int offsetY = (SCREEN_HEIGHT - LEVEL_HEIGHT) / 2;

  // 1. Dessiner la structure du niveau (murs, portes)
  for (int y = 0; y < LEVEL_HEIGHT; y++) {
    for (int x = 0; x < LEVEL_WIDTH; x++) {
      uint8_t block = getBlockAt(all_levels[current_level_index], x, y);
      if (block == E_WALL || block == E_DOOR || block == E_LOCKEDDOOR) {
        // On dessine un pixel blanc pour chaque mur ou porte
        u8g2.drawPixel(x + offsetX, y + offsetY);
      }
    }
  }

  // 2. Dessiner les ennemis
  u8g2.setDrawColor(1); // S'assurer que la couleur est blanche
  for (int i = 0; i < num_entities; i++) {
    uint8_t type = uid_get_type(entity[i].uid);
    if (type == E_ENEMY && entity[i].state != S_DEAD) {
      int enemyX = entity[i].pos.x;
      int enemyY = entity[i].pos.y;
      // On dessine un pixel pour chaque ennemi
      u8g2.drawPixel(enemyX + offsetX, enemyY + offsetY);
    }
  }

  // 3. Dessiner le joueur
  int playerX = player.pos.x;
  int playerY = player.pos.y;
  // On dessine une petite croix de 3x3 pour bien voir le joueur
  u8g2.drawHLine(playerX + offsetX - 1, playerY + offsetY, 3);
  u8g2.drawVLine(playerX + offsetX, playerY + offsetY - 1, 3);

  u8g2.sendBuffer();
}

void loop(void) {
  uint8_t scene_before = scene;

  switch (scene) {
    case INTRO: {           // <-- BLOC INTRO
        loopIntro();
        break;
      }
    case GAME_PLAY: {       // <-- BLOC GAME_PLAY
        loopGamePlay();
        break;
      }
    case OPTIONS: {         // <-- BLOC OPTIONS
        loopOptions();
        break;
    }      
    case NEXT_LEVEL: {      // <-- BLOC NEXT_LEVEL

        // Effet de fondu enchaîné vers le noir entre les niveaux
        for (uint8_t i = 0; i < GRADIENT_COUNT; i++) {
            fadeScreen(i, 0);
            u8g2.sendBuffer();
            delay(40);
        }

        // On incrémente le niveau SEULEMENT APRÈS le fondu
        current_level_index++;
        
        // On vérifie si c'était le dernier niveau
        if (current_level_index >= MAX_LEVELS) {
          // Si oui, on retourne au menu principal
          scene = INTRO;
        } else {
          // Sinon, on charge le niveau suivant
          scene = GAME_PLAY;
        }
        break;
    }
  }

  // On ne fait l'effet de fondu que si on meurt ou qu'on quitte manuellement
  if (scene_before == GAME_PLAY && scene == INTRO) {
      for (uint8_t i=0; i<GRADIENT_COUNT; i++) {
        fadeScreen(i, 0);
        u8g2.sendBuffer();
        delay(40);
      }
  }
  
  exit_scene = false;
}
