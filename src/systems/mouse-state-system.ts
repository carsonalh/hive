import System from "./system";
import MouseStateComponent from "../components/mouse-state-component";
import {LEFT_BUTTON, MIDDLE_BUTTON, RIGHT_BUTTON} from "../constants";

export default class MouseStateSystem extends System {
    private mouseState() {
        return this.registry.getSingletonComponent(MouseStateComponent);
    }

    onMouseMove(e: MouseEvent): boolean {
        this.mouseState().position.set(e.clientX, e.clientY);
        return false;
    }

    onMouseUp(e: MouseEvent): boolean {
        switch (e.button) {
            case LEFT_BUTTON:
                this.mouseState().leftButtonDown = false;
                break;
            case MIDDLE_BUTTON:
                this.mouseState().middleButtonDown = false;
                break;
            case RIGHT_BUTTON:
                this.mouseState().rightButtonDown = false;
                break;
        }
        return false;
    }

    onMouseDown(e: MouseEvent): boolean {
        switch (e.button) {
            case LEFT_BUTTON:
                this.mouseState().leftButtonDown = true;
                break;
            case MIDDLE_BUTTON:
                this.mouseState().middleButtonDown = true;
                break;
            case RIGHT_BUTTON:
                this.mouseState().rightButtonDown = true;
                break;
        }
        return false;
    }
}