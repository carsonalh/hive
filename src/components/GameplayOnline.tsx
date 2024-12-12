import React, {createRef, useEffect, useRef, useState} from "react";
import {Clock, PCFSoftShadowMap, WebGLRenderer} from "three";
import MouseStateTracker from "../mouse-state";
import OnlineScene from "../online-scene";
import {useClientRefContext} from "./OnlineContainer";
import {Move} from "../online-client";

declare const Go: any;

interface OnlineSceneData {
    scene: OnlineScene;
    renderer: WebGLRenderer;
}

const onlineSceneDataRef = createRef<OnlineSceneData>();

const GameplayOnline: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const clientRef = useClientRefContext();

    const [opponentDisconnected, setOpponentDisconnected] = useState(false);

    const onDisconnect = () => setOpponentDisconnected(true);
    const onReconnect = () => setOpponentDisconnected(false);

    useEffect(() => {
        if (onlineSceneDataRef.current != null) {
            throw new Error('tried to instantiate an online scene while one already exists');
        }

        let data: OnlineSceneData | null = null;
        const container = containerRef.current;
        const clock = new Clock();
        let resizeListener: () => unknown;

        async function createOnlineScene() {
            const go = new Go();

            const response = await fetch('/main.wasm');
            const buffer = await response.arrayBuffer();
            const {instance} = await WebAssembly.instantiate(buffer, go.importObject);
            go.run(instance);

            const client = clientRef.current;
            if (!client.connected()) {
                throw new Error('expected client to be connected in GameplayOnline');
            }

            const mouseStateTracker = new MouseStateTracker();

            const scene = await OnlineScene.create({
                placePieceHandler: client.placePiece.bind(client),
                movePieceHandler: client.movePiece.bind(client),
            });

            scene.onConnect(client.color()!);

            const renderer = new WebGLRenderer({
                alpha: true,
                antialias: true,
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.autoClear = false;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = PCFSoftShadowMap;

            const receiveMoveHandler = (move: Move) => {
                scene.onReceiveMove(move);
                scene.render(renderer);
            };
            const connectHandler = scene.onConnect.bind(scene);
            const connectionCloseHandler = scene.onConnectionClose.bind(scene);
            const opponentDisconnectHandler = () => {
                onDisconnect();
                scene.onOpponentDisconnect();
            }
            const opponentReconnectHandler = () => {
                onReconnect();
                scene.onOpponentReconnect();
            }
            const gameCompletedHandler = scene.onGameComplete.bind(scene);

            client.setHandlers({
                receiveMoveHandler,
                connectHandler,
                connectionCloseHandler,
                opponentDisconnectHandler,
                opponentReconnectHandler,
                gameCompletedHandler,
            });

            renderer.domElement.oncontextmenu = _ => {
                return false;
            };

            renderer.domElement.onmousedown = e => {
                mouseStateTracker.onMouseDown(e);
                scene?.onMouseDown(e, mouseStateTracker);
            };

            renderer.domElement.onmouseup = e => {
                mouseStateTracker.onMouseUp(e);
            };

            renderer.domElement.onwheel = e => {
                scene?.onWheel(e);
            };

            renderer.domElement.onmousemove = e => {
                scene?.onMouseMove(e, mouseStateTracker);
            };

            resizeListener = () => {
                scene?.onResize && scene.onResize();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            window.addEventListener('resize', resizeListener);

            renderer.setAnimationLoop(() => {
                const deltaTimeMs = clock.getDelta();
                scene?.update(deltaTimeMs, mouseStateTracker);
                scene?.render(renderer);
            });

            container!.appendChild(renderer.domElement);

            onlineSceneDataRef.current = data = {
                scene,
                renderer,
            };
        }

        const p = createOnlineScene();

        return () => {
            p.then(() => {
                const data = onlineSceneDataRef.current;
                if (data == null) {
                    throw new Error('unreachable: by the time this promise fulfills, \'data\' should have been set');
                }

                data.scene.cleanup();
                containerRef.current!.removeChild(data.renderer.domElement);
                data.renderer.setAnimationLoop(null);
            });
        };
    }, []);

    return <>
        <div ref={containerRef}></div>
        {opponentDisconnected && <div>
            <h2>Opponent has Disconnected</h2>
            <p>Please wait for them to reconnect, otherwise you will win after 45 seconds of disconnection.</p>
        </div>}
    </>;
};

export default GameplayOnline;
