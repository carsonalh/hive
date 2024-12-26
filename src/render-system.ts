import System from "./system";
import {Color, PCFSoftShadowMap, Scene, WebGLRenderer} from "three";
import {EntityRegistry} from "./entity-registry";
import CameraComponent from "./camera-component";
import Object3DComponent from "./object3d-component";
import Component from "./component";

export class RendererComponent extends Component {
    constructor(public renderer: WebGLRenderer) {
        super();
    }
}

export default class RenderSystem extends System {
    private scene = new Scene();
    private readonly renderer: WebGLRenderer;

    constructor(registry: EntityRegistry) {
        super(registry);

        this.renderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        const canvas = this.renderer.domElement;

        canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        });

        document.body.appendChild(this.renderer.domElement);

        this.scene.background = new Color(0x175c29);
    }

    onCreate() {
        this.registry.addEntity([new RendererComponent(this.renderer)]);
    }

    getCanvas(): HTMLCanvasElement {
        return this.renderer.domElement;
    }

    setAnimationLoop(callback: (() => any) | null): void {
        this.renderer.setAnimationLoop(callback);
    }

    onUpdate() {
        this.scene.clear();

        const objects = this.registry.getEntitiesWithComponents(Object3DComponent);
        for (const object of objects) {
            this.scene.add(object.getComponent(Object3DComponent).object3d);
        }

        const cameras = this.registry.getEntitiesWithComponents(CameraComponent);

        if (cameras.length !== 1) {
            throw new Error('unhandled, do not know how to render with cameras != 1');
        }

        this.renderer.clear();
        this.renderer.render(this.scene, cameras[0].getComponent(CameraComponent).camera);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}