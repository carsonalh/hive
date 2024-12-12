import React, {useEffect, useRef} from "react";
import {Clock, PCFSoftShadowMap, WebGLRenderer} from "three";
import MouseStateTracker from "../mouse-state";
import OnlineScene from "../online-scene";
import {useClientRefContext} from "./OnlineContainer";

declare const Go: any;

const GameplayOnline: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<WebGLRenderer>(null);
    const clientRef = useClientRefContext();

    useEffect(() => {
        let os: OnlineScene;
        const container = containerRef.current;
        let canvas: HTMLCanvasElement;
        let mouseStateTracker = new MouseStateTracker();
        const clock = new Clock();
        let resizeListener: () => unknown;

        async function createLocalScene() {
            const go = new Go(); // Create a new Go instance

            const response = await fetch('/main.wasm');
            const buffer = await response.arrayBuffer();
            const {instance} = await WebAssembly.instantiate(buffer, go.importObject); // Use Go's import object

            go.run(instance); // Run the Go instance

            os = await OnlineScene.create();

            const client = clientRef.current;

            if (!client.connected()) {
                throw new Error('expected client to be connected in GameplayOnline');
            }

            os.onConnect(client.color()!);

            const receiveMoveHandler = os.onReceiveMove.bind(os);
            const connectHandler = os.onConnect.bind(os);
            const connectionCloseHandler = os.onConnectionClose.bind(os);
            const opponentDisconnectHandler = os.onOpponentDisconnect.bind(os);
            const opponentReconnectHandler = os.onOpponentReconnect.bind(os);
            const gameCompletedHandler = os.onGameComplete.bind(os);

            client.setHandlers({
                receiveMoveHandler,
                connectHandler,
                connectionCloseHandler,
                opponentDisconnectHandler,
                opponentReconnectHandler,
                gameCompletedHandler,
            });

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
                os?.onMouseDown(e, mouseStateTracker);
            };

            renderer.domElement.onmouseup = e => {
                mouseStateTracker.onMouseUp(e);
            };

            renderer.domElement.onwheel = e => {
                os?.onWheel(e);
            };

            renderer.domElement.onmousemove = e => {
                os?.onMouseMove(e, mouseStateTracker);
            };

            resizeListener = () => {
                os?.onResize && os.onResize();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            window.addEventListener('resize', resizeListener);

            renderer.setAnimationLoop(() => {
                const deltaTimeMs = clock.getDelta();
                os?.update(deltaTimeMs, mouseStateTracker);
                os?.render(renderer);
            });

            canvas = renderer.domElement;
            container!.appendChild(canvas);

            rendererRef.current = renderer;
        }

        const p = createLocalScene();

        return () => {
            p.then(() => {
                os?.cleanup();
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

export default GameplayOnline;
