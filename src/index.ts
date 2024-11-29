import * as THREE from 'three';
import MouseStateTracker from "./mouse-state";
import NavigationOverlay, {GameplayMode} from "./navigation-overlay";
import OnlineScene from "./online-scene";

declare const Go: any;
const go = new Go(); // Create a new Go instance

let gameplay: OnlineScene;
let overlay: NavigationOverlay;

window.onload = async () => {
    const response = await fetch('main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

    go.run(instance); // Run the Go instance

    overlay = new NavigationOverlay(onGameplayModeChange);
    gameplay = await OnlineScene.create();
    renderer.setAnimationLoop(animate);
};

async function onGameplayModeChange(mode: GameplayMode) {
    // TODO clean up the last gameplay
    switch (mode) {
    case GameplayMode.Local:
        throw new Error('local gameplay not implemented');
    case GameplayMode.Online:
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
    gameplay.onMouseDown(e, mouseStateTracker);
};

renderer.domElement.onmouseup = e => {
    mouseStateTracker.onMouseUp(e);
};

renderer.domElement.onwheel = e => {
    gameplay.onWheel(e);
};

renderer.domElement.onmousemove = e => {
    gameplay?.onMouseMove(e, mouseStateTracker);
};

document.body.appendChild(renderer.domElement);

window.onresize = _ => {
    gameplay.onResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

const clock = new THREE.Clock();

function animate() {
    const deltaTimeMs = clock.getDelta();
    gameplay.update(deltaTimeMs, mouseStateTracker);

    gameplay.render(renderer);
}
