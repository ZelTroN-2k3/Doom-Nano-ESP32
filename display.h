#ifndef _display_h
#define _display_h

#include <U8g2lib.h>
#include "constants.h"
#include "sprites.h"

// ===============================================================
// ==        INITIALISATION DE L'ÉCRAN U8G2 (ST7920)            ==
// ===============================================================
// Utilisation du constructeur Software SPI qui fonctionne pour vous.
U8G2_ST7920_128X64_F_SW_SPI u8g2(U8G2_R0, /* clock=*/ LCD_CLOCK_PIN, /* data=*/ LCD_DATA_PIN, /* cs=*/ LCD_CS_PIN, /* reset=*/ LCD_RST_PIN);


// ===============================================================
// ==                   VARIABLES GLOBALES                      ==
// ===============================================================
// FPS control
double delta = 1;
uint32_t lastFrameTime = 0;

// Z-buffer pour la profondeur des objets
uint8_t zbuffer[ZBUFFER_SIZE];

// Déclaration de bit_mask et read_bit en portée globale du fichier
const static uint8_t PROGMEM bit_mask[8] = { 128, 64, 32, 16, 8, 4, 2, 1 };
#define read_bit(b, n)      ((b) & pgm_read_byte(bit_mask + (n)) ? 1 : 0)

// ===============================================================
// ==                 FONCTIONS DE DESSIN                       ==
// ===============================================================

// --- Texte personnalisé (style pixel) ---
void drawCustomChar(int8_t x, int8_t y, char ch) {
  uint8_t c = 0;
  uint8_t n;
  uint8_t bOffset;
  uint8_t b;
  uint8_t line = 0;

  while (CHAR_MAP[c] != ch && CHAR_MAP[c] != '\0') c++;

  bOffset = c / 2;
  for (; line < CHAR_HEIGHT; line++) {
    b = pgm_read_byte(bmp_font + (line * bmp_font_width + bOffset));
    for (n = 0; n < CHAR_WIDTH; n++)
      if (read_bit(b, (c % 2 == 0 ? 0 : 4) + n))
        u8g2.drawPixel(x + n, y + line);
  }
}

void drawText(int8_t x, int8_t y, const char *txt, uint8_t space = 1) {
  uint8_t pos = x;
  uint8_t i = 0;
  char ch;
  while ((ch = txt[i]) != '\0') {
    drawCustomChar(pos, y, ch);
    i++;
    pos += CHAR_WIDTH + space;
    if (pos > SCREEN_WIDTH) return;
  }
}

void drawText(int8_t x, int8_t y, int num) {
  char buf[5];
  itoa(num, buf, 10);
  drawText(x, y, buf, 1);
}

bool getGradientPixel(uint8_t x, uint8_t y, uint8_t i) {
  // --- LOGIQUE POUR LES TEXTURES DE PORTES ---
  // Si l'identifiant est celui d'une porte normale, on dessine un damier
  if (i == DOOR_TEXTURE) {
    // L'opérateur XOR (^) crée un motif de damier.
    // On peut changer les chiffres (ex: % 8 < 4) pour changer la taille des carrés.
    return ((x % 4 < 2) ^ (y % 4 < 2));
  }
  // Si c'est une porte verrouillée, on dessine des lignes verticales
  if (i == LOCKED_DOOR_TEXTURE) {
    return (x % 4 < 2);
  }
  // --- FIN DE LA LOGIQUE ---

  // L'ancienne logique pour les dégradés de gris reste la même
  if (i == 0) return 0;
  if (i >= GRADIENT_COUNT - 1) return 1;
  
  // On s'assure que les types sont les mêmes pour min() et max()
  uint8_t intensity = max((uint8_t)0, min((uint8_t)(GRADIENT_COUNT - 1), i));
  
  uint8_t index = intensity * GRADIENT_WIDTH * GRADIENT_HEIGHT
                  + y * GRADIENT_WIDTH % (GRADIENT_WIDTH * GRADIENT_HEIGHT)
                  + x / GRADIENT_HEIGHT % GRADIENT_WIDTH;
                  
  return read_bit(pgm_read_byte(gradient + index), x % 8);
}

void drawPixel(int8_t x, int8_t y, bool color) {
  // Le compilateur avait raison, les conditions x<0 et y<0 étaient inutiles avec des uint8_t.
  // La signature de la fonction a été changée pour int8_t pour rester cohérent.
  if (x < 0 || x >= SCREEN_WIDTH || y < 0 || y >= SCREEN_HEIGHT) {
    return;
  }
  if (color) {
    u8g2.drawPixel(x, y);
  }
}

void drawVLine(uint8_t x, int8_t start_y, int8_t end_y, uint8_t intensity) {
  // On s'assure que les types sont les mêmes pour min() et max()
  int8_t lower_y = max((int8_t)0, min(start_y, end_y));
  int8_t higher_y = min((int8_t)(RENDER_HEIGHT - 1), max(start_y, end_y));

  for (int8_t y = lower_y; y <= higher_y; y++) {
    for (uint8_t c = 0; c < RES_DIVIDER; c++) {
      if (getGradientPixel(x + c, y, intensity)) {
        u8g2.drawPixel(x + c, y);
      }
    }
  }
}

void drawSprite(
  int16_t x, int16_t y,
  const uint8_t bitmap[], const uint8_t mask[],
  int16_t w, int16_t h,
  uint8_t sprite,
  double distance
) {
  uint8_t z_x = max((int16_t)0, min((int16_t)(ZBUFFER_SIZE - 1), x));
  if (zbuffer[z_x / Z_RES_DIVIDER] < distance * DISTANCE_MULTIPLIER) {
    return;
  }
  
  int16_t tw = (double) w / distance;
  int16_t th = (double) h / distance;

  if (tw < 1 || th < 1) return;

  uint8_t pixel_size = max(1.0, 1.0 / distance);
  uint16_t sprite_offset = (w/8) * h * sprite;

  for (uint8_t ty = 0; ty < th; ty += pixel_size) {
    if (y + ty < 0 || y + ty >= RENDER_HEIGHT) continue;
    uint8_t sy = ty * distance;

    for (uint8_t tx = 0; tx < tw; tx += pixel_size) {
      if (x + tx < 0 || x + tx >= SCREEN_WIDTH) continue;
      
      uint8_t sx = tx * distance;
      uint16_t byte_offset = sprite_offset + sy * (w/8) + sx / 8;
      
      bool maskPixel = read_bit(pgm_read_byte(mask + byte_offset), sx % 8);
      if (maskPixel) {
        bool spritePixel = read_bit(pgm_read_byte(bitmap + byte_offset), sx % 8);

        if (spritePixel) {
          // Si le pixel du sprite est blanc (1), on le dessine (la couleur par défaut est 1)
          for (uint8_t ox = 0; ox < pixel_size; ox++) {
            for (uint8_t oy = 0; oy < pixel_size; oy++) {
               u8g2.drawPixel(x + tx + ox, y + ty + oy);
            }
          }
        } else {
          // Si le pixel du sprite est noir (0), on change la couleur, on dessine, et on la remet.
          u8g2.setDrawColor(0); // Passer en mode "dessin noir"
          for (uint8_t ox = 0; ox < pixel_size; ox++) {
            for (uint8_t oy = 0; oy < pixel_size; oy++) {
               u8g2.drawPixel(x + tx + ox, y + ty + oy);
            }
          }
          u8g2.setDrawColor(1); // Remettre la couleur par défaut à "blanc"
        }
      }
    }
  }
}

void fadeScreen(uint8_t intensity, bool color = 0) {
    u8g2.setDrawColor(color ? 1 : 0);
    for (uint8_t x = 0; x < SCREEN_WIDTH; x++) {
        for (uint8_t y = 0; y < SCREEN_HEIGHT; y++) {
            if (getGradientPixel(x, y, intensity)) {
                u8g2.drawPixel(x, y);
            }
        }
    }
    u8g2.setDrawColor(1); // Remettre la couleur par défaut
}

// ===============================================================
// ==                 AUTRES FONCTIONS GRAPHIQUES               ==
// ===============================================================
void setupDisplay() {
  u8g2.begin();
  //u8g2.setFont(u8g2_font_tom_thumb_4x6_tr); 
  u8g2.setFontPosTop();
  memset(zbuffer, 0xFF, ZBUFFER_SIZE);
}

void fps() {
  while (millis() - lastFrameTime < FRAME_TIME);
  delta = (double)(millis() - lastFrameTime) / FRAME_TIME;
  lastFrameTime = millis();
}

double getActualFps() {
  return 1000 / (FRAME_TIME * delta);
}


#endif
