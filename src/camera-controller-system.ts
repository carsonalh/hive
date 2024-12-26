import System from "./system";
import {PerspectiveCamera, Vector3} from "three";
import CameraComponent from "./camera-component";
import {EntityRegistry} from "./entity-registry";
import {Entity} from "./entity";
import {
    CAMERA_ANGLE_LERP,
    CAMERA_LERP,
    CAMERA_POSITION_MAX,
    CAMERA_POSITION_MIN,
    EPSILON,
    SCROLL_FACTOR
} from "./constants";
import MouseStateTracker from "./mouse-state";
import {rotateAboutVector} from "./util";
import MeshComponent from "./mesh-component";
import TileComponent from "./tile-component";

export default class CameraControllerSystem extends System {
    private camera = new PerspectiveCamera();
    private state = new MouseStateTracker();
    private entity: Entity = null!;
    private ground = new Vector3(0, 0, 0);
    /** 0 <= angle <= pi / 2, typically closer to pi / 2 */
    private latitudeRadians: number = Math.PI / 2;
    /** -pi / 6 <= angle <= pi / 6, typically closer to 0 */
    private longitudeRadians: number = 0.0;
    private distance: number = 10.0;

    constructor(registry: EntityRegistry) {
        super(registry);

        this.onResize();
        this.camera.up.set(0, 0, 1);

        this.entity = this.registry.addEntity([new CameraComponent(this.camera)]);
    }

    onWheel(e: WheelEvent) {
        this.distance += SCROLL_FACTOR * e.deltaY * this.distance;

        if (this.distance > CAMERA_POSITION_MAX) {
            this.distance = CAMERA_POSITION_MAX;
        }

        if (this.distance < CAMERA_POSITION_MIN) {
            this.distance = CAMERA_POSITION_MIN;
        }

        return false;
    }

    onMouseDown(e: MouseEvent) {
        this.state.onMouseDown(e);

        return false;
    }

    onMouseUp(e: MouseEvent) {
        this.state.onMouseUp(e);

        return false;
    }

    onMouseMove(e: MouseEvent): boolean {
        if (!this.state.rightButtonDown) {
            return false;
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

        return false;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    onUpdate(deltaTimeMs: number): void {
        // the mean of the positions of the tiles
        const midpoint = new Vector3();
        let accounted = 0;
        for (const entity of this.registry.getEntitiesWithComponents(MeshComponent, TileComponent)) {
            midpoint.add(entity.getComponent(MeshComponent).mesh.position);
            accounted++;
        }
        if (accounted > 0) {
            midpoint.multiplyScalar(1 / accounted);
        }

        this.ground.lerp(midpoint, deltaTimeMs * CAMERA_LERP);
        const GOAL_LATITUDE = Math.PI / 2 - EPSILON;
        const GOAL_LONGITUDE = 0;
        if (!this.state.rightButtonDown) {
            this.latitudeRadians += deltaTimeMs * CAMERA_ANGLE_LERP * (GOAL_LATITUDE - this.latitudeRadians);
            this.longitudeRadians += deltaTimeMs * CAMERA_ANGLE_LERP * (GOAL_LONGITUDE - this.longitudeRadians);
        }
        this.updateCameraFromGroundAndAngles();
    }

    private updateCameraFromGroundAndAngles(): void {
        const z = new Vector3(0, 0, 1);
        const v = new Vector3(1, 0, 0);
        rotateAboutVector(v, new Vector3(0, -1, 0), this.latitudeRadians);
        rotateAboutVector(v, z, this.longitudeRadians);
        v.multiplyScalar(this.distance);
        v.add(this.ground);
        this.camera.position.copy(v);
        this.camera.lookAt(this.ground);
    }
}