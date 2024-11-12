import * as THREE from 'three'
import {
    CAMERA_ANGLE_LERP,
    CAMERA_LERP,
    CAMERA_POSITION_MAX,
    CAMERA_POSITION_MIN,
    EPSILON,
    SCROLL_FACTOR
} from "./constants";
import {MouseState} from "./mouse-state";
import {rotateAboutVector} from "./util";

class CameraController {
    private cam: THREE.PerspectiveCamera;
    private ground: THREE.Vector3;
    /** 0 <= angle <= pi / 2, typically closer to pi / 2 */
    private latitudeRadians: number = Math.PI / 2;
    /** -pi / 6 <= angle <= pi / 6, typically closer to 0 */
    private longitudeRadians: number = 0.0;
    private distance: number = 10.0;
    private midpoint: THREE.Vector3;

    public constructor() {
        this.cam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.cam.up = new THREE.Vector3(0, 0, 1);

        this.midpoint = new THREE.Vector3();
        this.ground = this.midpoint.clone();
        this.updateCameraFromGroundAndAngles();
    }

    public onResize() {
        this.cam.aspect = window.innerWidth / window.innerHeight;
        this.cam.updateProjectionMatrix();
    }

    public onWheel(e: WheelEvent) {
        this.distance += SCROLL_FACTOR * e.deltaY * this.distance;

        if (this.distance > CAMERA_POSITION_MAX) {
            this.distance = CAMERA_POSITION_MAX;
        }

        if (this.distance < CAMERA_POSITION_MIN) {
            this.distance = CAMERA_POSITION_MIN;
        }
    }

    public onMouseMove(e: MouseEvent, state: MouseState): void {
        if (!state.rightButtonDown) {
            return;
        }

        const ROTATE_FACTOR = 0.01;

        this.latitudeRadians += ROTATE_FACTOR * e.movementY;
        if (this.latitudeRadians > Math.PI / 2) {
            this.latitudeRadians = Math.PI / 2 - EPSILON;
        }
        if (this.latitudeRadians < .01) {
            this.latitudeRadians = .01;
        }

        this.longitudeRadians += -ROTATE_FACTOR * e.movementX;
        if (Math.abs(this.longitudeRadians) > Math.PI / 6) {
            this.longitudeRadians = Math.sign(this.longitudeRadians) * Math.PI / 6 - EPSILON;
        }

        this.updateCameraFromGroundAndAngles();
    }

    public onUpdate(deltaTimeMs: number, state: MouseState): void {
        this.ground.lerp(this.midpoint, deltaTimeMs * CAMERA_LERP);
        const GOAL_LATITUDE = Math.PI / 2 - EPSILON;
        const GOAL_LONGITUDE = 0;
        if (!state.rightButtonDown) {
            this.latitudeRadians += deltaTimeMs * CAMERA_ANGLE_LERP * (GOAL_LATITUDE - this.latitudeRadians);
            this.longitudeRadians += deltaTimeMs * CAMERA_ANGLE_LERP * (GOAL_LONGITUDE - this.longitudeRadians);
        }
        this.updateCameraFromGroundAndAngles();
    }

    public onMidpointChange(midpoint: THREE.Vector3): void {
        this.midpoint = midpoint;
    }

    public get camera(): THREE.Camera {
        return this.cam;
    }

    private updateCameraFromGroundAndAngles(): void {
        const z = new THREE.Vector3(0, 0, 1);
        const v = new THREE.Vector3(1, 0, 0);
        rotateAboutVector(v, new THREE.Vector3(0, -1, 0), this.latitudeRadians);
        rotateAboutVector(v, z, this.longitudeRadians);
        v.multiplyScalar(this.distance);
        v.add(this.ground);
        this.cam.position.copy(v);
        this.cam.lookAt(this.ground);
    }
}

export default CameraController;
