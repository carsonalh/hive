import {Canvas, createPortal, ThreeEvent, useFrame, useThree} from "@react-three/fiber";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {HiveColor, HivePieceType, HiveState} from "../hive-game";
import {HexGrid, HexVectorLike} from "../hex-grid";
import {DirectionalLight, PerspectiveCamera, Scene, Vector2, Vector3} from "three";
import {useGoWasmLoaded} from "./GoWasmLoader";
import Tiles, {BareTiles} from "./Tiles";
import Hud from "./Hud";

export const HiveStateContext = createContext<HiveState | null>(null);
export const useHiveStateContext = (): HiveState => {
    const value = useContext(HiveStateContext);

    if (value == null) {
        throw new Error('there is no reason why hive game context should be null');
    }

    return value;
}

const GameplayOnline: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    useEffect(() => {
        const onResize = () => {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        };

        window.addEventListener('resize', onResize);
        onResize();

        return () => window.removeEventListener('resize', onResize);
    }, []);

    return <div>
        <Canvas gl={{ autoClear: false }} onCreated={state => state.gl.setClearColor(0x00ff00)} ref={canvasRef} camera={{position: [0, 0, 5]}} shadows>
            <Hud />
            <MainScene />
        </Canvas>
    </div>;
};

const MainScene: React.FC = () => {
    const scene = useMemo(() => new Scene(), []);
    const cameraRef = useRef<PerspectiveCamera>(null!);
    const directionalLightRef = useRef<DirectionalLight>(null!);
    const goWasmLoaded = useGoWasmLoaded();
    const {state: hiveState, placeTile} = useHiveGame(goWasmLoaded);
    const onClickPlane = useCallback((e: ThreeEvent<MouseEvent>) => {
        if (!goWasmLoaded) {
            return
        }

        const hexGrid = new HexGrid();
        const point = new Vector2().copy(e.point);
        const hex = hexGrid.euclideanToHex(point);
        if (!placeTile(HivePieceType.QueenBee, hex)) {
            console.warn('allowed user to place an invalid move');
        }
    }, [goWasmLoaded]);

    useEffect(() => {
        if (directionalLightRef.current != null) {
            directionalLightRef.current.shadow.camera.lookAt(new Vector3(0, 0, 0));
            directionalLightRef.current.shadow.camera.near = -100;
        }
    }, [directionalLightRef.current]);

    const {camera} = useThree();

    useFrame(({gl}) => {
        gl.setSize(window.innerWidth, window.innerHeight);
        gl.clear();
        gl.render(scene, camera);
    }, 1);

    return createPortal(
        <>
            {/*<OrbitControls/>*/}
            <CameraControls/>
            <perspectiveCamera ref={cameraRef}/>
            <directionalLight
                ref={directionalLightRef}
                color={0xffffff}
                position={[-1, -1, 1]}
                intensity={1}
                castShadow/>
            <ambientLight color={0xffffff} intensity={1}/>
            <mesh
                position={[0, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                receiveShadow
                onClick={onClickPlane}>
                <planeGeometry args={[1000, 1000]}/>
                <meshPhysicalMaterial
                    color={0x5cc955}
                    specularIntensity={0}
                    roughness={0.5}/>
            </mesh>
            <HiveStateContext.Provider value={hiveState}>
                <React.Suspense fallback={<BareTiles/>}>
                    <Tiles/>
                </React.Suspense>
            </HiveStateContext.Provider>
        </>,
        scene
    );
};

const CameraControls: React.FC = () => {
    const {camera} = useThree();

    useEffect(() => {
        camera.up.set(0, 1, 0);
        camera.lookAt(new Vector3(0, 0, 0));
    }, []);

    return false;
};

const useHiveGame = (ready: boolean): {
    state: HiveState,
    placeTile: (pieceType: HivePieceType, position: HexVectorLike) => boolean,
    moveTile: (from: HexVectorLike, to: HexVectorLike) => boolean,
} => {
    const [state, setState] = useState<HiveState>({
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
    });

    useEffect(() => {
        if (!ready) return;

        setState(hive.createHiveGame());
    }, [ready]);

    return {
        state,
        placeTile: (pieceType, position) => {
            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            let success = false;

            setState(prev => {
                let state: HiveState;
                [state, success] = hive.placeTile(prev, pieceType, position);
                return state;
            });

            return success;
        },
        moveTile: (from, to) => {
            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            const [newState, success] = hive.moveTile(state, from, to);
            setState(newState);
            return success;
        },
    };
}

export default GameplayOnline;
