const MAP_WIDTH = 64;
const MAP_HEIGHT = 57;
const TILE_LEGEND = {
    SELECT:         { char: '', isTool: true, descKey: 'selectToolDesc' },
    FILL_TOOL:      { char: 'R', isTool: true, color: '#00ccff', descKey: 'fillToolDesc' },
    PLAYER_TOOL:    { char: 'P', isTool: true, color: '#00FF00', descKey: 'playerDesc' },
    LINE_TOOL:      { char: '╱', isTool: true, color: '#ff9800', descKey: 'lineToolDesc' },
    RECTANGLE_TOOL: { char: '□', isTool: true, color: '#9c27b0', descKey: 'rectangleToolDesc' },    
    PLAYER_UP:      { char: '^', value: 0x1, color: '#00FF00', hidden: true },
    PLAYER_RIGHT:   { char: '>', value: 0xB, color: '#00FF00', hidden: true },
    PLAYER_DOWN:    { char: 'v', value: 0xC, color: '#00FF00', hidden: true },
    PLAYER_LEFT:    { char: '<', value: 0xD, color: '#00FF00', hidden: true },
    FLOOR:          { char: '.', value: 0x0, color: '#2d2d2d', descKey: "floorDesc" },
    WALL:           { char: '#', value: 0xF, color: '#888888', descKey: "wallDesc" },
    /* ENEMY:          { char: 'E', value: 0x2, color: '#f00000', descKey: "enemyDesc" }, */
    ENEMY:          { char: 'E', value: 0x2, color: '#f00000', descKey: "enemyDesc", image: 'enemy.png' }, // <-- AJOUTER image
    DOOR:           { char: 'D', value: 0x4, color: '#aa6600', descKey: "doorDesc" },
    LOCKED_DOOR:    { char: 'L', value: 0x5, color: '#ff8800', descKey: "lockedDoorDesc" },
    SECRET_WALL:    { char: 'S', value: 0x6, color: '#D4D4D4', descKey: "secretWallDesc" },
    EXIT:           { char: 'X', value: 0x7, color: '#00FFFF', descKey: "exitDesc" },
    /* MEDIKIT:        { char: 'M', value: 0x8, color: '#FF00FF', descKey: "medikitDesc" }, */
    MEDIKIT:        { char: 'M', value: 0x8, color: '#FF00FF', descKey: "medikitDesc", image: 'medikit.png' }, // <-- AJOUTER image
    /* KEY:            { char: 'K', value: 0x9, color: '#FFFF00', descKey: "keyDesc" }, */
    KEY:            { char: 'K', value: 0x9, color: '#FFFF00', descKey: "keyDesc", image: 'key.png' }, // <-- AJOUTER image
};

const VALUE_TO_COLOR = {};
const VALUE_TO_CHAR = {};
const CHAR_TO_TILE = {};

for(const key in TILE_LEGEND) {
    if (!TILE_LEGEND[key].isTool) {
        const tileInfo = TILE_LEGEND[key];
        VALUE_TO_COLOR[tileInfo.value] = tileInfo.color;
        VALUE_TO_CHAR[tileInfo.value] = tileInfo.char;
        if (tileInfo.char) CHAR_TO_TILE[tileInfo.char] = tileInfo;
    }
}

const WALL_TILES = [TILE_LEGEND.WALL.value, TILE_LEGEND.DOOR.value, TILE_LEGEND.LOCKED_DOOR.value, TILE_LEGEND.SECRET_WALL.value, TILE_LEGEND.EXIT.value];
const SPRITE_TILES = [TILE_LEGEND.ENEMY.value, TILE_LEGEND.MEDIKIT.value, TILE_LEGEND.KEY.value];

