const MAP_WIDTH = 64;
const MAP_HEIGHT = 57;
const TILE_LEGEND = {
    SELECT: { char: '', isTool: true, descKey: 'selectToolDesc' },
    FILL_TOOL: { char: 'R', isTool: true, color: '#00ccff', descKey: 'fillToolDesc' },
    PLAYER_TOOL: { char: 'P', isTool: true, color: '#0f0', descKey: 'playerDesc' },
    PLAYER_UP: { char: '^', value: 0x1, color: '#0f0', hidden: true },
    PLAYER_RIGHT: { char: '>', value: 0xB, color: '#0f0', hidden: true },
    PLAYER_DOWN: { char: 'v', value: 0xC, color: '#0f0', hidden: true },
    PLAYER_LEFT: { char: '<', value: 0xD, color: '#0f0', hidden: true },
    FLOOR: { char: '.', value: 0x0, color: '#2d2d2d', descKey: "floorDesc" },
    WALL: { char: '#', value: 0xF, color: '#888', descKey: "wallDesc" },
    ENEMY: { char: 'E', value: 0x2, color: '#f00', descKey: "enemyDesc" },
    DOOR: { char: 'D', value: 0x4, color: '#a60', descKey: "doorDesc" },
    LOCKED_DOOR: { char: 'L', value: 0x5, color: '#f80', descKey: "lockedDoorDesc" },
    SECRET_WALL: { char: 'S', value: 0x6, color: '#D4D4D4', descKey: "secretWallDesc" },
    EXIT: { char: 'X', value: 0x7, color: '#0ff', descKey: "exitDesc" },
    MEDIKIT: { char: 'M', value: 0x8, color: '#f0f', descKey: "medikitDesc" },
    KEY: { char: 'K', value: 0x9, color: '#ff0', descKey: "keyDesc" },
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