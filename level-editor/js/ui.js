let currentZoom = 1.0;
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3.0;

function updateUI() {
    const langStrings = translations[currentLang];
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        if (langStrings[key]) el.textContent = langStrings[key];
    });
    document.querySelectorAll('.palette-entry .palette-label').forEach(label => {
        const entry = label.parentElement;
        const key = entry.dataset.tileKey || (entry.dataset.tool ? entry.dataset.tool.toUpperCase() : null);
        if (key && TILE_LEGEND[key]) {
            label.textContent = langStrings[TILE_LEGEND[key].descKey];
        }
    });
    updateFileNameDisplay();
}

function renderGridFromData() {
    const tiles = mapGridContainer.children;
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileElement = tiles[y * MAP_WIDTH + x];
            const tileValue = mapData[y][x];
            tileElement.style.backgroundColor = VALUE_TO_COLOR[tileValue] || '#000';
            if (tileValue !== TILE_LEGEND.WALL.value && tileValue !== TILE_LEGEND.FLOOR.value) {
                tileElement.textContent = VALUE_TO_CHAR[tileValue];
            } else {
                tileElement.textContent = '';
            }
        }
    }
    updatePreview();
}

function updateSelectionVisuals() {
    document.querySelectorAll('.tile.selected-area').forEach(t => t.classList.remove('selected-area'));
    if (selection.startX === null) return;
    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            mapGridContainer.children[y * MAP_WIDTH + x].classList.add('selected-area');
        }
    }
}

function populateFillPalette(container) { // On ajoute "container" comme argument
    container.innerHTML = ''; // On utilise l'argument "container"
    Object.keys(TILE_LEGEND).forEach(key => {
        const tileInfo = TILE_LEGEND[key];
        if (!tileInfo.isTool && !tileInfo.hidden) {
            const entryContainer = document.createElement('div');
            entryContainer.className = 'palette-entry';
            entryContainer.dataset.tileKey = key;
            const itemIcon = document.createElement('div');
            itemIcon.className = 'palette-item';
            itemIcon.textContent = tileInfo.char;
            if (tileInfo.color) itemIcon.style.backgroundColor = tileInfo.color;
            const itemLabel = document.createElement('span');
            itemLabel.className = 'palette-label';
            itemLabel.textContent = translations[currentLang][tileInfo.descKey];
            entryContainer.appendChild(itemIcon);
            entryContainer.appendChild(itemLabel);
            container.appendChild(entryContainer); // On utilise l'argument "container"
        }
    });
}

function applyZoom() {
    mapGridContainer.style.transform = `scale(${currentZoom})`;
}

function getGridCoordinates(e) {
    const rect = mapGridContainer.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    const actualX = relativeX / currentZoom;
    const actualY = relativeY / currentZoom;
    const gridX = Math.floor(actualX / 12);
    const gridY = Math.floor(actualY / 12);
    return { x: gridX, y: gridY };
}

function updateFileNameDisplay() {
    currentFilenameDisplay.textContent = currentFileName || translations[currentLang].newLevelDefaultName;
}

function newGrid() {
    mapData = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(TILE_LEGEND.WALL.value));
    renderGridFromData();
    currentFileName = ''; // On réinitialise le nom du fichier
    updateFileNameDisplay(); // On met à jour l'affichage        
    history = [];
    historyIndex = -1;
    saveState(mapData);
    updateUndoRedoButtons();        
}

function updateUndoRedoButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}