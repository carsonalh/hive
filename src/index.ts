import * as THREE from 'three';
import MouseStateTracker from "./mouse-state";
import {renderOverlay} from "./overlay";
import {getStore} from "./store";

declare const Go: any;

window.addEventListener('load', async () => {
    const go = new Go();

    const response = await fetch('/main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject);

    go.run(instance);

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const mouseStateTracker = new MouseStateTracker();

    renderer.domElement.oncontextmenu = () => {
        return false;
    }

    renderer.domElement.onmousedown = e => {
        mouseStateTracker.onMouseDown(e);
        getStore().scene?.onMouseDown(e, mouseStateTracker);
    };

    renderer.domElement.onmouseup = e => {
        mouseStateTracker.onMouseUp(e);
    };

    renderer.domElement.onwheel = e => {
        getStore().scene?.onWheel(e);
    };

    renderer.domElement.onmousemove = e => {
        getStore().scene?.onMouseMove(e, mouseStateTracker);
    };

    document.body.appendChild(renderer.domElement);

    window.onresize = _ => {
        const {scene} = getStore();
        scene?.onResize && scene.onResize();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const clock = new THREE.Clock();

    function animate() {
        const deltaTimeMs = clock.getDelta();
        getStore().scene?.update(deltaTimeMs, mouseStateTracker);
        getStore().scene?.render(renderer);
    }

    renderer.setAnimationLoop(animate);

    renderOverlay();
});

