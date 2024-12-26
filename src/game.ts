import {
    AmbientLight,
    AxesHelper,
    Clock,
    DirectionalLight,
    Mesh,
    MeshPhysicalMaterial,
    PlaneGeometry,
    Vector3
} from "three";
import MoveManager, {LocalMoveManager} from "./move-manager";
import System from "./systems/system";
import RenderSystem from "./systems/render-system";
import {EntityRegistry} from "./entity-registry";
import MeshComponent from "./components/mesh-component";
import LightComponent from "./components/light-component";
import Object3DComponent from "./components/object3d-component";
import HiveGameComponent from "./components/hive-game-component";
import HudComponent from "./components/hud-component";
import TileMovementSystem from "./systems/tile-movement-system";
import CameraControllerSystem from "./systems/camera-controller-system";
import HudSystem from "./systems/hud-system";
import {HiveGame} from "./hive-game";
import TileLayoutComponent from "./components/tile-layout-component";
import TileLayoutSystem from "./systems/tile-layout-system";
import UserSelectionComponent from "./components/user-selection-component";

export default class Game {
    private readonly systems: System[];
    private readonly registry = new EntityRegistry();

    private moveManager: MoveManager = new LocalMoveManager();

    public constructor() {
        {
            const light = new DirectionalLight(0xffffff, 1);
            light.position.copy(new Vector3(-1, -1, 1).normalize());
            light.castShadow = true;
            light.shadow.camera.lookAt(new Vector3(0, 0, 0));
            light.shadow.camera.near = -100.;
            const ambient = new AmbientLight(0xffffff, 1);
            this.registry.addEntity([new LightComponent(light)]);
            this.registry.addEntity([new LightComponent(ambient)]);
        }

        {
            const backgroundPlane = new Mesh(new PlaneGeometry(1000, 1000), new MeshPhysicalMaterial({
                color: 0x5cc955,
                specularIntensity: 0.8,
                roughness: 0.5,
            }));
            backgroundPlane.receiveShadow = true;
            this.registry.addEntity([new MeshComponent(backgroundPlane)]);
        }

        this.registry.addEntity([new Object3DComponent(new AxesHelper())]);
        this.registry.addEntity([new HiveGameComponent(new HiveGame())]);
        this.registry.addEntity([new HudComponent()]);
        this.registry.addEntity([new TileLayoutComponent()]);
        this.registry.addEntity([new UserSelectionComponent()]);

        this.systems = [
            new CameraControllerSystem(this.registry),
            new TileMovementSystem(this.registry),
            new TileLayoutSystem(this.registry),
        ];

        // intentionally last in the array of systems so update happens before render
        const renderSystem = new RenderSystem(this.registry);
        this.systems.push(renderSystem);
        this.systems.push(new HudSystem(this.registry));

        for (const system of this.systems) {
            system.onCreate();
        }

        const canvas = renderSystem.getCanvas();

        canvas.addEventListener('mousedown', e => {
            for (let i = this.systems.length - 1; i >= 0; i--) {
                if (this.systems[i].onMouseDown(e)) {
                    break;
                }
            }
        });
        canvas.addEventListener('mouseup', e => {
            for (let i = this.systems.length - 1; i >= 0; i--) {
                if (this.systems[i].onMouseUp(e)) {
                    break;
                }
            }
        });
        canvas.addEventListener('mousemove', e => {
            for (let i = this.systems.length - 1; i >= 0; i--) {
                if (this.systems[i].onMouseMove(e)) {
                    break;
                }
            }
        });
        canvas.addEventListener('wheel', e => {
            for (let i = this.systems.length - 1; i >= 0; i--) {
                if (this.systems[i].onWheel(e)) {
                    break;
                }
            }
        });

        window.addEventListener('resize', () => {
            for (const system of this.systems) {
                system.onResize();
            }
        });

        const clock = new Clock();
        renderSystem.setAnimationLoop(() => {
            const deltaTimeMs = Math.min(clock.getDelta(), 1 / 30);

            for (const system of this.systems) {
                system.onUpdate(deltaTimeMs);
            }
        });
    }

    public setMoveManager(manager: MoveManager): void {
        this.moveManager.destroy();
        this.moveManager = manager;
    }
}