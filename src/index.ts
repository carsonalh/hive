import * as THREE from 'three';
import {
    BLACK_BEETLE,
    BLACK_GRASSHOPPER,
    BLACK_LADYBUG,
    BLACK_MOSQUITO,
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    BLACK_SPIDER,
    HEXAGON_SHAPE,
    WHITE_BEETLE,
    WHITE_GRASSHOPPER,
    WHITE_LADYBUG,
    WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT,
    WHITE_SPIDER
} from './tiles';
import {HexGrid, HexVector} from './hex-grid';
import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import {
    CAMERA_POSITION_MAX,
    CAMERA_POSITION_MIN,
    SCROLL_FACTOR,
    STACK_HEIGHT_DISTANCE
} from "./constants";
import ErrorModal from "./error-modal";
import {MouseState} from "./types";
import HUD from "./hud";

declare const Go: any;
const go = new Go(); // Create a new Go instance

let game: HiveGame;
let hud: HUD;
let incorrectMoveModal: ErrorModal;

window.onload = async () => {
    const response = await fetch('main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

    incorrectMoveModal = new ErrorModal({message: 'The attempted move was illegal'});

    go.run(instance); // Run the Go instance
    // Can only use WebAssembly imports here
    game = new HiveGame();
    game.debug();

    hud = new HUD(game);
    renderer.setAnimationLoop(animate);
};

let selected: number | HexVector | null = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x175c29);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 10;
camera.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI / 4)

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
const placed = new THREE.Mesh(new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()), new THREE.MeshBasicMaterial({color: 0xff0000}));
placed.rotateZ(1 / 12 * 2 * Math.PI);

const LEFT_BUTTON = 0;
// const MIDDLE_BUTTON = 1;
const RIGHT_BUTTON = 2;
// const BACK_BUTTON = 3;
// const FORWARD_BUTTON = 4;

const mouseState: MouseState = {
    rightButtonDown: false,
    leftButtonDown: false,
    middleButtonDown: false,
};

renderer.domElement.oncontextmenu = _ => {
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

renderer.domElement.onwheel = e => {
    // TODO make this on the axis that the camera is looking at
    let newPosition = camera.position.z + SCROLL_FACTOR * e.deltaY;

    if (newPosition > CAMERA_POSITION_MAX) {
        newPosition = CAMERA_POSITION_MAX;
    } else if (newPosition < CAMERA_POSITION_MIN) {
        newPosition = CAMERA_POSITION_MIN;
    }

    camera.position.z = newPosition;
};

renderer.domElement.onmousemove = e => {
    if (mouseState.rightButtonDown) {
        onRightMouseMove(e);
    }
};

function onRightMouseMove(e: MouseEvent) {
    const raycaster = new THREE.Raycaster();

    const mouseNDC = new THREE.Vector2(
        2 * e.clientX / window.innerWidth - 1,
        -2 * e.clientY / window.innerHeight + 1
    );
    raycaster.setFromCamera(mouseNDC, camera);
    const target = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    raycaster.ray.intersectPlane(plane, target);

    const to = target.clone();

    const previousMouseNDC = new THREE.Vector2(
        2 * (e.clientX + e.movementX) / window.innerWidth - 1,
        -2 * (e.clientY + e.movementY) / window.innerHeight + 1
    );
    raycaster.setFromCamera(previousMouseNDC, camera);
    raycaster.ray.intersectPlane(plane, target);
    const from = target.clone();

    const delta = to.sub(from);
    camera.position.add(delta);
}

function onLeftMouseDown(e: MouseEvent) {
    // hit test for hud first
    if (selected != null) {
        if (typeof selected === 'number') {
            // @ts-ignore
            hud.scene.remove(hud.square)
        } else {
            scene.remove(placed)
        }
    }

    if (hud.onClick(e, mouseState)) {
        return;
    }

    const raycaster = new THREE.Raycaster();
    const clicked = new THREE.Vector2(
        2 * e.clientX / window.innerWidth - 1,
        -2 * e.clientY / window.innerHeight + 1,
    );
    // console.log(clickedWorld)
    const gameSurface = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    raycaster.setFromCamera(clicked, hud.camera);
    const clickedWorld = new THREE.Vector3();
    raycaster.ray.intersectPlane(gameSurface, clickedWorld);
    if (!hud.onClick(e, mouseState)) {
        raycaster.setFromCamera(clicked, camera);
        raycaster.ray.intersectPlane(gameSurface, clickedWorld)
        const hex = grid.euclideanToHex(new THREE.Vector2(clickedWorld.x, clickedWorld.y));
        const hexPosition = grid.hexToEuclidean(hex)
        placed.position.set(hexPosition.x, hexPosition.y, 0);
        scene.add(placed);
        let selectedPieceType: HivePieceType | null;
        if ((selectedPieceType = hud.selectedPieceTypeForPlacement()) != null) { // we have selected a piece and are now clicking to place it
            const color = game.colorToMove();
            const success = game.placeTile(selectedPieceType, hex);

            if (success) {
                let mesh: THREE.Mesh;
                switch (color) {
                    case HiveColor.White:
                        switch (selectedPieceType) {
                            case HivePieceType.QueenBee: mesh = WHITE_QUEEN_BEE.clone(); break;
                            case HivePieceType.SoldierAnt: mesh = WHITE_SOLDIER_ANT.clone(); break;
                            case HivePieceType.Spider: mesh = WHITE_SPIDER.clone(); break;
                            case HivePieceType.Grasshopper: mesh = WHITE_GRASSHOPPER.clone(); break;
                            case HivePieceType.Beetle: mesh = WHITE_BEETLE.clone(); break;
                            case HivePieceType.Ladybug: mesh = WHITE_LADYBUG.clone(); break;
                            case HivePieceType.Mosquito: mesh = WHITE_MOSQUITO.clone(); break;
                        }
                        break;
                    case HiveColor.Black:
                        switch (selectedPieceType) {
                            case HivePieceType.QueenBee: mesh = BLACK_QUEEN_BEE.clone(); break;
                            case HivePieceType.SoldierAnt: mesh = BLACK_SOLDIER_ANT.clone(); break;
                            case HivePieceType.Spider: mesh = BLACK_SPIDER.clone(); break;
                            case HivePieceType.Grasshopper: mesh = BLACK_GRASSHOPPER.clone(); break;
                            case HivePieceType.Beetle: mesh = BLACK_BEETLE.clone(); break;
                            case HivePieceType.Ladybug: mesh = BLACK_LADYBUG.clone(); break;
                            case HivePieceType.Mosquito: mesh = BLACK_MOSQUITO.clone(); break;
                        }
                        break;
                }

                const position2d = grid.hexToEuclidean(hex);
                mesh.position.set(position2d.x, position2d.y, 0);
                scene.add(mesh);
                meshes.set(game.idOfLastPlaced()!, mesh);
            } else {
                incorrectMoveModal.show();
            }

            selected = null;
        } else if (selected instanceof HexVector) {
            // we rely on the facts that 'game' never re-orders the tiles, and that tiles
            // cannot be removed from play
            const tileToMoveId = game.idOfTileAt(selected);

            if (tileToMoveId != null) {
                const success = game.moveTile(selected, hex);

                if (success) {
                    const position2d = grid.hexToEuclidean(hex);
                    meshes.get(tileToMoveId)!.position.set(
                        position2d.x,
                        position2d.y,
                        game.tiles()[tileToMoveId].stackHeight * STACK_HEIGHT_DISTANCE
                    );
                } else {
                    incorrectMoveModal.show();
                }
            }

            selected = null;
        } else {
            selected = hex;
        }

        hud.onUpdate();
    }
}

document.body.appendChild(renderer.domElement);

window.onresize = _ => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    hud.onResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

const grid = new HexGrid();

const meshes = new Map<number, THREE.Mesh>();

function animate() {
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(hud.scene, hud.camera);
}
