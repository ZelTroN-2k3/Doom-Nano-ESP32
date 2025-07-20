// ===============================================================
// ==                 VARIABLES GLOBALES PARTAGÉES              ==
// ===============================================================

// --- VARIABLES D'ÉTAT ---
let currentLang = 'fr';
let selectedTileKey = 'WALL';
let paintKey = 'WALL';
let mapData = [];
let isPainting = false;
let isSelecting = false;
let selection = { startX: null, startY: null, endX: null, endY: null };
let copiedData = null;
let placementCoords = { x: null, y: null };
let currentFileName = '';

// --- VARIABLES DU DOM (seront initialisées après le chargement) ---
let langSwitcher, paletteContainer, mapGridContainer, outputTextarea, newBtn, loadBtn, saveBtn, saveAsciiBtn, exportBtn, infoBtn, copyBtn, pasteBtn, undoBtn, redoBtn, zoomInBtn, zoomOutBtn, fileInput, infoModal, closeModalBtn, directionModal, directionSelector, fillModal, fillPaletteContainer, currentFilenameDisplay, previewCanvas, previewCtx, previewContainer, fullscreenBtn, fullscreenCloseBtn, resolutionSelector;


// ===============================================================
// ==                 INITIALISATION DE L'ÉDITEUR               ==
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- RÉCUPÉRATION DES ÉLÉMENTS DU DOM ---
    langSwitcher = document.getElementById('lang-switcher');
    paletteContainer = document.getElementById('palette');
    mapGridContainer = document.getElementById('map-grid');
    outputTextarea = document.getElementById('output-data');
    newBtn = document.getElementById('new-btn');
    loadBtn = document.getElementById('load-btn');
    saveBtn = document.getElementById('save-btn');
    saveAsciiBtn = document.getElementById('save-ascii-btn');
    exportBtn = document.getElementById('export-btn');
    infoBtn = document.getElementById('info-btn');
    copyBtn = document.getElementById('copy-btn');
    pasteBtn = document.getElementById('paste-btn');
    undoBtn = document.getElementById('undo-btn');
    redoBtn = document.getElementById('redo-btn');
    zoomInBtn = document.getElementById('zoom-in-btn');
    zoomOutBtn = document.getElementById('zoom-out-btn');
    fileInput = document.getElementById('file-input');
    infoModal = document.getElementById('info-modal');
    closeModalBtn = document.querySelector('.close-btn');
    directionModal = document.getElementById('direction-modal');
    directionSelector = document.getElementById('direction-selector');
    fillModal = document.getElementById('fill-modal');
    fillPaletteContainer = document.getElementById('fill-palette');
    currentFilenameDisplay = document.getElementById('current-filename');
    previewCanvas = document.getElementById('preview-canvas');
    previewCtx = previewCanvas.getContext('2d');
    previewContainer = document.getElementById('preview-container');
    fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenCloseBtn = document.getElementById('fullscreen-close-btn');
    resolutionSelector = document.getElementById('resolution-selector');

    // --- INITIALISATION DE L'INTERFACE ---
    Object.keys(TILE_LEGEND).forEach(key => {
        const tileInfo = TILE_LEGEND[key];
        if (tileInfo.hidden) return;
        const entryContainer = document.createElement('div');
        entryContainer.className = 'palette-entry';
        const keyLower = key.toLowerCase();
        if (tileInfo.isTool) entryContainer.dataset.tool = keyLower;
        else entryContainer.dataset.tileKey = key;
        const itemIcon = document.createElement('div');
        itemIcon.className = 'palette-item';
        itemIcon.textContent = tileInfo.char;
        if (tileInfo.color) itemIcon.style.backgroundColor = tileInfo.color;
        const itemLabel = document.createElement('span');
        itemLabel.className = 'palette-label';
        entryContainer.appendChild(itemIcon);
        entryContainer.appendChild(itemLabel);
        paletteContainer.appendChild(entryContainer);
    });

    mapGridContainer.style.gridTemplateColumns = `repeat(${MAP_WIDTH}, 12px)`;
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.x = x;
            tile.dataset.y = y;
            mapGridContainer.appendChild(tile);
        }
    }
    
    // --- CONNEXION DES ÉVÉNEMENTS ---
    langSwitcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const lang = e.target.dataset.lang;
            if (lang !== currentLang) {
                currentLang = lang;
                langSwitcher.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                updateUI();
                
                // --- LA CORRECTION EST ICI ---
                // On passe la variable en argument, comme pour l'appel initial.
                populateFillPalette(fillPaletteContainer);
            }
        }
    });

    newBtn.addEventListener('click', () => { if (confirm(translations[currentLang].confirmClear)) newGrid(); });
    loadBtn.addEventListener('click', () => fileInput.click());
    saveBtn.addEventListener('click', () => {
        const levelNum = prompt(translations[currentLang].levelNumberPrompt, "1");
        if (!levelNum) return;
        const code = generateCppCode(levelNum);
        const blob = new Blob([code], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `level_${levelNum}_data.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
    });
    saveAsciiBtn.addEventListener('click', () => {
        const asciiMap = generateAsciiMap();
        const blob = new Blob([asciiMap], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'level_ascii.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });
    copyBtn.addEventListener('click', () => { /* ... à implémenter ... */ });
    pasteBtn.addEventListener('click', () => { /* ... à implémenter ... */ });
    exportBtn.addEventListener('click', () => {
        const levelNum = prompt(translations[currentLang].levelNumberPrompt, "1");
        if (!levelNum) return;
        outputTextarea.value = generateCppCode(levelNum);
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFileName = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            try {
                let loadedMapData;
                if (content.includes('const static uint8_t')) {
                    const hexMatch = content.match(/\{([\s\S]*?)\}/);
                    if (!hexMatch) throw new Error(translations[currentLang].invalidFileFormat);
                    const hexValues = hexMatch[1].match(/0x[0-9A-Fa-f]{1,2}/g).map(h => parseInt(h, 16));
                    loadedMapData = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(0));
                    let i = 0;
                    for (let y = MAP_HEIGHT - 1; y >= 0; y--) {
                        for (let x = 0; x < MAP_WIDTH; x += 2) {
                            const byteValue = hexValues[i++];
                            if (byteValue === undefined) throw new Error("Fichier de données incomplet.");
                            loadedMapData[y][x] = byteValue >> 4;
                            loadedMapData[y][x + 1] = byteValue & 0x0F;
                        }
                    }
                } else {
                    loadedMapData = parseAsciiData(content);
                }
                mapData = loadedMapData;
                renderGridFromData();
                updateFileNameDisplay();
                history = [];
                historyIndex = -1;
                saveState(mapData);
                updateUndoRedoButtons();
            } catch (error) {
                alert(translations[currentLang].fileReadError + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
    paletteContainer.addEventListener('click', (e) => {
        const paletteEntry = e.target.closest('.palette-entry');
        if (paletteEntry) {
            document.querySelector('.palette-entry.selected').classList.remove('selected');
            paletteEntry.classList.add('selected');
            selectedTileKey = paletteEntry.dataset.tileKey || (paletteEntry.dataset.tool ? paletteEntry.dataset.tool.toUpperCase() : null);
            if (selectedTileKey === 'FILL_TOOL') {
                fillModal.style.display = 'block';
            } else if (!TILE_LEGEND[selectedTileKey].isTool) {
                paintKey = selectedTileKey;
            }
        }
    });
	fillPaletteContainer.addEventListener('click', (e) => {
		const paletteEntry = e.target.closest('.palette-entry');
		if (paletteEntry) {
			const key = paletteEntry.dataset.tileKey;
			if (key) {
				paintKey = key;
				fillModal.style.display = 'none';
			}
		}
	});
	mapGridContainer.addEventListener('mousedown', (e) => {
		if (e.button !== 0) return;
		const { x, y } = getGridCoordinates(e);
		if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
		isPainting = false;
		isSelecting = false;
		if (selectedTileKey === 'FILL_TOOL') {
			const targetValue = mapData[y][x];
			const replacementValue = TILE_LEGEND[paintKey].value;
			floodFill(x, y, targetValue, replacementValue);
			renderGridFromData();
			saveState(mapData);
		} else if (selectedTileKey === 'PLAYER_TOOL') {
            placementCoords.x = x;
            placementCoords.y = y;
            directionModal.style.display = 'block';
        } else if (e.shiftKey || selectedTileKey === 'SELECT') {
            isSelecting = true;
            selection.startX = x;
            selection.startY = y;
            selection.endX = x;
            selection.endY = y;
            updateSelectionVisuals();
        } else {
            isPainting = true;
            paintTile(x, y);
        }
	});
	directionSelector.addEventListener('click', (e) => {
		if (e.target.tagName === 'BUTTON') {
			const directionKey = e.target.dataset.direction;
			const { x, y } = placementCoords;
			if (x !== null && y !== null && directionKey) {
                mapData.forEach((row, ry) => row.forEach((val, rx) => {
                    if ([0x1, 0xB, 0xC, 0xD].includes(val)) mapData[ry][rx] = TILE_LEGEND.FLOOR.value;
                }));
				mapData[y][x] = TILE_LEGEND[directionKey].value;
                renderGridFromData();
                saveState(mapData);
			}
			directionModal.style.display = 'none';
			placementCoords = { x: null, y: null };
		}
	});	
    mapGridContainer.addEventListener('mouseover', (e) => {
        if (isPainting || isSelecting) {
            const { x, y } = getGridCoordinates(e);
            if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
            if (isPainting) {
                paintTile(x, y);
            } else if (isSelecting) {
                selection.endX = x;
                selection.endY = y;
                updateSelectionVisuals();
            }
        }
    });
    window.addEventListener('mouseup', () => {
		if (isPainting) {
			saveState(mapData);
		}    
        isPainting = false;
        isSelecting = false;
    });
    infoBtn.addEventListener('click', () => infoModal.style.display = 'block');
    closeModalBtn.addEventListener('click', () => infoModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == infoModal) infoModal.style.display = 'none';
        if (e.target == directionModal) directionModal.style.display = 'none';
        if (e.target == fillModal) fillModal.style.display = 'none';
    });
	mapGridContainer.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		const { x, y } = getGridCoordinates(e);
		if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
		const value = mapData[y][x];
		let newSelectedKey = null;
		for (const key in TILE_LEGEND) {
			const tileInfo = TILE_LEGEND[key];
			if (!tileInfo.isTool && tileInfo.value === value) {
				newSelectedKey = key;
				break;
			}
		}
		if (newSelectedKey) {
			selectedTileKey = newSelectedKey;
			const currentSelected = document.querySelector('.palette-entry.selected');
			if (currentSelected) currentSelected.classList.remove('selected');
			const newPaletteEntry = document.querySelector(`[data-tile-key="${newSelectedKey}"]`);
			if (newPaletteEntry) newPaletteEntry.classList.add('selected');
		}
	});
	undoBtn.addEventListener('click', undo);
	redoBtn.addEventListener('click', redo);
	window.addEventListener('keydown', (e) => {
		if (e.ctrlKey || e.metaKey) {
			const key = e.key.toLowerCase();
			if (key === 'z') { e.preventDefault(); undo(); }
            else if (key === 'y') { e.preventDefault(); redo(); }
		}
        if (e.key.startsWith('Arrow')) {
            if (isPreviewFocused) e.preventDefault();
            keysPressed[e.key] = true;
        }
	});
    window.addEventListener('keyup', (e) => {
        if (e.key.startsWith('Arrow')) {
            if (isPreviewFocused) e.preventDefault();
            keysPressed[e.key] = false;
        }
    });
	zoomInBtn.addEventListener('click', () => {
		currentZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP);
		applyZoom();
	});
	zoomOutBtn.addEventListener('click', () => {
		currentZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP);
		applyZoom();
	});
	previewCanvas.addEventListener('focus', () => { isPreviewFocused = true; previewCanvas.style.border = '1px solid #00ff00'; });
	previewCanvas.addEventListener('blur', () => { isPreviewFocused = false; for (const key in keysPressed) { keysPressed[key] = false; } previewCanvas.style.border = '1px solid #111'; });
	fullscreenBtn.addEventListener('click', () => { previewContainer.requestFullscreen(); });
	fullscreenCloseBtn.addEventListener('click', () => { document.exitFullscreen(); });
	document.addEventListener('fullscreenchange', () => {
		if (document.fullscreenElement) {
			previewContainer.classList.add('is-fullscreen');
		} else {
			previewContainer.classList.remove('is-fullscreen');
		}
	});
	resolutionSelector.addEventListener('change', () => {
		const value = resolutionSelector.value;
		let width = '258px';
		let aspectRatio = 'auto';
		if (value === '16:9') {
			aspectRatio = '16 / 9';
		} else if (value.includes('x')) {
			const parts = value.split('x');
			width = `${parseInt(parts[0]) + 2}px`;
			aspectRatio = `${parts[0]} / ${parts[1]}`;
		}
		previewContainer.style.width = width;
		previewContainer.style.aspectRatio = aspectRatio;
	});

    // --- DÉMARRAGE ---
    document.querySelector('[data-tile-key="WALL"]').classList.add('selected');
    
    // --- LA CORRECTION EST ICI ---
    // On passe la variable en argument à la fonction, comme on l'a fait pour le langSwitcher
    populateFillPalette(fillPaletteContainer); 
    
    newGrid();
    updateUI();
    previewAnimationLoop();
});