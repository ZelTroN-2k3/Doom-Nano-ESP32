#ifndef _types_h
#define _types_h

#define UID_null  0


// Entity types (legend applies to level.h)
#define E_FLOOR             0x0   // . : Le sol (Floor)
#define E_WALL              0xF   // # : Un mur (Wall)
#define E_SECRET_WALL       0x6   // S : Un mur secret (Secret Wall)

#define E_PLAYER            0x1   // P : La position de départ du joueur (Player)
#define E_PLAYER_NORTH      0x1   // ^ : Haut (On réutilise la valeur de E_PLAYER)
#define E_PLAYER_EAST       0xB   // > : Droite
#define E_PLAYER_SOUTH      0xC   // v : Bas
#define E_PLAYER_WEST       0xD   // < : Gauche

#define E_ENEMY             0x2   // E : Un ennemi (Enemy)

#define E_DOOR              0x4   // D : Une porte (Door)
#define E_LOCKEDDOOR        0x5   // L : Une porte verrouillée (Locked Door)
#define E_EXIT              0x7   // X : La sortie du niveau (Exit)
// collectable entities >= 0x8
#define E_MEDIKIT           0x8   // M : Un kit de soin (Medikit)
#define E_KEY               0x9   // K : Une clé (Key)
#define E_FIREBALL          0xA   // not in map

typedef uint16_t UID;
typedef uint8_t  EType;

struct Coords {
  double x;
  double y;
};

UID create_uid(EType type, uint8_t x, uint8_t y);
EType uid_get_type(UID uid);

Coords create_coords(double x, double y);
uint8_t coords_distance(Coords* a, Coords* b);

#endif

