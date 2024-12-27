import {
    AmbientLight,
    Clock,
    DirectionalLight,
    Mesh,
    MeshPhysicalMaterial,
    PlaneGeometry,
    Vector3
} from "three";
import System from "./systems/system";
import RenderSystem from "./systems/render-system";
import {EntityRegistry} from "./entity-registry";
import MeshComponent from "./components/mesh-component";
import LightComponent from "./components/light-component";
import HiveGameComponent from "./components/hive-game-component";
import HudComponent from "./components/hud-component";
import TileMovementSystem from "./systems/tile-movement-system";
import CameraControllerSystem from "./systems/camera-controller-system";
import HudSystem from "./systems/hud-system";
import {HiveGame} from "./hive-game";
import TileLayoutComponent from "./components/tile-layout-component";
import TileLayoutSystem from "./systems/tile-layout-system";
import UserSelectionComponent from "./components/user-selection-component";
import OnlineClient from "./online-client";
import PlayModeComponent from "./components/play-mode-component";
import SelectionSystem from "./systems/selection-system";
import MouseStateSystem from "./systems/mouse-state-system";
import MouseStateComponent from "./components/mouse-state-component";

export default class Game {
    private readonly systems: System[];
    private readonly registry = new EntityRegistry();

    constructor() {
        {
            const light = new DirectionalLight(0xffffff, 1);
            light.position.copy(new Vector3(-1, -1, 1).normalize());
            light.castShadow = true;
            light.shadow.camera.lookAt(new Vector3(0, 0, 0));
            light.shadow.camera.near = -100.;
            const ambient = new AmbientLight(0xffffff, 1);
            this.registry.addEntityFromComponents([new LightComponent(light)]);
            this.registry.addEntityFromComponents([new LightComponent(ambient)]);
        }

        {
            const backgroundPlane = new Mesh(new PlaneGeometry(1000, 1000), new MeshPhysicalMaterial({
                color: 0x5cc955,
                specularIntensity: 0.8,
                roughness: 0.5,
            }));
            backgroundPlane.receiveShadow = true;
            this.registry.addEntityFromComponents([new MeshComponent(backgroundPlane)]);
        }

        this.registry.addEntityFromComponents([new HiveGameComponent(new HiveGame())]);
        this.registry.addEntityFromComponents([new HudComponent()]);
        this.registry.addEntityFromComponents([new TileLayoutComponent()]);
        this.registry.addEntityFromComponents([new UserSelectionComponent()]);
        this.registry.addEntityFromComponents([new PlayModeComponent()]);
        this.registry.addEntityFromComponents([new MouseStateComponent()]);

        this.systems = [
            new CameraControllerSystem(this.registry),
            new TileMovementSystem(this.registry),
            new TileLayoutSystem(this.registry),
            new SelectionSystem(this.registry),
            new MouseStateSystem(this.registry),
        ];

        // intentionally last in the array of systems so update happens before render
        const renderSystem = new RenderSystem(this.registry);
        this.systems.push(renderSystem);
        this.systems.push(new HudSystem(this.registry));

        for (const system of this.systems) {
            system.onCreate();
        }

        const canvas = renderSystem.getCanvas();

        canvas.addEventListener('mouseenter', e => {
            for (let i = this.systems.length - 1; i >= 0; i--) {
                if (this.systems[i].onMouseEnter(e)) {
                    break;
                }
            }
        });
        canvas.addEventListener('mouseleave', e => {
            for (let i = this.systems.length - 1; i >= 0; i--) {
                if (this.systems[i].onMouseLeave(e)) {
                    break;
                }
            }
        });
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

    /**
     * If client is given, the game uses the client for the opponent, otherwise local play is used.
     */
    setClient(client?: OnlineClient): void {
        this.registry.getSingletonComponent(PlayModeComponent).setClient(client);
    }
}