import * as THREE from 'three';
import {
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    HEXAGON_SHAPE, WHITE_BEETLE, WHITE_GRASSHOPPER, WHITE_LADYBUG, WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT, WHITE_SPIDER
} from './tiles';
import {HexGrid, HexVector} from './hex-grid';
import {HiveGame, HivePieceType} from "./hive-game";
import {MeshBasicMaterial, ShapeGeometry} from "three";

declare const Go: any;
const go = new Go(); // Create a new Go instance

let game: HiveGame;

window.onload = async () => {
    const response = await fetch('main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

    go.run(instance); // Run the Go instance
    // Can only use WebAssembly imports here
    game = new HiveGame();
    game.debug();
};

const hudScene = new THREE.Scene();
// hudScene.background = null;
const hudCamera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);
const hudTiles = [
    WHITE_QUEEN_BEE.clone(),
    WHITE_SOLDIER_ANT.clone(),
    WHITE_SPIDER.clone(),
    WHITE_GRASSHOPPER.clone(),
    WHITE_BEETLE.clone(),
    WHITE_LADYBUG.clone(),
    WHITE_MOSQUITO.clone()
];

const shape = new THREE.Shape();
shape.moveTo(0, -1);
shape.lineTo(0, 1);
shape.lineTo(10 / 7, 1);
shape.lineTo(10 / 7, -1);
shape.closePath()
const square = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({color: new THREE.Color(0xff0000)}))

let selected: number | HexVector | null = null;

for (let i = 0; i < hudTiles.length; i++) {
    const x = -5 + 10 / 7 * i + (10 / 7) / 2;
    const y = hudCamera.top - 1;

    const tile = hudTiles[i];
    tile.position.set(x, y, 0)
    hudScene.add(tile);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x175c29);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const camera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.autoClear = false;
const placed = new THREE.Mesh(new ShapeGeometry(HEXAGON_SHAPE.clone()), new MeshBasicMaterial({ color: 0xff0000 }));
placed.rotateZ(1 / 12 * 2 * Math.PI);

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
    delta.multiply({x: 2 / window.innerWidth, y: 2 / window.innerHeight, z: 0});
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
    // hit test for hud first
    if (selected != null) {
        if (typeof selected === 'number') {
            hudScene.remove(square)
        } else {
            scene.remove(placed)
        }
    }
    if (clicked.y > camera.top - 2) {
        const tileIndex = Math.floor((clicked.x + 5) * 7 / 10)
        selected = tileIndex;
        square.position.set(-5 + 10 / 7 * tileIndex, hudCamera.top - 1, -1)
        hudScene.add(square);
    } else {
        clicked.add(camera.position);
        const hex = grid.euclideanToHex(new THREE.Vector2(clicked.x, clicked.y));
        const hexPosition = grid.hexToEuclidean(hex)
        placed.position.set(hexPosition.x, hexPosition.y, 0);
        scene.add(placed);
        selected = hex;
    }
}

document.body.appendChild(renderer.domElement);

window.onresize = e => {
    camera.top = 5 * window.innerHeight / window.innerWidth;
    camera.bottom = -5 * window.innerHeight / window.innerWidth;
    camera.updateProjectionMatrix();
    hudCamera.top = 5 * window.innerHeight / window.innerWidth;
    hudCamera.bottom = -5 * window.innerHeight / window.innerWidth;
    hudCamera.updateProjectionMatrix();
    for (const tile of hudTiles) {
        tile.position.y = hudCamera.top - 1;
    }
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
hudCamera.position.z = 5;

function animate() {
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(hudScene, hudCamera);
}
