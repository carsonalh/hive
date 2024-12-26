import {EntityRegistry} from "../entity-registry";

export default abstract class System {
    constructor(protected registry: EntityRegistry) {}
    onCreate(): void {}
    onDestroy(): void {}
    onUpdate(deltaTimeMs: number): void {}
    /** Returns true if propagation should be stopped */
    onMouseDown(e: MouseEvent): boolean { return false; }
    /** Returns true if propagation should be stopped */
    onMouseUp(e: MouseEvent): boolean { return false; }
    /** Returns true if propagation should be stopped */
    onMouseMove(e: MouseEvent): boolean { return false; }
    /** Returns true if propagation should be stopped */
    onWheel(e: WheelEvent): boolean { return false; }
    onResize(): void {}
}