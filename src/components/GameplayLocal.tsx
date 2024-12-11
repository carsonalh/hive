import React, {useEffect, useRef} from "react";
import LocalScene from "../local-scene";
import {Clock, PCFSoftShadowMap, WebGLRenderer} from "three";
import MouseStateTracker from "../mouse-state";

declare const Go: any;

const GameplayLocal: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<WebGLRenderer>(null);

    useEffect(() => {
        let ls: LocalScene;
        const container = containerRef.current;
        let canvas: HTMLCanvasElement;
        let mouseStateTracker = new MouseStateTracker();
        const clock = new Clock();
        let resizeListener: () => unknown;

        async function createLocalScene() {
            const go = new Go(); // Create a new Go instance

            const response = await fetch('main.wasm');
            const buffer = await response.arrayBuffer();
            const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

            go.run(instance); // Run the Go instance

            ls = await LocalScene.create();

            const renderer = new WebGLRenderer({
                alpha: true,
                antialias: true,
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.autoClear = false;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = PCFSoftShadowMap;

            renderer.domElement.oncontextmenu = _ => {
                return false;
            };

            renderer.domElement.onmousedown = e => {
                mouseStateTracker.onMouseDown(e);
                ls?.onMouseDown(e, mouseStateTracker);
            };

            renderer.domElement.onmouseup = e => {
                mouseStateTracker.onMouseUp(e);
            };

            renderer.domElement.onwheel = e => {
                ls?.onWheel(e);
            };

            renderer.domElement.onmousemove = e => {
                ls?.onMouseMove(e, mouseStateTracker);
            };

            resizeListener = () => {
                ls?.onResize && ls.onResize();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            window.addEventListener('resize', resizeListener);

            renderer.setAnimationLoop(() => {
                const deltaTimeMs = clock.getDelta();
                ls?.update(deltaTimeMs, mouseStateTracker);
                ls?.render(renderer);
            });

            canvas = renderer.domElement;
            container!.appendChild(canvas);

            rendererRef.current = renderer;
        }

        const p = createLocalScene();

        return () => {
            p.then(() => {
                ls?.cleanup();
                if (canvas != null) {
                    container!.removeChild(canvas);
                }
                if (resizeListener != null) {
                    window.removeEventListener('resize', resizeListener);
                }
            });
        };
    }, []);

    return <div ref={containerRef}></div>
};

export default GameplayLocal;
