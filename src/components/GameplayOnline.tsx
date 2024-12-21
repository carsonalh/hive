import {Canvas, ThreeEvent} from "@react-three/fiber";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {HiveColor, HivePieceType} from "../hive-game";
import {HexGrid, HexVector, HexVectorLike} from "../hex-grid";
import {DirectionalLight, PerspectiveCamera, Vector2, Vector3} from "three";
import {useGoWasmLoaded} from "./GoWasmLoader";
import Tiles, {BareTiles} from "./Tiles";
import HeadsUpDisplay from "./HeadsUpDisplay";
import {LEFT_BUTTON} from "../constants";
import {OrbitControls} from "@react-three/drei";
import {HiveStateContext, useHiveGame, useHiveStateContext} from "./HiveStateContext";
import {useClientReadyContext, useClientRefContext} from "./OnlineContainer";

const GameplayOnline: React.FC = () => {
    const [selectedPiece, setSelectedPiece] = useState<HivePieceType | null>(null);
    const clientReady = useClientReadyContext();
    const hiveGame = useHiveGame(clientReady);
    const clientRef = useClientRefContext();

    const [playerColor, setPlayerColor] = useState(HiveColor.Black);

    useEffect(() => {
        if (!clientReady) return;

        let color: HiveColor | null | undefined;
        if ((color = clientRef.current?.color()) == null) {
            throw new Error('client should not be disconnected after clientReady set');
        }
        setPlayerColor(color);
    }, [clientReady]);

    return <div style={{
        width: '100vw',
        height: '100vh',
    }}>
        <HiveStateContext.Provider value={hiveGame}>
            <Canvas
                gl={{autoClear: false}}
                onCreated={state => state.gl.setClearColor(0x00ff00)}
                camera={{position: [0, 0, 5]}}
                shadows>
                <HeadsUpDisplay
                    color={playerColor}
                    onSelectedChange={setSelectedPiece}/>
                <OnlineScene selected={selectedPiece} setSelected={setSelectedPiece}/>
            </Canvas>
        </HiveStateContext.Provider>
    </div>;
};

interface OnlineSceneProps {
    selected: HivePieceType | null
    setSelected: (selected: HivePieceType | null) => void;
}

const OnlineScene: React.FC<OnlineSceneProps> = ({selected, setSelected}) => {
    const cameraRef = useRef<PerspectiveCamera>(null!);
    const directionalLightRef = useRef<DirectionalLight>(null!);
    const goWasmLoaded = useGoWasmLoaded();
    const clientRef = useClientRefContext();
    const [fromTile, setFromTile] = useState<HexVectorLike | null>(null);
    const {placeTile, moveTile, lastMoveSucceeded, state: hiveState} = useHiveStateContext();

    const onPointerDownPlane = useCallback((e: ThreeEvent<PointerEvent>) => {
        if (!goWasmLoaded || e.button !== LEFT_BUTTON) {
            return;
        }

        if (hiveState.colorToMove !== clientRef.current?.color()) {
            return;
        }

        const hexGrid = new HexGrid();
        const point = new Vector2().copy(e.point);
        const hex = hexGrid.euclideanToHex(point);

        let id: number;
        const occupied = (id = hive.idOfTileAt(hiveState, hex)) >= 0;

        if (selected == null) {
            if (fromTile == null) {
                if (occupied) {
                    setFromTile(hex);
                    setSelected(null);
                }
            } else  {
                const from = hiveState.tiles[id].position;
                moveTile(from, hex);
                clientRef.current!.movePiece(new HexVector(from.q, from.r), hex);
            }
        } else {
            setSelected(null);
            placeTile(selected, hex);
            clientRef.current!.placePiece(selected, hex);
        }
    }, [goWasmLoaded, selected, hiveState]);

    useEffect(() => {
        if (lastMoveSucceeded) return;
        console.warn('Player tried to play an illegal move');
    }, [lastMoveSucceeded]);

    useEffect(() => {
        if (directionalLightRef.current != null) {
            directionalLightRef.current.shadow.camera.lookAt(new Vector3(0, 0, 0));
            directionalLightRef.current.shadow.camera.near = -100;
        }
    }, [directionalLightRef.current]);

    return <>
        <OrbitControls enablePan={false}/>
        <perspectiveCamera ref={cameraRef}/>
        <directionalLight
            ref={directionalLightRef}
            color={0xffffff}
            position={[-1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]}
            intensity={1}
            castShadow/>
        <ambientLight color={0xffffff} intensity={1}/>
        <mesh
            position={[0, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            receiveShadow
            onPointerDown={onPointerDownPlane}>
            <planeGeometry args={[1000, 1000]}/>
            <meshPhysicalMaterial
                color={0x5cc955}
                specularIntensity={0.8}
                roughness={0.5}/>
        </mesh>
        <React.Suspense fallback={<BareTiles/>}>
            <Tiles/>
        </React.Suspense>
    </>;
}

export default GameplayOnline;
