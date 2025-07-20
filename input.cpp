#include <Arduino.h>
#include "input.h"
#include "constants.h"

// ##################################################################
// ###                  LOGIQUE POUR LE JOYSTICK                  ###
// ##################################################################
#if defined(USE_JOYSTICK)

const int JOY_THRESHOLD_LOW = 1000;
const int JOY_THRESHOLD_HIGH = 3000;

void input_setup() {
  pinMode(JOY_SW_PIN, INPUT_PULLUP);
}

bool input_up() {
  return analogRead(JOY_Y_PIN) > JOY_THRESHOLD_HIGH; 
}

bool input_down() {
  return analogRead(JOY_Y_PIN) < JOY_THRESHOLD_LOW;
}

bool input_left() {
  // La gauche correspond à une valeur analogique basse
  return analogRead(JOY_X_PIN) < JOY_THRESHOLD_LOW;
}

bool input_right() {
  // La droite correspond à une valeur analogique haute
  return analogRead(JOY_X_PIN) > JOY_THRESHOLD_HIGH;
}

bool input_fire() {
  return digitalRead(JOY_SW_PIN) == LOW;
}

// On définit l'action "carte" comme étant TIRER et BAS en même temps
bool input_map() {
  return input_fire() && input_down();
}

// Fonctions factices pour la compatibilité si SNES_CONTROLLER est défini ailleurs
#ifdef SNES_CONTROLLER
bool input_start() { return false; }
void getControllerData(void) {}
#endif


// ##################################################################
// ###               LOGIQUE POUR LA MANETTE SNES                 ###
// ##################################################################
#elif defined(USE_SNES_CONTROLLER)

uint16_t buttons = 0;

void input_setup() {
  pinMode(DATA_CLOCK, OUTPUT);
  digitalWrite(DATA_CLOCK, HIGH);
  pinMode(DATA_LATCH, OUTPUT);
  digitalWrite(DATA_LATCH, LOW);
  pinMode(DATA_SERIAL, INPUT);
}

void getControllerData(void){
  digitalWrite(DATA_LATCH, HIGH);
  delayMicroseconds(12);
  digitalWrite(DATA_LATCH, LOW);
  delayMicroseconds(6);
  
  buttons = 0;
  for(uint8_t i = 0; i < 16; ++i){
    digitalWrite(DATA_CLOCK, LOW);
    delayMicroseconds(6);
    // Note pour l'ESP32 : digitalRead peut être lent. Si la lecture est instable,
    // des lectures plus directes du registre GPIO pourraient être nécessaires.
    // Mais pour commencer, ceci devrait fonctionner.
    if (!digitalRead(DATA_SERIAL)) {
      buttons |= (1 << i);
    }
    digitalWrite(DATA_CLOCK, HIGH);
    delayMicroseconds(6);
  }
}

bool input_left()   { return buttons & LEFT; }
bool input_right()  { return buttons & RIGHT; }
bool input_up()     { return buttons & UP; }
bool input_down()   { return buttons & DOWN; }
bool input_fire()   { return buttons & Y; } // Le bouton Y est utilisé pour le tir
bool input_start()  { return buttons & START; }


// ##################################################################
// ###                 LOGIQUE POUR LES BOUTONS                   ###
// ##################################################################
#else // Par défaut: USE_BUTTONS

#ifdef USE_INPUT_PULLUP
  #define INPUT_MODE INPUT_PULLUP
  #define INPUT_STATE LOW
#else
  #define INPUT_MODE INPUT
  #define INPUT_STATE HIGH
#endif

void input_setup() {
  pinMode(K_LEFT, INPUT_MODE);
  pinMode(K_RIGHT, INPUT_MODE);
  pinMode(K_UP, INPUT_MODE);
  pinMode(K_DOWN, INPUT_MODE);
  pinMode(K_FIRE, INPUT_MODE);
}

bool input_left()   { return digitalRead(K_LEFT) == INPUT_STATE; }
bool input_right()  { return digitalRead(K_RIGHT) == INPUT_STATE; }
bool input_up()     { return digitalRead(K_UP) == INPUT_STATE; }
bool input_down()   { return digitalRead(K_DOWN) == INPUT_STATE; }
bool input_fire()   { return digitalRead(K_FIRE) == INPUT_STATE; }

// Fonctions factices pour la compatibilité
#ifdef SNES_CONTROLLER
bool input_start() { return false; }
void getControllerData(void) {}
#endif

#endif
