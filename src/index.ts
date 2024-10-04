import * as THREE from 'three';
import { BLACK_QUEEN_BEE, BLACK_SOLDIER_ANT, RADIUS, TILE_GAP, WHITE_QUEEN_BEE, WHITE_SOLDIER_ANT } from './tiles';
import { HexGrid, HexVector } from './hex-grid';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x175c29);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const camera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const grid = new HexGrid();

const tiles: [THREE.Mesh, HexVector][] = [
    [WHITE_QUEEN_BEE, new HexVector(0, 0)],
    [WHITE_SOLDIER_ANT, new HexVector(0, 1)],
    [BLACK_QUEEN_BEE, new HexVector(1, 0)],
    [BLACK_SOLDIER_ANT, new HexVector(1, 1)]
];

for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i][0].clone();
    const position2d = grid.hexToEuclidean(tiles[i][1]);
    console.log(`with position ${tiles[i][1]}`)
    console.log(`mapping to ${position2d.x}, ${position2d.y}`)
    tile.position.set(position2d.x, position2d.y, 0);
    scene.add(tile);
}

camera.position.z = 5;

function animate() {
    renderer.render(scene, camera);
}
