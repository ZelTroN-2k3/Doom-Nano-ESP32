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
    previewCtx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
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
                if (mapData[mapY][mapX] > 0 && ![0x1, 0xB, 0xC, 0xD].includes(mapData[mapY][mapX])) hit = 1;
            } else { hit = 1; }
        }

        if (side === 0) { perpWallDist = (mapX - previewPlayer.pos.x + (1 - stepX) / 2) / rayDirX; }
        else { perpWallDist = (mapY - previewPlayer.pos.y + (1 - stepY) / 2) / rayDirY; }

        const lineHeight = Math.floor(PREVIEW_HEIGHT / perpWallDist);
        let drawStart = -lineHeight / 2 + PREVIEW_HEIGHT / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + PREVIEW_HEIGHT / 2;
        if (drawEnd >= PREVIEW_HEIGHT) drawEnd = PREVIEW_HEIGHT;

        const blockValue = mapData[mapY][mapX];
        const hexColor = VALUE_TO_COLOR[blockValue] || '#888888';
        let baseRgb = hexToRgb(hexColor);
        if (baseRgb) {
            let shade = 1.0 - Math.min(1, perpWallDist / 15);
            if (side === 1) shade *= 0.7;
            const finalR = Math.floor(baseRgb.r * shade);
            const finalG = Math.floor(baseRgb.g * shade);
            const finalB = Math.floor(baseRgb.b * shade);
            previewCtx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
            previewCtx.fillRect(x, drawStart, 1, drawEnd - drawStart);
        }
    }
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
    if (!isPreviewFocused) return;
    const oldPosX = previewPlayer.pos.x;
    const oldPosY = previewPlayer.pos.y;
    if (keysPressed['ArrowUp']) { previewPlayer.pos.x += previewPlayer.dir.x * MOVE_SPEED; previewPlayer.pos.y += previewPlayer.dir.y * MOVE_SPEED; }
    if (keysPressed['ArrowDown']) { previewPlayer.pos.x -= previewPlayer.dir.x * MOVE_SPEED; previewPlayer.pos.y -= previewPlayer.dir.y * MOVE_SPEED; }
    const mapCheckX = Math.floor(previewPlayer.pos.x);
    const mapCheckY = Math.floor(previewPlayer.pos.y);
    if (mapData[mapCheckY][mapCheckX] === TILE_LEGEND.WALL.value || mapData[mapCheckY][mapCheckX] === TILE_LEGEND.SECRET_WALL.value) {
        previewPlayer.pos.x = oldPosX; previewPlayer.pos.y = oldPosY;
    }
    if (keysPressed['ArrowRight']) {
        const oldDirX = previewPlayer.dir.x;
        previewPlayer.dir.x = previewPlayer.dir.x * Math.cos(-ROT_SPEED) - previewPlayer.dir.y * Math.sin(-ROT_SPEED);
        previewPlayer.dir.y = oldDirX * Math.sin(-ROT_SPEED) + previewPlayer.dir.y * Math.cos(-ROT_SPEED);
        const oldPlaneX = previewPlayer.plane.x;
        previewPlayer.plane.x = previewPlayer.plane.x * Math.cos(-ROT_SPEED) - previewPlayer.plane.y * Math.sin(-ROT_SPEED);
        previewPlayer.plane.y = oldPlaneX * Math.sin(-ROT_SPEED) + previewPlayer.plane.y * Math.cos(-ROT_SPEED);
    }
    if (keysPressed['ArrowLeft']) {
        const oldDirX = previewPlayer.dir.x;
        previewPlayer.dir.x = previewPlayer.dir.x * Math.cos(ROT_SPEED) - previewPlayer.dir.y * Math.sin(ROT_SPEED);
        previewPlayer.dir.y = oldDirX * Math.sin(ROT_SPEED) + previewPlayer.dir.y * Math.cos(ROT_SPEED);
        const oldPlaneX = previewPlayer.plane.x;
        previewPlayer.plane.x = previewPlayer.plane.x * Math.cos(ROT_SPEED) - previewPlayer.plane.y * Math.sin(ROT_SPEED);
        previewPlayer.plane.y = oldPlaneX * Math.sin(ROT_SPEED) + previewPlayer.plane.y * Math.cos(ROT_SPEED);
    }
}

function previewAnimationLoop() {
    updatePlayerMovement();
    renderPreview();
    requestAnimationFrame(previewAnimationLoop);
}