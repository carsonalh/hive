import * as THREE from 'three';
import {RADIUS} from './constants';
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {hexTileObjSource} from "./hex-tile.obj";
import {HiveColor, HivePieceType} from "./hive-game";
import {hexTileSimplifiedObj} from "./hex-tile-simplified.obj";

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
    const model = new OBJLoader().parse(hexTileSimplifiedObj);
    let m: THREE.Mesh | null = null;
    model.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
            m = child as THREE.Mesh;
        }
    });
    if (m == null) {
        throw new Error('expected to find a mesh when loading hex tile');
    }

    const mesh = m as THREE.Mesh;

    const texture = new THREE.TextureLoader().load(imagePath);

    mesh.material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uBackgroundColor: { value: new THREE.Color(backgroundColor) },
            uForegroundColor: { value: new THREE.Color(foregroundColor) },
        },
        vertexShader: `
            varying vec2 vertex_UV;
            void main() {
                vertex_UV = uv;
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

    mesh.rotateX(Math.PI / 2);

    const s = RADIUS * 2 / Math.sqrt(3);
    mesh.geometry.scale(s, s, s);

    return mesh;
}

namespace pbr {
    export const WHITE_BACKGROUND = 0xffec8c;
    export const BLACK_BACKGROUND = 0x000000;
    export const QUEEN_BEE_COLOUR = 0xff6f00;
    export const SOLDIER_ANT_COLOUR = 0x3098F4;
    export const BEETLE_COLOUR = 0xA646E3;
    export const SPIDER_COLOUR = 0x551B0B;
    export const GRASSHOPPER_COLOUR = 0x20F312;
    export const LADYBUG_COLOUR = 0xA40006;
    export const MOSQUITO_COLOUR = 0x888888;
}

namespace basic {
    export const WHITE_BACKGROUND = 0xEDE8D0;
    export const BLACK_BACKGROUND = 0x404040;
    export const QUEEN_BEE_COLOUR = 0xFDCF00;
    export const SOLDIER_ANT_COLOUR = 0x87C3F6;
    export const BEETLE_COLOUR = 0xBFA1ED;
    export const SPIDER_COLOUR = 0xC48120;
    export const GRASSHOPPER_COLOUR = 0x7FE262;
    export const LADYBUG_COLOUR = 0xE61717;
    export const MOSQUITO_COLOUR = 0xC8C8C8;
}

export const WHITE_QUEEN_BEE = createTileBasic(basic.WHITE_BACKGROUND, basic.QUEEN_BEE_COLOUR, '/textures/queenbee.png');
export const WHITE_SOLDIER_ANT = createTileBasic(basic.WHITE_BACKGROUND, basic.SOLDIER_ANT_COLOUR, '/textures/soldierant.png');
export const WHITE_BEETLE = createTileBasic(basic.WHITE_BACKGROUND, basic.BEETLE_COLOUR, '/textures/beetle.png');
export const WHITE_SPIDER = createTileBasic(basic.WHITE_BACKGROUND, basic.SPIDER_COLOUR, '/textures/spider.png');
export const WHITE_GRASSHOPPER = createTileBasic(basic.WHITE_BACKGROUND, basic.GRASSHOPPER_COLOUR, '/textures/grasshopper.png');
export const WHITE_LADYBUG = createTileBasic(basic.WHITE_BACKGROUND, basic.LADYBUG_COLOUR, '/textures/ladybug.png');
export const WHITE_MOSQUITO = createTileBasic(basic.WHITE_BACKGROUND, basic.MOSQUITO_COLOUR, '/textures/mosquito.png');
export const BLACK_QUEEN_BEE = createTileBasic(basic.BLACK_BACKGROUND, basic.QUEEN_BEE_COLOUR, '/textures/queenbee.png');
export const BLACK_SOLDIER_ANT = createTileBasic(basic.BLACK_BACKGROUND, basic.SOLDIER_ANT_COLOUR, '/textures/soldierant.png');
export const BLACK_BEETLE = createTileBasic(basic.BLACK_BACKGROUND, basic.BEETLE_COLOUR, '/textures/beetle.png');
export const BLACK_SPIDER = createTileBasic(basic.BLACK_BACKGROUND, basic.SPIDER_COLOUR, '/textures/spider.png');
export const BLACK_GRASSHOPPER = createTileBasic(basic.BLACK_BACKGROUND, basic.GRASSHOPPER_COLOUR, '/textures/grasshopper.png');
export const BLACK_LADYBUG = createTileBasic(basic.BLACK_BACKGROUND, basic.LADYBUG_COLOUR, '/textures/ladybug.png');
export const BLACK_MOSQUITO = createTileBasic(basic.BLACK_BACKGROUND, basic.MOSQUITO_COLOUR, '/textures/mosquito.png');

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

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
}

export async function createTile(color: HiveColor, pieceType: HivePieceType): Promise<THREE.Mesh> {
    if (color == HiveColor.Black) {
        switch (pieceType) {
            case HivePieceType.QueenBee: return createPbrTile(pbr.QUEEN_BEE_COLOUR, pbr.BLACK_BACKGROUND, '/textures/queenbee.png', '/textures/queenbee_normal.png');
            case HivePieceType.SoldierAnt: return createPbrTile(pbr.SOLDIER_ANT_COLOUR, pbr.BLACK_BACKGROUND, '/textures/soldierant.png', '/textures/soldierant_normal.png');
            case HivePieceType.Spider: return createPbrTile(pbr.SPIDER_COLOUR, pbr.BLACK_BACKGROUND, '/textures/spider.png', '/textures/spider_normal.png');
            case HivePieceType.Grasshopper: return createPbrTile(pbr.GRASSHOPPER_COLOUR, pbr.BLACK_BACKGROUND, '/textures/grasshopper.png', '/textures/grasshopper_normal.png');
            case HivePieceType.Beetle: return createPbrTile(pbr.BEETLE_COLOUR, pbr.BLACK_BACKGROUND, '/textures/beetle.png', '/textures/beetle_normal.png');
            case HivePieceType.Ladybug: return createPbrTile(pbr.LADYBUG_COLOUR, pbr.BLACK_BACKGROUND, '/textures/ladybug.png', '/textures/ladybug_normal.png');
            case HivePieceType.Mosquito: return createPbrTile(pbr.MOSQUITO_COLOUR, pbr.BLACK_BACKGROUND, '/textures/mosquito.png', '/textures/mosquito_normal.png');
        }
    } else {
        switch (pieceType) {
            case HivePieceType.QueenBee: return createPbrTile(pbr.QUEEN_BEE_COLOUR, pbr.WHITE_BACKGROUND, '/textures/queenbee.png', '/textures/queenbee_normal.png');
            case HivePieceType.SoldierAnt: return createPbrTile(pbr.SOLDIER_ANT_COLOUR, pbr.WHITE_BACKGROUND, '/textures/soldierant.png', '/textures/soldierant_normal.png');
            case HivePieceType.Spider: return createPbrTile(pbr.SPIDER_COLOUR, pbr.WHITE_BACKGROUND, '/textures/spider.png', '/textures/spider_normal.png');
            case HivePieceType.Grasshopper: return createPbrTile(pbr.GRASSHOPPER_COLOUR, pbr.WHITE_BACKGROUND, '/textures/grasshopper.png', '/textures/grasshopper_normal.png');
            case HivePieceType.Beetle: return createPbrTile(pbr.BEETLE_COLOUR, pbr.WHITE_BACKGROUND, '/textures/beetle.png', '/textures/beetle_normal.png');
            case HivePieceType.Ladybug: return createPbrTile(pbr.LADYBUG_COLOUR, pbr.WHITE_BACKGROUND, '/textures/ladybug.png', '/textures/ladybug_normal.png');
            case HivePieceType.Mosquito: return createPbrTile(pbr.MOSQUITO_COLOUR, pbr.WHITE_BACKGROUND, '/textures/mosquito.png', '/textures/mosquito_normal.png');
        }
    }
}
