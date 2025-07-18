// On attend que toute la page HTML soit chargée avant d'exécuter le code.
document.addEventListener('DOMContentLoaded', () => {

// ===============================================================
// ==                 TRADUCTIONS ET CONSTANTES                 ==
// ===============================================================

	const translations = {
		// --- SECTION POUR LE FRANçAIS ---
		fr: {
			// --- Clés pour les éléments statiques ---
			editorTitle: "Éditeur de Niveau",
			newButton: "Nouveau",
			loadButton: "Charger",
			saveButton: "Sauvegarder (C++)",
			saveAsciiButton: "Sauvegarder (ASCII)",
			copyButton: "Copier",
			pasteButton: "Coller",
			exportButton: "Exporter",
			infoButton: "Infos",
			exportTitle: "Code C++ à exporter :",
			infoModalTitle: "Infos Éditeur",
			infoDesc1: "Cet éditeur a été créé pour le projet Doom-Nano-ESP32.",
			infoDesc2: "Utilisez la palette pour sélectionner un bloc, puis dessinez sur la grille.",
			infoActionsTitle: "Actions des Boutons :",
			infoNew: "Nouveau :", infoNewDesc: " Efface la carte actuelle.",
			infoLoad: "Charger :", infoLoadDesc: " Charge un fichier de données de niveau (.txt format).",
			infoSave: "Sauvegarder (C++) :", infoSaveDesc: " Sauvegarde le code C++ de la carte dans un fichier .txt.",
			infoSaveAscii: "Sauvegarder (ASCII) :", infoSaveAsciiDesc: " Sauvegarde une version texte lisible de la carte.",
			infoCopy: "Copier :", infoCopyDesc: " Copie la zone actuellement sélectionnée.",
			infoPaste: "Coller :", infoPasteDesc: " Colle la zone copiée à l'endroit sélectionné.",
			infoShortcutsTitle: "Raccourcis Clavier :",
			infoDraw: " Dessiner avec l'outil sélectionné.",
			infoSelect: " Sélectionner une zone rectangulaire.",
			// --- Clés pour les descriptions de la palette ---
			selectToolDesc: 'Sélectionner',
			floorDesc: "Le sol (Floor)",
			wallDesc: "Un mur (Wall)",
			playerDesc: "Départ du joueur (Player)",
			enemyDesc: "Un ennemi (Enemy)",
			doorDesc: "Une porte (Door)",
			lockedDoorDesc: "Porte verrouillée (Locked Door)",
			exitDesc: "La sortie du niveau (Exit)",
			medikitDesc: "Kit de soin (Medikit)",
			keyDesc: "Une clé (Key)",
			secretWallDesc: "Mur Secret (Secret Wall)",
			// --- Clés pour les messages dynamiques ---
			confirmClear: "Êtes-vous sûr de vouloir effacer la carte actuelle ?",
			selectFirst: "Veuillez d'abord sélectionner une zone.",
			nothingToPaste: "Rien à coller. Veuillez d'abord copier une zone.",
			selectPasteLocation: "Veuillez sélectionner une case où coller.",
			levelNumberPrompt: "Veuillez entrer le numéro du niveau :",
			invalidFileFormat: "Format de données non valide.",
			fileReadError: "Erreur lors du chargement du fichier : ",
			copySuccess: (w, h) => `Zone de ${w}x${h} copiée !`
		},
		// --- SECTION POUR L'ENGLAIS ---
		en: {
			// --- Keys for static elements ---
			editorTitle: "Level Editor",
			newButton: "New",
			loadButton: "Load",
			saveButton: "Save (C++)",
			saveAsciiButton: "Save (ASCII)",
			copyButton: "Copy",
			pasteButton: "Paste",
			exportButton: "Export",
			infoButton: "Info",
			exportTitle: "C++ Code to Export:",
			infoModalTitle: "Editor Info",
			infoDesc1: "This editor was created for the Doom-Nano-ESP32 project.",
			infoDesc2: "Use the palette to select a block, then draw on the grid.",
			infoActionsTitle: "Button Actions:",
			infoNew: "New:", infoNewDesc: " Clears the current map.",
			infoLoad: "Load:", infoLoadDesc: " Loads a level data file (.txt format).",
			infoSave: "Save (C++):", infoSaveDesc: " Saves the map's C++ code to a .txt file.",
			infoSaveAscii: "Save (ASCII):", infoSaveAsciiDesc: " Saves a human-readable text version of the map.",
			infoCopy: "Copy:", infoCopyDesc: " Copies the currently selected area.",
			infoPaste: "Paste:", infoPasteDesc: " Pastes the copied area at the selected location.",
			infoShortcutsTitle: "Keyboard Shortcuts:",
			infoDraw: " Draw with the selected tool.",
			infoSelect: " Select a rectangular area.",
			// --- Keys for palette descriptions ---
			selectToolDesc: 'Select',
			floorDesc: "The Floor",
			wallDesc: "A Wall",
			playerDesc: "Player Start",
			enemyDesc: "An Enemy",
			doorDesc: "A Door",
			lockedDoorDesc: "Locked Door",
			exitDesc: "Level Exit",
			medikitDesc: "Medikit",
			keyDesc: "A Key",
			secretWallDesc: "Secret Wall",
			// --- Keys for dynamic messages ---
			confirmClear: "Are you sure you want to clear the current map?",
			selectFirst: "Please select an area first.",
			nothingToPaste: "Nothing to paste. Please copy an area first.",
			selectPasteLocation: "Please select a cell where you want to paste.",
			levelNumberPrompt: "Please enter the level number:",
			invalidFileFormat: "Invalid data format.",
			fileReadError: "Error while loading file: ",
			copySuccess: (w, h) => `${w}x${h} area copied!`
		},
		// --- SECTION POUR L'ESPAGNOL ---
		es: {
			// --- Clés pour les éléments statiques ---
			editorTitle: "Editor de Niveles",
			newButton: "Nuevo",
			loadButton: "Cargar",
			saveButton: "Guardar (C++)",
			saveAsciiButton: "Guardar (ASCII)",
			copyButton: "Copiar",
			pasteButton: "Pegar",
			exportButton: "Exportar",
			infoButton: "Infos",
			exportTitle: "Código C++ para Exportar:",
			infoModalTitle: "Información del Editor",
			infoDesc1: "Este editor fue creado para el proyecto Doom-Nano-ESP32.",
			infoDesc2: "Usa la paleta para seleccionar un bloque, y luego dibuja en la cuadrícula.",
			infoActionsTitle: "Acciones de los Botones:",
			infoNew: "Nuevo:",
			infoNewDesc: " Borra el mapa actual.",
			infoLoad: "Cargar:",
			infoLoadDesc: " Carga un archivo de datos de nivel (formato .txt).",
			infoSave: "Guardar (C++):",
			infoSaveDesc: " Guarda el código C++ del mapa en un archivo .txt.",
			infoSaveAscii: "Guardar (ASCII):",
			infoSaveAsciiDesc: " Guarda una versión de texto legible del mapa.",
			infoCopy: "Copiar:",
			infoCopyDesc: " Copia el área actualmente seleccionada.",
			infoPaste: "Pegar:",
			infoPasteDesc: " Pega el área copiada en la ubicación seleccionada.",
			infoShortcutsTitle: "Atajos de Teclado:",
			infoDraw: " Dibujar con la herramienta seleccionada.",
			infoSelect: " Seleccionar un área rectangular.",
			// --- Clés pour les descriptions de la palette ---
			selectToolDesc: 'Seleccionar',
			floorDesc: "Suelo (Floor)",
			wallDesc: "Muro (Wall)",
			playerDesc: "Inicio del jugador (Player)",
			enemyDesc: "Un enemigo (Enemy)",
			doorDesc: "Una puerta (Door)",
			lockedDoorDesc: "Puerta bloqueada (Locked Door)",
			exitDesc: "Salida del nivel (Exit)",
			medikitDesc: "Botiquín (Medikit)",
			keyDesc: "Una llave (Key)",
			secretWallDesc: "Muro secreto",
			// --- Clés pour les messages dynamiques ---
			confirmClear: "¿Estás seguro de que quieres borrar el mapa actual?",
			selectFirst: "Por favor, selecciona un área primero.",
			nothingToPaste: "Nada que pegar. Por favor, copia un área primero.",
			selectPasteLocation: "Por favor, selecciona una celda donde pegar.",
			levelNumberPrompt: "Por favor, introduce el número del nivel:",
			invalidFileFormat: "Formato de datos no válido.",
			fileReadError: "Error al cargar el archivo: ",
			copySuccess: (w, h) => `¡Área de ${w}x${h} copiada!`
		}	
	};

    const MAP_WIDTH = 64;
    const MAP_HEIGHT = 57;
    const TILE_LEGEND = {
        SELECT: { char: '', isTool: true, descKey: 'selectToolDesc' },
        FLOOR: { char: '.', value: 0x0, color: '#2d2d2d', descKey: "floorDesc" },
        WALL: { char: '#', value: 0xF, color: '#888', descKey: "wallDesc" },
        PLAYER: { char: 'P', value: 0x1, color: '#0f0', descKey: "playerDesc" },
        ENEMY: { char: 'E', value: 0x2, color: '#f00', descKey: "enemyDesc" },
        DOOR: { char: 'D', value: 0x4, color: '#a60', descKey: "doorDesc" },
        LOCKED_DOOR: { char: 'L', value: 0x5, color: '#f80', descKey: "lockedDoorDesc" },
        SECRET_WALL: { char: 'S', value: 0x6, color: '#a3a3a3', descKey: "secretWallDesc" },
        EXIT: { char: 'X', value: 0x7, color: '#0ff', descKey: "exitDesc" },
        MEDIKIT: { char: 'M', value: 0x8, color: '#f0f', descKey: "medikitDesc" },
        KEY: { char: 'K', value: 0x9, color: '#ff0', descKey: "keyDesc" },
    };
    const VALUE_TO_COLOR = {};
    const VALUE_TO_CHAR = {};
    for(const key in TILE_LEGEND) {
        if (!TILE_LEGEND[key].isTool) {
            const tileInfo = TILE_LEGEND[key];
            VALUE_TO_COLOR[tileInfo.value] = tileInfo.color;
            VALUE_TO_CHAR[tileInfo.value] = tileInfo.char;
        }
    }

    const langSwitcher = document.getElementById('lang-switcher');
    const paletteContainer = document.getElementById('palette');
    const mapGridContainer = document.getElementById('map-grid');
    const outputTextarea = document.getElementById('output-data');
    const newBtn = document.getElementById('new-btn');
    const loadBtn = document.getElementById('load-btn');
    const saveBtn = document.getElementById('save-btn');
    const saveAsciiBtn = document.getElementById('save-ascii-btn');
    const exportBtn = document.getElementById('export-btn');
    const infoBtn = document.getElementById('info-btn');
    const copyBtn = document.getElementById('copy-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const fileInput = document.getElementById('file-input');
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.querySelector('.close-btn');

    let currentLang = 'fr';
    let selectedTileKey = 'WALL';
    let mapData = [];
    let isPainting = false;
    let isSelecting = false;
    let selection = { startX: null, startY: null, endX: null, endY: null };
    let copiedData = null;

    function updateUI() {
        const langStrings = translations[currentLang];
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (langStrings[key]) el.textContent = langStrings[key];
        });
        document.querySelectorAll('.palette-entry').forEach(entry => {
            const key = entry.dataset.tileKey || entry.dataset.tool;
            if(key) {
                const descKey = TILE_LEGEND[key.toUpperCase()].descKey;
                entry.querySelector('.palette-label').textContent = langStrings[descKey];
            }
        });
    }
    function newGrid() {
        mapData = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(TILE_LEGEND.WALL.value));
        renderGridFromData();
    }
    function renderGridFromData() {
        const tiles = mapGridContainer.children;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                tiles[y * MAP_WIDTH + x].style.backgroundColor = VALUE_TO_COLOR[mapData[y][x]] || '#000';
            }
        }
    }
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
                if (++byteCount % 32 === 0) outputString += "\n  ";
            }
        }
        outputString = outputString.trim().slice(0, -1);
        outputString += "\n};";
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
    function paintTile(e) {
        if (e.target.classList.contains('tile')) {
            const x = parseInt(e.target.dataset.x);
            const y = parseInt(e.target.dataset.y);
            mapData[y][x] = TILE_LEGEND[selectedTileKey].value;
            e.target.style.backgroundColor = TILE_LEGEND[selectedTileKey].color;
        }
    }

    Object.keys(TILE_LEGEND).forEach(key => {
        const tileInfo = TILE_LEGEND[key];
        const entryContainer = document.createElement('div');
        entryContainer.className = 'palette-entry';
        const keyLower = key.toLowerCase();
        if (tileInfo.isTool) entryContainer.dataset.tool = keyLower;
        else entryContainer.dataset.tileKey = key;
        if(key === 'SELECT') entryContainer.id = 'select-tool-entry';

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
    mapGridContainer.innerHTML = ''; 
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.x = x;
            tile.dataset.y = y;
            mapGridContainer.appendChild(tile);
        }
    }
    newGrid();
    document.querySelector('[data-tile-key="WALL"]').classList.add('selected');

    langSwitcher.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const lang = e.target.dataset.lang;
            if (lang !== currentLang) {
                currentLang = lang;
                langSwitcher.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                updateUI();
            }
        }
    });
    newBtn.addEventListener('click', () => { if (confirm(translations[currentLang].confirmClear)) newGrid(); });
    loadBtn.addEventListener('click', () => fileInput.click());
    saveBtn.addEventListener('click', () => {
        const levelNum = prompt(translations[currentLang].levelNumberPrompt, "2");
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
    });
    exportBtn.addEventListener('click', () => {
        const levelNum = prompt(translations[currentLang].levelNumberPrompt, "2");
        if (!levelNum) return;
        outputTextarea.value = generateCppCode(levelNum);
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                const hexMatch = content.match(/\{([\s\S]*?)\}/);
                if (!hexMatch) throw new Error(translations[currentLang].invalidFileFormat);
                const hexValues = hexMatch[1].match(/0x[0-9A-Fa-f]{1,2}/g).map(h => parseInt(h, 16));
                const loadedMapData = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(0));
                let i = 0;
                for (let y = MAP_HEIGHT - 1; y >= 0; y--) {
                    for (let x = 0; x < MAP_WIDTH; x += 2) {
                        const byteValue = hexValues[i++];
                        if (byteValue === undefined) throw new Error("Fichier de données incomplet.");
                        loadedMapData[y][x] = byteValue >> 4;
                        loadedMapData[y][x + 1] = byteValue & 0x0F;
                    }
                }
                mapData = loadedMapData;
                renderGridFromData();
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
            if (paletteEntry.dataset.tool) {
                selectedTileKey = paletteEntry.dataset.tool.toUpperCase();
            } else {
                selectedTileKey = paletteEntry.dataset.tileKey;
            }
        }
    });
    mapGridContainer.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('tile')) {
            if (e.shiftKey || selectedTileKey === 'SELECT') {
                isSelecting = true;
                selection.startX = parseInt(e.target.dataset.x);
                selection.startY = parseInt(e.target.dataset.y);
                selection.endX = selection.startX;
                selection.endY = selection.startY;
                updateSelectionVisuals();
            } else {
                isPainting = true;
                paintTile(e);
            }
        }
    });
    mapGridContainer.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('tile')) {
            if (isPainting) paintTile(e);
            else if (isSelecting) {
                selection.endX = parseInt(e.target.dataset.x);
                selection.endY = parseInt(e.target.dataset.y);
                updateSelectionVisuals();
            }
        }
    });
    window.addEventListener('mouseup', () => {
        isPainting = false;
        isSelecting = false;
    });
    infoBtn.addEventListener('click', () => infoModal.style.display = 'block');
    closeModalBtn.addEventListener('click', () => infoModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == infoModal) infoModal.style.display = 'none';
    });
    
    updateUI();
});