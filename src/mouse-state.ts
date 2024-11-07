import {LEFT_BUTTON, MIDDLE_BUTTON, RIGHT_BUTTON} from "./constants";

export interface MouseState {
    readonly rightButtonDown: boolean;
    readonly leftButtonDown: boolean;
    readonly middleButtonDown: boolean;
}

class MouseStateTracker implements MouseState {
    private right: boolean;
    private left: boolean;
    private middle: boolean;

    public constructor() {
        this.right = false;
        this.left = false;
        this.middle = false;
    }

    public onMouseDown(e: MouseEvent) {
        switch (e.button) {
            case LEFT_BUTTON:
                this.left = true;
                break;
            case RIGHT_BUTTON:
                this.right = true;
                break;
            case MIDDLE_BUTTON:
                this.middle = true;
                break;
        }
    }

    public onMouseUp(e: MouseEvent) {
        switch (e.button) {
            case LEFT_BUTTON:
                this.left = false;
                break;
            case RIGHT_BUTTON:
                this.right = false;
                break;
            case MIDDLE_BUTTON:
                this.middle = false;
                break;
        }
    }

    public get rightButtonDown(): boolean {
        return this.right;
    }

    public get leftButtonDown(): boolean {
        return this.left;
    }

    public get middleButtonDown(): boolean {
        return this.middle;
    }
}

export default MouseStateTracker;
