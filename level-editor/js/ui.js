let currentZoom = 1.0;
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3.0;
const MINIMAP_TILE_SIZE = 2;

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
    renderMinimap();
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
    updateZoomDisplay();
    updateMinimapViewport();
}

function updateZoomDisplay() {
    if (zoomDisplay) {
        zoomDisplay.textContent = `Zoom ${currentZoom.toFixed(1)}x`;
    }
}

function updateCoordsDisplay(x, y) {
    if (coordsDisplay) {
        coordsDisplay.textContent = `X:${x} Y:${y}`;
    }
}

function clearCoordsDisplay() {
    if (coordsDisplay) {
        coordsDisplay.textContent = `X:-- Y:--`;
    }
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

function clearShapePreview() {
    document.querySelectorAll('.tile.tile-preview').forEach(t => t.classList.remove('tile-preview'));
}

function drawShapePreview(start, end) {
    clearShapePreview();
    let points = [];
    if (selectedTileKey === 'LINE_TOOL') {
        points = getLinePoints(start, end);
    } else if (selectedTileKey === 'RECTANGLE_TOOL') {
        points = getRectanglePoints(start, end);
    }

    points.forEach(p => {
        if (p.x >= 0 && p.x < MAP_WIDTH && p.y >= 0 && p.y < MAP_HEIGHT) {
            mapGridContainer.children[p.y * MAP_WIDTH + p.x].classList.add('tile-preview');
        }
    });
}

function renderMinimap() {
    if (!minimapCanvas) return;
    const ctx = minimapCanvas.getContext('2d');
    ctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileValue = mapData[y][x];
            ctx.fillStyle = VALUE_TO_COLOR[tileValue] || '#000';
            ctx.fillRect(x * MINIMAP_TILE_SIZE, y * MINIMAP_TILE_SIZE, MINIMAP_TILE_SIZE, MINIMAP_TILE_SIZE);
        }
    }
    updateMinimapViewport();
}

function updateMinimapViewport() {
    if (!gridViewport || !minimapViewport || !minimapCanvas) return;

    // Dimensions réelles du contenu de la grille (qui change avec le zoom)
    const contentWidth = gridViewport.scrollWidth;
    const contentHeight = gridViewport.scrollHeight;

    // Dimensions de la fenêtre de visualisation (qui reste fixe)
    const viewWidth = gridViewport.clientWidth;
    const viewHeight = gridViewport.clientHeight;

    // On calcule le ratio de la zone visible par rapport à la taille totale du contenu.
    // On s'assure que le ratio ne dépasse jamais 100% (cas où le contenu est plus petit que la vue).
    const widthRatio = Math.min(1.0, viewWidth / contentWidth);
    const heightRatio = Math.min(1.0, viewHeight / contentHeight);

    // On calcule le ratio de la position du scroll.
    // Si pas de scroll possible (contenu plus petit que la vue), la position est 0.
    const leftRatio = contentWidth > viewWidth ? (gridViewport.scrollLeft / contentWidth) : 0;
    const topRatio = contentHeight > viewHeight ? (gridViewport.scrollTop / contentHeight) : 0;

    // On applique ces ratios à la taille de la mini-carte pour positionner le rectangle.
    minimapViewport.style.width = `${widthRatio * minimapCanvas.width}px`;
    minimapViewport.style.height = `${heightRatio * minimapCanvas.height}px`;
    minimapViewport.style.left = `${leftRatio * minimapCanvas.width}px`;
    minimapViewport.style.top = `${topRatio * minimapCanvas.height}px`;
}

