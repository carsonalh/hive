import * as THREE from 'three';
import { RADIUS, TILE_GAP } from './constants';

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

function createTile(backgroundColor: THREE.ColorRepresentation, foregroundColor: THREE.ColorRepresentation,
    imagePath: string) {
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
                vec3 color = mix(uBackgroundColor, uForegroundColor, textureColor.a);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const hexTile = new THREE.Mesh(geometry, material);

    hexTile.rotateZ(1 / 12 * 2 * Math.PI);

    return hexTile;
}

const WHITE_BACKGROUND = 0xEDE8D0;
const BLACK_BACKGROUND = 0x000000;
const QUEEN_BEE_COLOUR = 0xFFFF00;
const SOLDIER_ANT_COLOUR = 0x40a0f5;
const BEETLE_COLOUR = 0x7e1abd;
const SPIDER_COLOUR = 0x7d502e;
const GRASSHOPPER_COLOUR = 0x61ad15;
const LADYBUG_COLOUR = 0xff0000;
const MOSQUITO_COLOUR = 0x888888;

export const WHITE_QUEEN_BEE = createTile(WHITE_BACKGROUND, QUEEN_BEE_COLOUR, 'textures/queenbee.png');
export const WHITE_SOLDIER_ANT = createTile(WHITE_BACKGROUND, SOLDIER_ANT_COLOUR, 'textures/soldierant.png');
export const WHITE_BEETLE = createTile(WHITE_BACKGROUND, BEETLE_COLOUR, 'textures/beetle.png');
export const WHITE_SPIDER = createTile(WHITE_BACKGROUND, SPIDER_COLOUR, 'textures/spider.png');
export const WHITE_GRASSHOPPER = createTile(WHITE_BACKGROUND, GRASSHOPPER_COLOUR, 'textures/grasshopper.png');
export const WHITE_LADYBUG = createTile(WHITE_BACKGROUND, LADYBUG_COLOUR, 'textures/ladybug.png');
export const WHITE_MOSQUITO = createTile(WHITE_BACKGROUND, MOSQUITO_COLOUR, 'textures/mosquito.png');
export const BLACK_QUEEN_BEE = createTile(BLACK_BACKGROUND, QUEEN_BEE_COLOUR, 'textures/queenbee.png');
export const BLACK_SOLDIER_ANT = createTile(BLACK_BACKGROUND, SOLDIER_ANT_COLOUR, 'textures/soldierant.png');
export const BLACK_BEETLE = createTile(BLACK_BACKGROUND, BEETLE_COLOUR, 'textures/beetle.png');
export const BLACK_SPIDER = createTile(BLACK_BACKGROUND, SPIDER_COLOUR, 'textures/spider.png');
export const BLACK_GRASSHOPPER = createTile(BLACK_BACKGROUND, GRASSHOPPER_COLOUR, 'textures/grasshopper.png');
export const BLACK_LADYBUG = createTile(BLACK_BACKGROUND, LADYBUG_COLOUR, 'textures/ladybug.png');
export const BLACK_MOSQUITO = createTile(BLACK_BACKGROUND, MOSQUITO_COLOUR, 'textures/mosquito.png');