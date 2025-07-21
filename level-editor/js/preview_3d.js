const PREVIEW_WIDTH = 128;
const PREVIEW_HEIGHT = 56;
let previewPlayer = { pos: { x: 1.5, y: 1.5 }, dir: { x: 1, y: 0 }, plane: { x: 0, y: 0.66 } };
let isPreviewFocused = false;
const keysPressed = {};
const MOVE_SPEED = 0.05;
const ROT_SPEED = 0.03;

function hexToRgb(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function renderPreview() {
    if (previewCanvas.width !== previewCanvas.clientWidth) {
        previewCanvas.width = previewCanvas.clientWidth;
        previewCanvas.height = previewCanvas.clientHeight;
    }

    const canvasWidth = previewCanvas.width;
    const canvasHeight = previewCanvas.height;
    previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    const zBuffer = new Array(PREVIEW_WIDTH);
    const spritesToRender = [];

    // --- PASSE 1 : DESSINER LES MURS ---
    for (let x = 0; x < PREVIEW_WIDTH; x++) {
        const cameraX = 2 * x / PREVIEW_WIDTH - 1;
        const rayDirX = previewPlayer.dir.x + previewPlayer.plane.x * cameraX;
        const rayDirY = previewPlayer.dir.y + previewPlayer.plane.y * cameraX;

        let mapX = Math.floor(previewPlayer.pos.x);
        let mapY = Math.floor(previewPlayer.pos.y);

        const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
        const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);
        let perpWallDist;
        let stepX, stepY, sideDistX, sideDistY, hit = 0, side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (previewPlayer.pos.x - mapX) * deltaDistX; }
        else { stepX = 1; sideDistX = (mapX + 1.0 - previewPlayer.pos.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (previewPlayer.pos.y - mapY) * deltaDistY; }
        else { stepY = 1; sideDistY = (mapY + 1.0 - previewPlayer.pos.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
            else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            
            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
                const tileValue = mapData[mapY][mapX];
                if (WALL_TILES.includes(tileValue)) {
                    hit = 1;
                }
                if (SPRITE_TILES.includes(tileValue)) {
                    if (!spritesToRender.some(s => s.x === mapX && s.y === mapY)) {
                       spritesToRender.push({ x: mapX, y: mapY, value: tileValue });
                    }
                }
            } else {
                hit = 1;
            }
        }

        if (side === 0) { perpWallDist = (mapX - previewPlayer.pos.x + (1 - stepX) / 2) / rayDirX; }
        else { perpWallDist = (mapY - previewPlayer.pos.y + (1 - stepY) / 2) / rayDirY; }

        zBuffer[x] = perpWallDist;

        const lineHeight = Math.floor(canvasHeight / perpWallDist);
        let drawStart = -lineHeight / 2 + canvasHeight / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + canvasHeight / 2;
        if (drawEnd >= canvasHeight) drawEnd = canvasHeight;

        const blockValue = mapData[mapY][mapX];
        const hexColor = VALUE_TO_COLOR[blockValue] || '#888888';
        let baseRgb = hexToRgb(hexColor);
        if (baseRgb) {
            let shade = 1.0 - Math.min(1, perpWallDist / 15);
            if (side === 1) shade *= 0.7;
            previewCtx.fillStyle = `rgb(${Math.floor(baseRgb.r*shade)}, ${Math.floor(baseRgb.g*shade)}, ${Math.floor(baseRgb.b*shade)})`;
            previewCtx.fillRect(x * (canvasWidth / PREVIEW_WIDTH), drawStart, Math.ceil(canvasWidth / PREVIEW_WIDTH), drawEnd - drawStart);
        }
    }

    // --- PASSE 2 : DESSINER LES SPRITES ---
    spritesToRender.forEach(sprite => {
        sprite.dist = ((previewPlayer.pos.x - (sprite.x + 0.5))**2) + ((previewPlayer.pos.y - (sprite.y + 0.5))**2);
    });
    spritesToRender.sort((a, b) => b.dist - a.dist);

    spritesToRender.forEach(sprite => {
        const spriteImage = spriteImages[sprite.value];
        const spriteX = (sprite.x + 0.5) - previewPlayer.pos.x;
        const spriteY = (sprite.y + 0.5) - previewPlayer.pos.y;
        
        const invDet = 1.0 / (previewPlayer.plane.x * previewPlayer.dir.y - previewPlayer.dir.x * previewPlayer.plane.y);
        const transformX = invDet * (previewPlayer.dir.y * spriteX - previewPlayer.dir.x * spriteY);
        const transformY = invDet * (-previewPlayer.plane.y * spriteX + previewPlayer.plane.x * spriteY);

        if (transformY > 0) {
            const spriteScreenX = Math.floor((canvasWidth / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(canvasHeight / transformY));
            const spriteWidth = spriteHeight;

            let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            let drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);
            let drawStartY = Math.floor(-spriteHeight / 2 + canvasHeight / 2);
            if (drawStartY < 0) drawStartY = 0;
            let drawEndY = Math.floor(spriteHeight / 2 + canvasHeight / 2);
            if (drawEndY >= canvasHeight) drawEndY = canvasHeight;
            
            const columnWidth = canvasWidth / PREVIEW_WIDTH;

            for(let stripe = drawStartX; stripe < drawEndX; stripe++) {
                const screenStripeIndex = Math.floor(stripe / columnWidth);

                if(screenStripeIndex >= 0 && screenStripeIndex < PREVIEW_WIDTH && transformY < zBuffer[screenStripeIndex]) {
                    if (spriteImage) { // Si l'image existe, on la dessine
                        const texWidth = spriteImage.width;
                        const texX = Math.floor(256 * (stripe - (-spriteWidth / 2 + spriteScreenX)) * texWidth / spriteWidth) / 256;

                        const shade = 1.0 - Math.min(1, Math.sqrt(sprite.dist) / 15);
                        previewCtx.globalAlpha = shade;
                        previewCtx.drawImage(spriteImage, texX, 0, 1, spriteImage.height, stripe, drawStartY, 1, spriteHeight);
                        previewCtx.globalAlpha = 1.0;
                    } else { // Sinon, on dessine un carré de couleur (fallback)
                        const hexColor = VALUE_TO_COLOR[sprite.value] || '#ff00ff';
                        let rgb = hexToRgb(hexColor);
                        let shade = 1.0 - Math.min(1, Math.sqrt(sprite.dist) / 15);
                        previewCtx.fillStyle = `rgb(${Math.floor(rgb.r*shade)}, ${Math.floor(rgb.g*shade)}, ${Math.floor(rgb.b*shade)})`;
                        previewCtx.fillRect(stripe, drawStartY, 1, spriteHeight);
                    }
                }
            }
        }
    });
}

function updatePreview() {
    let playerFound = false;
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tileValue = mapData[y][x];
            if ([0x1, 0xB, 0xC, 0xD].includes(tileValue)) {
                previewPlayer.pos = { x: x + 0.5, y: y + 0.5 };
                switch (tileValue) {
                    case 0x1: previewPlayer.dir = { x: 0, y: -1 }; previewPlayer.plane = { x: 0.66, y: 0 }; break;
                    case 0xD: previewPlayer.dir = { x: -1, y: 0 }; previewPlayer.plane = { x: 0, y: -0.66 }; break;
                    case 0xC: previewPlayer.dir = { x: 0, y: 1 }; previewPlayer.plane = { x: -0.66, y: 0 }; break;
                    case 0xB: previewPlayer.dir = { x: 1, y: 0 }; previewPlayer.plane = { x: 0, y: 0.66 }; break;
                }
                playerFound = true;
                break;
            }
        }
        if (playerFound) break;
    }
    if (!playerFound) {
        previewCtx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
    }
}

function updatePlayerMovement() {
    // On ne déplace le joueur que si la fenêtre 3D est active
    if (!isPreviewFocused) return;

    // Sauvegarde de la position pour la détection de collision
    const oldPosX = previewPlayer.pos.x;
    const oldPosY = previewPlayer.pos.y;

    // Avancer (Touche Haut)
    if (keysPressed['ArrowUp']) {
        previewPlayer.pos.x += previewPlayer.dir.x * MOVE_SPEED;
        previewPlayer.pos.y += previewPlayer.dir.y * MOVE_SPEED;
    }
    // Reculer (Touche Bas)
    if (keysPressed['ArrowDown']) {
        previewPlayer.pos.x -= previewPlayer.dir.x * MOVE_SPEED;
        previewPlayer.pos.y -= previewPlayer.dir.y * MOVE_SPEED;
    }

    // Collision simple 
    const mapCheckX = Math.floor(previewPlayer.pos.x);
    const mapCheckY = Math.floor(previewPlayer.pos.y);
    const wallValue = TILE_LEGEND.WALL.value;
    const secretWallValue = TILE_LEGEND.SECRET_WALL.value;

    if (mapData[mapCheckY][mapCheckX] === wallValue || mapData[mapCheckY][mapCheckX] === secretWallValue) {
        previewPlayer.pos.x = oldPosX;
        previewPlayer.pos.y = oldPosY;
    }

    // --- CORRECTION FINALE DE LA ROTATION ---
    // Tourner à droite (Touche Droite)
    if (keysPressed['ArrowRight']) {
        // On utilise l'angle POSITIF pour tourner à droite
        const rotSpeed = ROT_SPEED;
        const oldDirX = previewPlayer.dir.x;
        previewPlayer.dir.x = previewPlayer.dir.x * Math.cos(rotSpeed) - previewPlayer.dir.y * Math.sin(rotSpeed);
        previewPlayer.dir.y = oldDirX * Math.sin(rotSpeed) + previewPlayer.dir.y * Math.cos(rotSpeed);
        const oldPlaneX = previewPlayer.plane.x;
        previewPlayer.plane.x = previewPlayer.plane.x * Math.cos(rotSpeed) - previewPlayer.plane.y * Math.sin(rotSpeed);
        previewPlayer.plane.y = oldPlaneX * Math.sin(rotSpeed) + previewPlayer.plane.y * Math.cos(rotSpeed);
    }
    // Tourner à gauche (Touche Gauche)
    if (keysPressed['ArrowLeft']) {
        // On utilise l'angle NÉGATIF pour tourner à gauche
        const rotSpeed = -ROT_SPEED;
        const oldDirX = previewPlayer.dir.x;
        previewPlayer.dir.x = previewPlayer.dir.x * Math.cos(rotSpeed) - previewPlayer.dir.y * Math.sin(rotSpeed);
        previewPlayer.dir.y = oldDirX * Math.sin(rotSpeed) + previewPlayer.dir.y * Math.cos(rotSpeed);
        const oldPlaneX = previewPlayer.plane.x;
        previewPlayer.plane.x = previewPlayer.plane.x * Math.cos(rotSpeed) - previewPlayer.plane.y * Math.sin(rotSpeed);
        previewPlayer.plane.y = oldPlaneX * Math.sin(rotSpeed) + previewPlayer.plane.y * Math.cos(rotSpeed);
    }
}

function previewAnimationLoop() {
    updatePlayerMovement();
    renderPreview();
    requestAnimationFrame(previewAnimationLoop);
}