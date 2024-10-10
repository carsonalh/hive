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

const LEFT_BUTTON = 0;
const MIDDLE_BUTTON = 1;
const RIGHT_BUTTON = 2;
const BACK_BUTTON = 3;
const FORWARD_BUTTON = 4;

const mouseState = {
    rightButtonDown: false,
};

renderer.domElement.oncontextmenu = e => {
    return false;
}

renderer.domElement.onmousedown = e => {
    switch (e.button) {
        case LEFT_BUTTON:
            onLeftMouseDown(e);
            break;
        case RIGHT_BUTTON:
            mouseState.rightButtonDown = true;
            break;
    }
};

renderer.domElement.onmouseup = e => {
    switch (e.button) {
        case RIGHT_BUTTON:
            mouseState.rightButtonDown = false;
            break;
    }
};

renderer.domElement.onmousemove = e => {
    if (mouseState.rightButtonDown) {
        onRightMouseMove(e.movementX, e.movementY);
    }
};

function onRightMouseMove(deltaX: number, deltaY: number) {
    const delta = new THREE.Vector3(deltaX, -deltaY, 0);
    delta.multiply({ x: 2 / window.innerWidth, y: 2 / window.innerHeight, z: 0 });
    delta.applyMatrix4(camera.projectionMatrixInverse);
    delta.z = 0;
    camera.position.sub(delta);
    // TODO make a bounding box for the camera
}

function onLeftMouseDown(e: MouseEvent) {
    const clicked = new THREE.Vector3(e.clientX, e.clientY, 0);
    // to screen coords
    clicked.applyMatrix4(new THREE.Matrix4(
        2 / window.innerWidth, 0, 0, -1,
        0, -2 / window.innerHeight, 0, 1,
        0, 0, 1, 0,
        0, 0, 0, 1
    ));
    clicked.applyMatrix4(camera.projectionMatrixInverse);
    clicked.add(camera.position);
    if (placed != null) {
        scene.remove(placed);
    }
    const shape = HEXAGON_SHAPE.clone();
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    const hex = grid.euclideanToHex(new THREE.Vector2(clicked.x, clicked.y));
    const hexPosition = grid.hexToEuclidean(hex)
    marker.position.set(hexPosition.x, hexPosition.y, 0);
    marker.rotateZ(1 / 12 * 2 * Math.PI)
    scene.add(marker);
    placed = marker;
}

document.body.appendChild(renderer.domElement);

window.onresize = e => {
    camera.top = 5 * window.innerHeight / window.innerWidth;
    camera.bottom = -5 * window.innerHeight / window.innerWidth;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

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
    tile.position.set(position2d.x, position2d.y, 0);
    scene.add(tile);
}

camera.position.z = 5;

function animate() {
    renderer.render(scene, camera);
}
