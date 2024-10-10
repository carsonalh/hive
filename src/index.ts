import * as THREE from 'three';
import { BLACK_QUEEN_BEE, BLACK_SOLDIER_ANT, HEXAGON_SHAPE, WHITE_QUEEN_BEE, WHITE_SOLDIER_ANT } from './tiles';
import { HexGrid, HexVector } from './hex-grid';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x175c29);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const camera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
let placed: THREE.Mesh | null = null;
renderer.domElement.onmousedown = e => {
    const point = new THREE.Vector2(
        2 * (e.clientX / window.innerWidth) - 1,
        2 * (e.clientY / window.innerHeight) - 1
    );
    point.multiply({ x: 5, y: -5 * window.innerHeight / window.innerWidth });
    if (placed != null) {
        scene.remove(placed);
    }
    const shape = HEXAGON_SHAPE.clone();
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    const hex = grid.euclideanToHex(point);
    console.log(`clicked on hex ${hex}`);
    const hexPosition = grid.hexToEuclidean(hex)
    marker.position.set(hexPosition.x, hexPosition.y, 0);
    marker.rotateZ(1 / 12 * 2 * Math.PI)
    scene.add(marker);
    placed = marker;
    // const pointGeometry = new THREE.SphereGeometry(0.5);
    // const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    // pointMesh.position.set(point.x, point.y, 0);
    // scene.add(pointMesh);
};
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
