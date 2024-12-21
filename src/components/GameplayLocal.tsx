import {Canvas, ThreeEvent} from "@react-three/fiber";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {HiveColor, HivePieceType, HiveState} from "../hive-game";
import {HexGrid, HexVectorLike} from "../hex-grid";
import {DirectionalLight, PerspectiveCamera, Vector2, Vector3} from "three";
import {useGoWasmLoaded} from "./GoWasmLoader";
import Tiles, {BareTiles} from "./Tiles";
import HeadsUpDisplay from "./HeadsUpDisplay";
import {LEFT_BUTTON} from "../constants";
import {OrbitControls} from "@react-three/drei";
import {HiveStateContext, useHiveStateContext} from "./HiveStateContext";

const GameplayLocal: React.FC = () => {
    const loaded = useGoWasmLoaded();
    const hiveGame = useHiveGame(loaded);
    const [selectedPiece, setSelectedPiece] = useState<HivePieceType | null>(null);

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
                    color={hiveGame.state.colorToMove}
                    onSelectedChange={setSelectedPiece}/>
                <MainScene selected={selectedPiece}/>
            </Canvas>
        </HiveStateContext.Provider>
    </div>;
};

const MainScene: React.FC<{ selected: HivePieceType | null }> = ({selected}) => {
    const cameraRef = useRef<PerspectiveCamera>(null!);
    const directionalLightRef = useRef<DirectionalLight>(null!);
    const goWasmLoaded = useGoWasmLoaded();
    const {placeTile, lastMoveSucceeded} = useHiveStateContext();
    const onPointerDownPlane = useCallback((e: ThreeEvent<PointerEvent>) => {
        if (!goWasmLoaded || e.button !== LEFT_BUTTON) {
            return;
        }

        if (selected == null) {
            return;
        }

        const hexGrid = new HexGrid();
        const point = new Vector2().copy(e.point);
        const hex = hexGrid.euclideanToHex(point);
        placeTile(selected, hex);
    }, [goWasmLoaded, selected]);

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
};

const useHiveGame = (ready: boolean): {
    state: HiveState,
    placeTile: (pieceType: HivePieceType, position: HexVectorLike) => void,
    moveTile: (from: HexVectorLike, to: HexVectorLike) => void,
    lastMoveSucceeded: boolean,
} => {
    const [state, setState] = useState<[HiveState, lastMoveSuccess: boolean]>([{
        blackReserve: {
            QUEEN_BEE: 1,
            SOLDIER_ANT: 2,
            GRASSHOPPER: 3,
            SPIDER: 2,
            BEETLE: 2,
            LADYBUG: 1,
            MOSQUITO: 1,
        },
        whiteReserve: {
            QUEEN_BEE: 1,
            SOLDIER_ANT: 2,
            GRASSHOPPER: 3,
            SPIDER: 2,
            BEETLE: 2,
            LADYBUG: 1,
            MOSQUITO: 1,
        },
        tiles: [],
        colorToMove: HiveColor.Black,
        move: 1,
    }, true]);

    useEffect(() => {
        if (!ready) return;

        setState([hive.createHiveGame(), true]);
    }, [ready]);

    return {
        state: state[0],
        placeTile: (pieceType, position) => {
            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            setState(prev => {
                return hive.placeTile(prev[0], pieceType, position);
            });
        },
        moveTile: (from, to) => {
            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            setState(prev => {
                return hive.moveTile(prev[0], from, to);
            });
        },
        lastMoveSucceeded: state[1],
    };
}

export default GameplayLocal;
