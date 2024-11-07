import * as THREE from 'three';
import {HiveGame} from "./hive-game";
import HUD from "./hud";
import MouseStateTracker from "./mouse-state";
import Gameplay from "./gameplay";
import {LEFT_BUTTON} from "./constants";

declare const Go: any;
const go = new Go(); // Create a new Go instance

let game: HiveGame;
let hud: HUD;
let gameplay: Gameplay;

window.onload = async () => {
    const response = await fetch('main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

    go.run(instance); // Run the Go instance
    // Can only use WebAssembly imports here
    game = new HiveGame();
    game.debug();

    hud = new HUD(game);
    gameplay = new Gameplay(game, hud);
    renderer.setAnimationLoop(animate);
};

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;

const mouseStateTracker = new MouseStateTracker();

renderer.domElement.oncontextmenu = _ => {
    return false;
}

renderer.domElement.onmousedown = e => {
    mouseStateTracker.onMouseDown(e);
    switch (e.button) {
        case LEFT_BUTTON:
            onLeftMouseDown(e);
            break;
    }
};

renderer.domElement.onmouseup = e => {
    mouseStateTracker.onMouseUp(e);
};

renderer.domElement.onwheel = e => {
    gameplay.onWheel(e);
};

renderer.domElement.onmousemove = e => {
    gameplay.onMouseMove(e, mouseStateTracker);
};

function onLeftMouseDown(e: MouseEvent) {
    if (hud.onClick(e, mouseStateTracker)) {
        gameplay.onClickAway();
        return;
    }

    gameplay.onClick(e, mouseStateTracker);
    hud.onClickAway();

    hud.onUpdate();
}

document.body.appendChild(renderer.domElement);

window.onresize = _ => {
    gameplay.onResize();
    hud.onResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

function animate(deltaTimeMs: number) {
    gameplay.onUpdate(deltaTimeMs, mouseStateTracker);

    renderer.clear();
    renderer.render(gameplay.scene, gameplay.camera);
    renderer.clearDepth();
    renderer.render(hud.scene, hud.camera);
}
