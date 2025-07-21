// ===============================================================
// ==              CONFIGURATION DE L'ÉDITEUR                 ==
// ===============================================================
const EDITOR_INFO = {
    version: "1.0.80",
    author: "Patrick.A / ZelTroN-2k3",
    creationDate: "8/07/2025"
};

// ===============================================================
// ==                 VARIABLES GLOBALES PARTAGÉES              ==
// ===============================================================
let currentLang = 'fr';
let selectedTileKey = 'WALL';
let paintKey = 'WALL';
let mapData = [];
let isPainting = false;
let isSelecting = false;
let isDrawingShape = false; 
let shapeStartCoords = { x: null, y: null }; 
let selection = { startX: null, startY: null, endX: null, endY: null };
let copiedData = null;
let spriteImages = {};
let placementCoords = { x: null, y: null };
let currentFileName = '';

let langSwitcher, paletteContainer, mapGridContainer, newBtn, loadBtn, saveBtn, saveAsciiBtn, exportBtn, infoBtn, copyBtn, pasteBtn, undoBtn, redoBtn, zoomInBtn, zoomOutBtn, zoomDisplay, coordsDisplay, fileInput, infoModal, closeModalBtn, directionModal, directionSelector, fillModal, fillPaletteContainer, shapeModal, shapePaletteContainer, currentFilenameDisplay, gridViewport, minimapCanvas, minimapViewport, previewCanvas, previewCtx, previewContainer, fullscreenBtn, fullscreenCloseBtn, resolutionSelector, exportModal, exportCloseBtn, exportOutputTextarea, copyCodeBtn, maxiviewModal, maxiviewCanvasContainer, maxiviewCloseBtn;

function loadSpriteImages() {
    const promises = [];
    for (const key in TILE_LEGEND) {
        const tileInfo = TILE_LEGEND[key];
        if (tileInfo.image) {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.src = `sprites/${tileInfo.image}`;
                img.onload = () => {
                    spriteImages[tileInfo.value] = img;
                    resolve();
                };
                img.onerror = reject;
            });
            promises.push(promise);
        }
    }
    return Promise.all(promises);
}

// ===============================================================
// ==                 INITIALISATION DE L'ÉDITEUR               ==
// ===============================================================
document.addEventListener('DOMContentLoaded', async () => {

    // --- RÉCUPÉRATION DES ÉLÉMENTS DU DOM ---
    langSwitcher = document.getElementById('lang-switcher');
    paletteContainer = document.getElementById('palette');
    mapGridContainer = document.getElementById('map-grid');
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
    zoomDisplay = document.getElementById('zoom-display');
    coordsDisplay = document.getElementById('coords-display');
    fileInput = document.getElementById('file-input');
    infoModal = document.getElementById('info-modal');
    closeModalBtn = document.querySelector('.close-btn');
    directionModal = document.getElementById('direction-modal');
    directionSelector = document.getElementById('direction-selector');
    fillModal = document.getElementById('fill-modal');
    fillPaletteContainer = document.getElementById('fill-palette');
    shapeModal = document.getElementById('shape-modal'); 
    shapePaletteContainer = document.getElementById('shape-palette'); 
    currentFilenameDisplay = document.getElementById('current-filename');
    gridViewport = document.getElementById('grid-viewport'); 
    minimapCanvas = document.getElementById('minimap-canvas'); 
    minimapViewport = document.getElementById('minimap-viewport'); 
    previewCanvas = document.getElementById('preview-canvas');
    previewCtx = previewCanvas.getContext('2d');
    previewContainer = document.getElementById('preview-container');
    fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenCloseBtn = document.getElementById('fullscreen-close-btn');
    resolutionSelector = document.getElementById('resolution-selector');
    exportModal = document.getElementById('export-modal');
    exportCloseBtn = document.getElementById('export-close-btn');
    exportOutputTextarea = document.getElementById('export-output-data');
    copyCodeBtn = document.getElementById('copy-code-btn');
    maxiviewModal = document.getElementById('maxiview-modal');
    maxiviewCanvasContainer = document.getElementById('maxiview-canvas-container');
    maxiviewCloseBtn = document.getElementById('maxiview-close-btn');

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

    gridViewport.addEventListener('scroll', updateMinimapViewport);

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
    copyBtn.addEventListener('click', () => {
        if (selection.startX === null) return alert(translations[currentLang].selectFirst);
        const minX = Math.min(selection.startX, selection.endX);
        const maxX = Math.max(selection.startX, selection.endX);
        const minY = Math.min(selection.startY, selection.endY);
        const maxY = Math.max(selection.startY, selection.endY);
        copiedData = [];
        for (let y = minY; y <= maxY; y++) { copiedData.push(mapData[y].slice(minX, maxX + 1)); }
        alert(translations[currentLang].copySuccess(copiedData[0].length, copiedData.length));
    });
    pasteBtn.addEventListener('click', () => {
        if (!copiedData) return alert(translations[currentLang].nothingToPaste);
        if (selection.startX === null) return alert(translations[currentLang].selectPasteLocation);
        const startX = Math.min(selection.startX, selection.endX);
        const startY = Math.min(selection.startY, selection.endY);
        for (let y = 0; y < copiedData.length; y++) {
            for (let x = 0; x < copiedData[0].length; x++) {
                const destX = startX + x;
                const destY = startY + y;
                if (destX < MAP_WIDTH && destY < MAP_HEIGHT) mapData[destY][destX] = copiedData[y][x];
            }
        }
        renderGridFromData();
        saveState(mapData);
    });
    exportBtn.addEventListener('click', () => {
        const levelNum = prompt(translations[currentLang].levelNumberPrompt, "1");
        if (!levelNum) return;
        exportOutputTextarea.value = generateCppCode(levelNum);
        exportModal.style.display = 'block';
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

            // MODIFICATION : Ouvre le popup pour les outils de forme
            if (selectedTileKey === 'FILL_TOOL') {
                fillModal.style.display = 'block';
            } else if (selectedTileKey === 'LINE_TOOL' || selectedTileKey === 'RECTANGLE_TOOL') {
                shapeModal.style.display = 'block';
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
    shapePaletteContainer.addEventListener('click', (e) => {
        const paletteEntry = e.target.closest('.palette-entry');
        if (paletteEntry) {
            const key = paletteEntry.dataset.tileKey;
            if (key) {
                paintKey = key; // On définit le matériau à utiliser
                shapeModal.style.display = 'none'; // On ferme le popup
            }
        }
    });    
	mapGridContainer.addEventListener('mousedown', (e) => {
		if (e.button !== 0) return;
		const { x, y } = getGridCoordinates(e);
		if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;

		isPainting = false;
		isSelecting = false;
        isDrawingShape = false;

        // --- NOUVELLE LOGIQUE POUR LES FORMES ---
        if (selectedTileKey === 'LINE_TOOL' || selectedTileKey === 'RECTANGLE_TOOL') {
            isDrawingShape = true;
            shapeStartCoords = { x, y };
            return; // On arrête ici pour ne pas déclencher les autres outils
        }
        // --- FIN DE LA NOUVELLE LOGIQUE ---

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
        // On conserve votre vérification pour n'exécuter le code que si une action est en cours
        if (isPainting || isSelecting || isDrawingShape) {
            const { x, y } = getGridCoordinates(e);
            if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;

            // On ajoute la nouvelle condition pour l'aperçu des formes
            if (isDrawingShape) {
                drawShapePreview(shapeStartCoords, { x, y });
            } else if (isPainting) {
                paintTile(x, y);
            } else if (isSelecting) {
                selection.endX = x;
                selection.endY = y;
                updateSelectionVisuals();
            }
        }
    });
    window.addEventListener('mouseup', (e) => { // <-- ON AJOUTE (e) ICI
    // --- NOUVELLE LOGIQUE POUR LES FORMES ---
    if (isDrawingShape) {
        const { x, y } = getGridCoordinates(e);
        clearShapePreview();
        drawShape(shapeStartCoords, { x, y }, TILE_LEGEND[paintKey].value);
        renderGridFromData();
        saveState(mapData);
        isDrawingShape = false;
    }
    // --- FIN DE LA NOUVELLE LOGIQUE --- 
		if (isPainting) {
			saveState(mapData);
		}    
        isPainting = false;
        isSelecting = false;
        // On remet la sélection de forme à false au cas où
        isDrawingShape = false      
    });
    infoBtn.addEventListener('click', () => infoModal.style.display = 'block');
    closeModalBtn.addEventListener('click', () => infoModal.style.display = 'none');
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
    mapGridContainer.addEventListener('mousemove', (e) => {
        const { x, y } = getGridCoordinates(e);
        // Vérifie si les coordonnées sont valides et à l'intérieur de la grille
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            updateCoordsDisplay(x, y);
        } else {
            clearCoordsDisplay(); // Efface si la souris sort des limites de la grille
        }
    });

    mapGridContainer.addEventListener('mouseleave', () => {
        clearCoordsDisplay(); // Efface quand la souris quitte la grille
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
    
    function closeMaxiView() {
        previewContainer.appendChild(previewCanvas);
        maxiviewModal.style.display = 'none';
    }
    fullscreenBtn.addEventListener('click', () => {
        maxiviewCanvasContainer.appendChild(previewCanvas);
        maxiviewModal.style.display = 'block';
        previewCanvas.focus();
    });
    maxiviewCloseBtn.addEventListener('click', closeMaxiView);

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

    copyCodeBtn.addEventListener('click', () => {
        exportOutputTextarea.select();
        document.execCommand('copy');
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = "Copié !";
        setTimeout(() => {
            copyCodeBtn.textContent = originalText;
        }, 1500);
    });
    exportCloseBtn.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target == infoModal) infoModal.style.display = 'none';
        if (e.target == directionModal) directionModal.style.display = 'none';
        if (e.target == fillModal) fillModal.style.display = 'none';
        if (e.target == shapeModal) shapeModal.style.display = 'none'; 
        if (e.target == maxiviewModal) closeMaxiView();
        if (e.target == exportModal) exportModal.style.display = 'none';
    });

    // --- DÉMARRAGE ---
    try {
        await loadSpriteImages(); // On attend que les images soient chargées
        console.log("Toutes les images de sprites ont été chargées.");
    } catch (error) {
        console.error("Erreur lors du chargement d'une image de sprite:", error);
    }

    document.querySelector('[data-tile-key="WALL"]').classList.add('selected');
    populateFillPalette(fillPaletteContainer); 
    populateFillPalette(shapePaletteContainer); 
    document.getElementById('footer-version').textContent = `Version ${EDITOR_INFO.version}`;
    document.getElementById('footer-author').textContent = `Auteur: ${EDITOR_INFO.author}`;
    document.getElementById('footer-date').textContent = `Créé le ${EDITOR_INFO.creationDate}`;

    newGrid();
    updateUI();
    applyZoom();
    previewAnimationLoop();
});