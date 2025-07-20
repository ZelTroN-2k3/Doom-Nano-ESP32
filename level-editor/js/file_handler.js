function generateCppCode(levelNumber) {
    let outputString = `const static uint8_t sto_level_${levelNumber}[LEVEL_SIZE] PROGMEM = {\n  `;
    let byteCount = 0;
    const reversedMapData = [...mapData].reverse();
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x += 2) {
            const highNibble = reversedMapData[y][x];
            const lowNibble = reversedMapData[y][x + 1];
            const byteValue = (highNibble << 4) | lowNibble;
            let hexString = byteValue.toString(16).toUpperCase();
            if (hexString.length === 1) hexString = '0' + hexString;
            outputString += `0x${hexString}, `;
            if (++byteCount % 32 === 0 && (y < MAP_HEIGHT - 1 || x < MAP_WIDTH - 2)) {
                outputString += "\n  ";
            }
        }
    }
    outputString = outputString.trim().slice(0, -1) + "\n};";
    return outputString;
}

function generateAsciiMap() {
    let asciiString = "";
    for (let y = 0; y < MAP_HEIGHT; y++) {
        let lineString = "";
        for (let x = 0; x < MAP_WIDTH; x++) {
            lineString += VALUE_TO_CHAR[mapData[y][x]] || '?';
        }
        asciiString += lineString + "\n";
    }
    return asciiString;
}

function parseAsciiData(content) {
    const newMapData = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(TILE_LEGEND.FLOOR.value));
    const lines = content.replace(/\r/g, '').trim().split('\n');
    for (let y = 0; y < MAP_HEIGHT; y++) {
        if (y < lines.length) {
            const line = lines[y];
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x < line.length) {
                    const char = line[x];
                    const tileInfo = CHAR_TO_TILE[char];
                    if (tileInfo) {
                        newMapData[y][x] = tileInfo.value;
                    }
                }
            }
        }
    }
    return newMapData;
}