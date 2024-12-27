import System from "./system";
import {Color, PCFSoftShadowMap, Scene, Vector2, WebGLRenderer} from "three";
import {EntityRegistry} from "../entity-registry";
import CameraComponent from "../components/camera-component";
import Object3DComponent from "../components/object3d-component";
import Component from "../components/component";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass";
import SelectableComponent, {SelectableState} from "../components/selectable-component";
import MeshComponent from "../components/mesh-component";
import {OutputPass} from "three/examples/jsm/postprocessing/OutputPass";

export class RendererComponent extends Component {
    constructor(public renderer: WebGLRenderer, public composer: EffectComposer) {
        super();
    }
}

export default class RenderSystem extends System {
    private scene = new Scene();
    private hoverOutlinePass: OutlinePass = null!;
    private selectedOutlinePass: OutlinePass = null!;
    private readonly renderer: WebGLRenderer;
    private readonly composer: EffectComposer;

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

        this.composer = new EffectComposer(this.renderer);
    }

    onCreate() {
        this.registry.addEntityFromComponents([new RendererComponent(this.renderer, this.composer)]);

        const {camera} = this.registry.getSingletonComponent(CameraComponent);
        this.composer.addPass(new RenderPass(this.scene, camera));
        this.hoverOutlinePass = new OutlinePass(
            new Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            camera,
            []
        );
        this.hoverOutlinePass.visibleEdgeColor = new Color(0x808080);
        this.hoverOutlinePass.hiddenEdgeColor = new Color(0x808080);
        this.hoverOutlinePass.edgeStrength = 5;
        this.hoverOutlinePass.edgeThickness = .25;
        this.selectedOutlinePass = new OutlinePass(
            new Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            camera,
            []
        );
        this.selectedOutlinePass.visibleEdgeColor = new Color(0x808080);
        this.selectedOutlinePass.hiddenEdgeColor = new Color(0x808080);
        this.selectedOutlinePass.edgeStrength = 10;
        this.selectedOutlinePass.edgeThickness = .5;
        this.composer.addPass(this.selectedOutlinePass);
        this.composer.addPass(this.hoverOutlinePass);
        this.composer.addPass(new OutputPass());
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

        this.hoverOutlinePass.selectedObjects = this.registry
            .getEntitiesWithComponents(SelectableComponent)
            .filter(e => e.getComponent(SelectableComponent).state === SelectableState.Hovered)
            .map(e => e.getComponent(MeshComponent).mesh);

        this.selectedOutlinePass.selectedObjects = this.registry
            .getEntitiesWithComponents(SelectableComponent)
            .filter(e => e.getComponent(SelectableComponent).state === SelectableState.Selected)
            .map(e => e.getComponent(MeshComponent).mesh);

        this.composer.render();
    }

    onResize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}