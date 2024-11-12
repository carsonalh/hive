import * as THREE from 'three';
import {RADIUS} from './constants';
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {hexTileObjSource} from "./hex-tile.obj";
import {HiveColor, HivePieceType} from "./hive-game";

function createHexagonShape() {
    const r = RADIUS * 2 / Math.sqrt(3);
    const shape = new THREE.Shape();
    shape.moveTo(r, 0);

    for (let i = 1; i < 6; i++) {
        const angle = 2 * Math.PI * (i / 6);
        shape.lineTo(r * Math.cos(angle), r * Math.sin(angle));
    }

    shape.lineTo(r, 0);
    shape.closePath();

    return shape;
}

export const HEXAGON_SHAPE = createHexagonShape();

function createTileBasic(backgroundColor: THREE.ColorRepresentation, foregroundColor: THREE.ColorRepresentation,
    imagePath: string): THREE.Mesh {
    const shape = HEXAGON_SHAPE.clone();

    const geometry = new THREE.ExtrudeGeometry(shape, { 
        depth: .5,
        bevelEnabled: false,
    });

    const texture = new THREE.TextureLoader().load(imagePath);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uBackgroundColor: { value: new THREE.Color(backgroundColor) },
            uForegroundColor: { value: new THREE.Color(foregroundColor) },
        },
        vertexShader: `
            varying vec2 vertex_UV;
            void main() {
                vertex_UV = uv * vec2(0.7, 0.7) + vec2(0.5, 0.5);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform vec3 uForegroundColor;
            uniform vec3 uBackgroundColor;
            varying vec2 vertex_UV;

            void main() {
                vec4 textureColor = texture(uTexture, vertex_UV);
                vec3 color = mix(uBackgroundColor, uForegroundColor, textureColor.r);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const hexTile = new THREE.Mesh(geometry, material);

    hexTile.rotateZ(1 / 12 * 2 * Math.PI);

    return hexTile;
}

const WHITE_BACKGROUND = 0xffec8c;
const BLACK_BACKGROUND = 0x000000;
const QUEEN_BEE_COLOUR = 0xff6f00;
const SOLDIER_ANT_COLOUR = 0x40a0f5;
const BEETLE_COLOUR = 0x7e1abd;
const SPIDER_COLOUR = 0x7d502e;
const GRASSHOPPER_COLOUR = 0x087a00;
const LADYBUG_COLOUR = 0xff0000;
const MOSQUITO_COLOUR = 0x888888;

export const WHITE_QUEEN_BEE = createTileBasic(WHITE_BACKGROUND, QUEEN_BEE_COLOUR, 'textures/queenbee.png');
export const WHITE_SOLDIER_ANT = createTileBasic(WHITE_BACKGROUND, SOLDIER_ANT_COLOUR, 'textures/soldierant.png');
export const WHITE_BEETLE = createTileBasic(WHITE_BACKGROUND, BEETLE_COLOUR, 'textures/beetle.png');
export const WHITE_SPIDER = createTileBasic(WHITE_BACKGROUND, SPIDER_COLOUR, 'textures/spider.png');
export const WHITE_GRASSHOPPER = createTileBasic(WHITE_BACKGROUND, GRASSHOPPER_COLOUR, 'textures/grasshopper.png');
export const WHITE_LADYBUG = createTileBasic(WHITE_BACKGROUND, LADYBUG_COLOUR, 'textures/ladybug.png');
export const WHITE_MOSQUITO = createTileBasic(WHITE_BACKGROUND, MOSQUITO_COLOUR, 'textures/mosquito.png');
export const BLACK_QUEEN_BEE = createTileBasic(BLACK_BACKGROUND, QUEEN_BEE_COLOUR, 'textures/queenbee.png');
export const BLACK_SOLDIER_ANT = createTileBasic(BLACK_BACKGROUND, SOLDIER_ANT_COLOUR, 'textures/soldierant.png');
export const BLACK_BEETLE = createTileBasic(BLACK_BACKGROUND, BEETLE_COLOUR, 'textures/beetle.png');
export const BLACK_SPIDER = createTileBasic(BLACK_BACKGROUND, SPIDER_COLOUR, 'textures/spider.png');
export const BLACK_GRASSHOPPER = createTileBasic(BLACK_BACKGROUND, GRASSHOPPER_COLOUR, 'textures/grasshopper.png');
export const BLACK_LADYBUG = createTileBasic(BLACK_BACKGROUND, LADYBUG_COLOUR, 'textures/ladybug.png');
export const BLACK_MOSQUITO = createTileBasic(BLACK_BACKGROUND, MOSQUITO_COLOUR, 'textures/mosquito.png');

async function createPbrTile(foregroundColor: number, backgroundColor: number, shapeUrl: string, normalUrl: string): Promise<THREE.Mesh> {
    const loaded = new OBJLoader().parse(hexTileObjSource);
    const dumpCanvas = document.createElement('canvas');
    dumpCanvas.width = dumpCanvas.height = 1024;
    const loadCanvas = document.createElement('canvas');
    loadCanvas.width = loadCanvas.height = 1024;
    const dumpContext = dumpCanvas.getContext('2d');
    if (dumpContext == null) {
        throw new Error('context cannot be null');
    }
    const loadContext = loadCanvas.getContext('2d');
    if (loadContext == null) {
        throw new Error('context cannot be null');
    }

    const foreground = {
        r: (foregroundColor >>> 16) & 0xff,
        g: (foregroundColor >>> 8) & 0xff,
        b: (foregroundColor >>> 0) & 0xff,
    };

    const background = {
        r: (backgroundColor >>> 16) & 0xff,
        g: (backgroundColor >>> 8) & 0xff,
        b: (backgroundColor >>> 0) & 0xff,
    };

    const textureImage = new Image(1024, 1024);
    textureImage.src = shapeUrl;
    const loadedImageUrl = new Promise<string>(resolve => {
        textureImage.onload = function () {
            textureImage.style.display = 'none';
            dumpContext.drawImage(textureImage, 0, 0);
            const imageData = dumpContext.getImageData(0, 0, dumpCanvas.width, dumpCanvas.height);
            const {data} = imageData;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 128) {
                    data[i] = foreground.r;
                    data[i + 1] = foreground.g;
                    data[i + 2] = foreground.b;
                } else {
                    data[i] = background.r;
                    data[i + 1] = background.g;
                    data[i + 2] = background.b;
                }
            }

            loadContext.putImageData(imageData, 0, 0);
            resolve(loadCanvas.toDataURL('image/png'));
        };
    });

    // const texture = new THREE.TextureLoader().load('textures/queenbee.png');
    // const normalMap = new THREE.TextureLoader().load('textures/queenbee_normal.png');

    let m: THREE.Mesh | null = null;
    loaded.traverse(child => {
        if ((child as any).isMesh) {
            m = child as THREE.Mesh;
        }
    });

    if (m == null) {
        throw new Error('m cannot be null')
    }

    const mesh = m as THREE.Mesh;
    const texture = await new THREE.TextureLoader().loadAsync(await loadedImageUrl);
    const normalMap = await new THREE.TextureLoader().loadAsync(normalUrl);
    mesh.material = new THREE.MeshPhysicalMaterial({
        roughness: .1,
        map: texture,
        normalMap: normalMap,
    });

    mesh.rotateX(Math.PI / 2);
    mesh.scale.multiplyScalar(RADIUS * 2 / Math.sqrt(3));

    return mesh;
}

export async function createTile(color: HiveColor, pieceType: HivePieceType): Promise<THREE.Mesh> {
    if (color == HiveColor.Black) {
        switch (pieceType) {
            case HivePieceType.QueenBee: return createPbrTile(QUEEN_BEE_COLOUR, BLACK_BACKGROUND, 'textures/queenbee.png', 'textures/queenbee_normal.png');
            case HivePieceType.SoldierAnt: return createPbrTile(SOLDIER_ANT_COLOUR, BLACK_BACKGROUND, 'textures/soldierant.png', 'textures/soldierant_normal.png');
            case HivePieceType.Spider: return createPbrTile(SPIDER_COLOUR, BLACK_BACKGROUND, 'textures/spider.png', 'textures/spider_normal.png');
            case HivePieceType.Grasshopper: return createPbrTile(GRASSHOPPER_COLOUR, BLACK_BACKGROUND, 'textures/grasshopper.png', 'textures/grasshopper_normal.png');
            case HivePieceType.Beetle: return createPbrTile(BEETLE_COLOUR, BLACK_BACKGROUND, 'textures/beetle.png', 'textures/beetle_normal.png');
            case HivePieceType.Ladybug: return createPbrTile(LADYBUG_COLOUR, BLACK_BACKGROUND, 'textures/ladybug.png', 'textures/ladybug_normal.png');
            case HivePieceType.Mosquito: return createPbrTile(MOSQUITO_COLOUR, BLACK_BACKGROUND, 'textures/mosquito.png', 'textures/mosquito_normal.png');
        }
    } else {
        switch (pieceType) {
            case HivePieceType.QueenBee: return createPbrTile(QUEEN_BEE_COLOUR, WHITE_BACKGROUND, 'textures/queenbee.png', 'textures/queenbee_normal.png');
            case HivePieceType.SoldierAnt: return createPbrTile(SOLDIER_ANT_COLOUR, WHITE_BACKGROUND, 'textures/soldierant.png', 'textures/soldierant_normal.png');
            case HivePieceType.Spider: return createPbrTile(SPIDER_COLOUR, WHITE_BACKGROUND, 'textures/spider.png', 'textures/spider_normal.png');
            case HivePieceType.Grasshopper: return createPbrTile(GRASSHOPPER_COLOUR, WHITE_BACKGROUND, 'textures/grasshopper.png', 'textures/grasshopper_normal.png');
            case HivePieceType.Beetle: return createPbrTile(BEETLE_COLOUR, WHITE_BACKGROUND, 'textures/beetle.png', 'textures/beetle_normal.png');
            case HivePieceType.Ladybug: return createPbrTile(LADYBUG_COLOUR, WHITE_BACKGROUND, 'textures/ladybug.png', 'textures/ladybug_normal.png');
            case HivePieceType.Mosquito: return createPbrTile(MOSQUITO_COLOUR, WHITE_BACKGROUND, 'textures/mosquito.png', 'textures/mosquito_normal.png');
        }
    }
}

// export const WHITE_QUEEN_BEE = createTilePbr(WHITE_BACKGROUND, QUEEN_BEE_COLOUR, 'textures/queenbee.png');
// export const WHITE_SOLDIER_ANT = createTilePbr(WHITE_BACKGROUND, SOLDIER_ANT_COLOUR, 'textures/soldierant.png');
// export const WHITE_BEETLE = createTilePbr(WHITE_BACKGROUND, BEETLE_COLOUR, 'textures/beetle.png');
// export const WHITE_SPIDER = createTilePbr(WHITE_BACKGROUND, SPIDER_COLOUR, 'textures/spider.png');
// export const WHITE_GRASSHOPPER = createTilePbr(WHITE_BACKGROUND, GRASSHOPPER_COLOUR, 'textures/grasshopper.png');
// export const WHITE_LADYBUG = createTilePbr(WHITE_BACKGROUND, LADYBUG_COLOUR, 'textures/ladybug.png');
// export const WHITE_MOSQUITO = createTilePbr(WHITE_BACKGROUND, MOSQUITO_COLOUR, 'textures/mosquito.png');
// export const BLACK_QUEEN_BEE = createTilePbr(BLACK_BACKGROUND, QUEEN_BEE_COLOUR, 'textures/queenbee.png');
// export const BLACK_SOLDIER_ANT = createTilePbr(BLACK_BACKGROUND, SOLDIER_ANT_COLOUR, 'textures/soldierant.png');
// export const BLACK_BEETLE = createTilePbr(BLACK_BACKGROUND, BEETLE_COLOUR, 'textures/beetle.png');
// export const BLACK_SPIDER = createTilePbr(BLACK_BACKGROUND, SPIDER_COLOUR, 'textures/spider.png');
// export const BLACK_GRASSHOPPER = createTilePbr(BLACK_BACKGROUND, GRASSHOPPER_COLOUR, 'textures/grasshopper.png');
// export const BLACK_LADYBUG = createTilePbr(BLACK_BACKGROUND, LADYBUG_COLOUR, 'textures/ladybug.png');
// export const BLACK_MOSQUITO = createTilePbr(BLACK_BACKGROUND, MOSQUITO_COLOUR, 'textures/mosquito.png');
