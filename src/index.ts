import * as THREE from 'three';
import MouseStateTracker from "./mouse-state";
import NavigationOverlay, {GameplayMode} from "./navigation-overlay";
import OnlineScene from "./online-scene";
import LocalScene from "./local-scene";
import {GameplayScene} from "./gameplay-scene";

declare const Go: any;
const go = new Go(); // Create a new Go instance

let gameplay: GameplayScene;
let overlay: NavigationOverlay;

window.onload = async () => {
    const response = await fetch('main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

    go.run(instance); // Run the Go instance

    overlay = new NavigationOverlay(onGameplayModeChange);
    renderer.setAnimationLoop(animate);
};

async function onGameplayModeChange(mode: GameplayMode) {
    gameplay?.cleanup();

    switch (mode) {
    case GameplayMode.Local:
        gameplay = await LocalScene.create();
        break;
    case GameplayMode.Online:
        gameplay = await OnlineScene.create();
        break;
    default:
        throw new Error('illegal state, bad gameplay mode');
    }
}

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const mouseStateTracker = new MouseStateTracker();

renderer.domElement.oncontextmenu = _ => {
    return false;
}

renderer.domElement.onmousedown = e => {
    mouseStateTracker.onMouseDown(e);
    gameplay?.onMouseDown(e, mouseStateTracker);
};

renderer.domElement.onmouseup = e => {
    mouseStateTracker.onMouseUp(e);
};

renderer.domElement.onwheel = e => {
    gameplay?.onWheel(e);
};

renderer.domElement.onmousemove = e => {
    gameplay?.onMouseMove(e, mouseStateTracker);
};

document.body.appendChild(renderer.domElement);

window.onresize = _ => {
    gameplay?.onResize && gameplay.onResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

const clock = new THREE.Clock();

function animate() {
    const deltaTimeMs = clock.getDelta();
    gameplay?.update(deltaTimeMs, mouseStateTracker);
    gameplay?.render(renderer);
}
