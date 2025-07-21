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

function drawShape(start, end, value) {
    let points = [];
    if (selectedTileKey === 'LINE_TOOL') {
        points = getLinePoints(start, end);
    } else if (selectedTileKey === 'RECTANGLE_TOOL') {
        points = getRectanglePoints(start, end);
    }

    points.forEach(p => {
        if (p.x >= 0 && p.x < MAP_WIDTH && p.y >= 0 && p.y < MAP_HEIGHT) {
            mapData[p.y][p.x] = value;
        }
    });
}

function getLinePoints(start, end) {
    let points = [];
    let x0 = start.x, y0 = start.y;
    let x1 = end.x, y1 = end.y;
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;

    while (true) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return points;
}

function getRectanglePoints(start, end) {
    let points = [];
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    for (let x = minX; x <= maxX; x++) {
        points.push({ x: x, y: minY });
        points.push({ x: x, y: maxY });
    }
    for (let y = minY + 1; y < maxY; y++) {
        points.push({ x: minX, y: y });
        points.push({ x: maxX, y: y });
    }
    return points;
}

