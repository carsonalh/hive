import {MouseState} from "./mouse-state";
import * as THREE from "three";

export interface GameplayScene {
    onResize(): void;
    onMouseDown(e: MouseEvent, mouseStateTracker: MouseState): void;
    onWheel(e: WheelEvent): void;
    onMouseMove(e: MouseEvent, mouseStateTracker: MouseState): void;
    update(deltaTimeMs: number, mouseStateTracker: MouseState): void;
    render(renderer: THREE.WebGLRenderer): void;
    cleanup(): void; // mostly just for taking dom elements of the screen, gc handles the rest
}