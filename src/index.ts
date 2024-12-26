import {renderOverlay} from "./overlay";
import {initialise} from "./game-store";

declare const Go: any;

window.addEventListener('load', async () => {
    const go = new Go();

    const response = await fetch('/main.wasm');
    const buffer = await response.arrayBuffer();
    const {instance} = await WebAssembly.instantiate(buffer, go.importObject);

    go.run(instance);

    initialise();

    renderOverlay();
});

