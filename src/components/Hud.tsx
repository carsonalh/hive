import React, {MutableRefObject, useMemo, useRef} from 'react';
import {Mesh, Object3D, OrthographicCamera, Scene, Vector2, Vector3} from "three";
import {createPortal, useFrame, useThree} from "@react-three/fiber";
import {screenToNdc} from "../util";
import {Tile, TileProvider} from "./Tiles";
import {HiveColor, HivePieceType} from "../hive-game";

const TILE_GAP_PX = 20;
const HORIZONTAL_PADDING_PX = 30;
const MOVE_INDICATOR_PADDING_TOP_PX = 30;
const MARKER_WIDTH_PX = 4;
const BUBBLE_RADIUS_PX = 15;

const NUM_TILES = 7;

// TODO finish placing pieces (including the background pieces and the marker) on the hud. Use this
// drei helper for the rendering, https://drei.docs.pmnd.rs/misc/html , as regular JSX is supposedly
// not supposed to work in the <Canvas /> context.  We'll create a portal somewhere outside of <Canvas /> in OnlineContainer or App or something.

const Hud: React.FC = () => {
    const scene = useMemo(() => new Scene(), []);
    const planeRef = useRef<Mesh>(null!);
    const cameraRef = useRef<OrthographicCamera>(null!);
    const meshRefs = useMemo<MutableRefObject<Object3D>[]>(
        () => Array.from({ length: 7 }, () => ({current: null!})),
        []
    );

    const {size} = useThree();

    const resizeObjects = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const tileInnerDiameterPx = (height - ((NUM_TILES + 1) * TILE_GAP_PX)) / NUM_TILES;
        const tileOuterDiameterPx = tileInnerDiameterPx * 2 / Math.sqrt(3);
        const containerWidthPx = tileOuterDiameterPx + 2 * HORIZONTAL_PADDING_PX;
        const containerWidthVecNdc = new Vector2();
        screenToNdc(new Vector2(containerWidthPx + width / 2, size.height / 2), containerWidthVecNdc);
        const containerWidthVec3Ndc = new Vector3().copy({...containerWidthVecNdc, z: 0});
        const camera = cameraRef.current;
        const containerWidthWorld = containerWidthVec3Ndc.applyMatrix4(camera.projectionMatrixInverse).x;
        planeRef.current.position.x = -5 + containerWidthWorld / 2;
        planeRef.current.scale.y = 10 * size.height / size.width;
        planeRef.current.scale.x = containerWidthWorld;

        const tileGapVecNdc = new Vector2();
        screenToNdc(new Vector2(width / 2, -TILE_GAP_PX + size.height / 2), tileGapVecNdc);
        const tileGapVec3Ndc = new Vector3().copy({...tileGapVecNdc, z: 0});
        const tileGapWorld = tileGapVec3Ndc.applyMatrix4(camera.projectionMatrixInverse).y;
        const tileOuterDiameterWorld = tileOuterDiameterPx * tileGapWorld / TILE_GAP_PX;

        for (let i = 0; i < meshRefs.length; i++) {
            let mesh: Object3D;
            if ((mesh = meshRefs[i].current) == null) {
                continue;
            }

            const pos = mesh.position;

            pos.x = HORIZONTAL_PADDING_PX + tileOuterDiameterPx / 2;
            pos.y = (TILE_GAP_PX + tileInnerDiameterPx) * i + (TILE_GAP_PX + tileInnerDiameterPx / 2);

            const posNdc = new Vector2();
            screenToNdc(pos, posNdc);

            const inUnitFrustum = new Vector3().copy({...posNdc, z: 0});
            pos.copy(inUnitFrustum.applyMatrix4(camera.projectionMatrixInverse).setZ(0));

            mesh.scale.setScalar(tileOuterDiameterWorld / 2);
            mesh.rotation.set(Math.PI / 2, 1 / 12 * Math.PI * 2, 0, "XYZ");
        }

        camera.top = 5 * size.height / size.width;
        camera.bottom = -5 * size.height / size.width;
        camera.updateProjectionMatrix();
        camera.lookAt(new Vector3());
    };

    useFrame(({gl}) => {
        resizeObjects();

        gl.clearDepth();
        gl.render(scene, cameraRef.current);
    }, 2);

    return createPortal(
        <>
            <orthographicCamera ref={cameraRef} left={-5} right={5} position={[0, 0, 5]}/>
            <axesHelper/>
            <mesh ref={planeRef}>
                <planeGeometry args={[1, 1]}/>
                <meshBasicMaterial color={0x353232}/>
            </mesh>
            <TileProvider>
                <Tile
                    meshRef={meshRefs[0]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.QueenBee}/>
                <Tile
                    meshRef={meshRefs[1]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.SoldierAnt}/>
                <Tile
                    meshRef={meshRefs[2]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.Grasshopper}/>
                <Tile
                    meshRef={meshRefs[3]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.Spider}/>
                <Tile
                    meshRef={meshRefs[4]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.Beetle}/>
                <Tile
                    meshRef={meshRefs[5]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.Ladybug}/>
                <Tile
                    meshRef={meshRefs[6]}
                    basic
                    color={HiveColor.Black}
                    pieceType={HivePieceType.Mosquito}/>
            </TileProvider>
        </>,
        scene
    );
};

export default Hud;
