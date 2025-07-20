let history = [];
let historyIndex = -1;
const MAX_HISTORY_STATES = 50;

function saveState() {
    history = history.slice(0, historyIndex + 1);
    const newMapState = mapData.map(row => [...row]);
    history.push(newMapState);
    if (history.length > MAX_HISTORY_STATES) {
        history.shift();
    }
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        mapData = history[historyIndex].map(row => [...row]);
        renderGridFromData();
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        mapData = history[historyIndex].map(row => [...row]);
        renderGridFromData();
        updateUndoRedoButtons();
    }
}

function paintTile(x, y) {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        mapData[y][x] = TILE_LEGEND[selectedTileKey].value;
        renderGridFromData();
    }
}

function floodFill(x, y, targetValue, replacementValue) {
    if (targetValue === replacementValue) return;
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
    if (mapData[y][x] !== targetValue) return;
    const queue = [[x, y]];
    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT && mapData[cy][cx] === targetValue) {
            mapData[cy][cx] = replacementValue;
            queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
    }
}