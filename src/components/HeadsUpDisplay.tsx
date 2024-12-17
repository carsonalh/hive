import React, {MutableRefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Mesh,
    Object3D,
    Scene,
    Shape,
    ShapeGeometry,
    Vector2,
    Vector3,
    OrthographicCamera as ThreeOrthographicCamera
} from "three";
import {ThreeEvent, useFrame, useThree} from "@react-three/fiber";
import {screenToNdc} from "../util";
import {Tile} from "./Tiles";
import {HiveColor, HivePieceType} from "../hive-game";
import {RADIUS} from "../constants";
import {Hud, OrthographicCamera} from "@react-three/drei";

const TILE_GAP_PX = 20;
const HORIZONTAL_PADDING_PX = 30;
const MOVE_INDICATOR_PADDING_TOP_PX = 30;
const MARKER_WIDTH_PX = 4;
const BUBBLE_RADIUS_PX = 15;

const NUM_TILES = 7;

// TODO finish placing pieces (including the background pieces and the marker) on the hud. Use this
// drei helper for the rendering, https://drei.docs.pmnd.rs/misc/html , as regular JSX is supposedly
// not supposed to work in the <Canvas /> context.  We'll create a portal somewhere outside of <Canvas /> in OnlineContainer or App or something.

export interface HudProps {
    selectedPieceType?: HivePieceType | null;
    setSelectedPieceType?: (value: HivePieceType | null) => unknown;
}

const HeadsUpDisplay: React.FC<HudProps> = props => {
    const scene = useMemo(() => new Scene(), []);
    const planeRef = useRef<Mesh>(null!);
    const cameraRef = useRef<ThreeOrthographicCamera>(null!);
    const tileMeshes = useMemo<Object3D[]>(
        () => Array.from({length: 7}, () => null!),
        []
    );
    const hexagonGeometry = useMemo(() => {
        const r = RADIUS * 2 / Math.sqrt(3);
        const shape = new Shape();
        shape.moveTo(r, 0);

        for (let i = 1; i < 6; i++) {
            const angle = 2 * Math.PI * (i / 6);
            shape.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }

        shape.lineTo(r, 0);
        shape.closePath();

        return new ShapeGeometry(shape);
    }, []);
    const tileBackgroundRefs = useMemo<MutableRefObject<Mesh>[]>(
        () => Array.from({length: 7}, () => ({current: null!})),
        []
    );
    const markerRef = useRef<Mesh>(null!);

    const [selectedPieceType, setSelectedPieceType] = useState<HivePieceType | null>(null);

    const {size, events} = useThree();

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

        const markerWidthNdc = new Vector2(MARKER_WIDTH_PX * 2 / window.innerWidth);
        const markerWorld = new Vector3(markerWidthNdc.x, markerWidthNdc.y, 0);
        markerWorld.applyMatrix4(camera.projectionMatrixInverse);
        const markerWidthWorld = markerWorld.x;
        // markerRef.current.scale.setScalar((tileOuterDiameterWorld/2 * Math.sqrt(3) / 2 + markerWidthWorld) / RADIUS);
        markerRef.current.scale.setScalar(2);
        markerRef.current.visible = selectedPieceType != null;
        if (selectedPieceType != null) {
            // console.log('setting marker position');
            markerRef.current.position.set(
                HORIZONTAL_PADDING_PX + tileOuterDiameterPx / 2,
                (TILE_GAP_PX + tileInnerDiameterPx) * selectedPieceType + (TILE_GAP_PX + tileInnerDiameterPx / 2),
                0
            );
        }

        for (let i = 0; i < tileMeshes.length; i++) {
            let mesh: Object3D;
            if ((mesh = tileMeshes[i]) == null) {
                continue;
            }

            const pos = mesh.position;

            pos.x = HORIZONTAL_PADDING_PX + tileOuterDiameterPx / 2;
            pos.y = (TILE_GAP_PX + tileInnerDiameterPx) * i + (TILE_GAP_PX + tileInnerDiameterPx / 2);

            const posNdc = new Vector2();
            screenToNdc(pos, posNdc);

            const inUnitFrustum = new Vector3().copy({...posNdc, z: 0});
            pos.copy(inUnitFrustum.applyMatrix4(camera.projectionMatrixInverse).setZ(0));

            if (tileBackgroundRefs[i].current != null) {
                tileBackgroundRefs[i].current.visible = true;
                tileBackgroundRefs[i].current.position.copy(inUnitFrustum);
                tileBackgroundRefs[i].current.scale.setScalar(tileOuterDiameterWorld / 2);
            }

            mesh.scale.setScalar(tileOuterDiameterWorld / 2);
            mesh.rotation.set(0, 0, 1 / 12 * Math.PI * 2, "XYZ");
        }

        camera.top = 5 * size.height / size.width;
        camera.bottom = -5 * size.height / size.width;
        camera.updateProjectionMatrix();
        camera.lookAt(new Vector3());
    };

    useFrame(() => {
        resizeObjects();
    });

    const createOnPointerDown = (pieceType: HivePieceType) => (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setSelectedPieceType(pieceType);
    };

    const onPointerDownQueenBee = useCallback(createOnPointerDown(HivePieceType.QueenBee), []);
    const onPointerDownSoldierAnt = useCallback(createOnPointerDown(HivePieceType.SoldierAnt), []);
    const onPointerDownGrasshopper = useCallback(createOnPointerDown(HivePieceType.Grasshopper), []);
    const onPointerDownSpider = useCallback(createOnPointerDown(HivePieceType.Spider), []);
    const onPointerDownBeetle = useCallback(createOnPointerDown(HivePieceType.Beetle), []);
    const onPointerDownLadybug = useCallback(createOnPointerDown(HivePieceType.Ladybug), []);
    const onPointerDownMosquito = useCallback(createOnPointerDown(HivePieceType.Mosquito), []);

    return <Hud renderPriority={1}>
        <OrthographicCamera makeDefault ref={cameraRef} left={-5} right={5} position={[0, 0, 5]}/>
        <mesh ref={planeRef} onPointerDown={e => e.stopPropagation()}>
            <planeGeometry args={[1, 1]}/>
            <meshBasicMaterial color={0x353232}/>
        </mesh>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[0] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.QueenBee}
            onPointerDown={onPointerDownQueenBee}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[1] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.SoldierAnt}
            onPointerDown={onPointerDownSoldierAnt}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[2] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.Grasshopper}
            onPointerDown={onPointerDownGrasshopper}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[3] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.Spider}
            onPointerDown={onPointerDownSpider}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[4] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.Beetle}
            onPointerDown={onPointerDownBeetle}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[5] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.Ladybug}
            onPointerDown={onPointerDownLadybug}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[6] = mesh)}
            basic
            color={HiveColor.Black}
            pieceType={HivePieceType.Mosquito}
            onPointerDown={onPointerDownMosquito}/>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[0]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[1]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[2]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[3]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[4]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[5]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry} ref={tileBackgroundRefs[6]}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh ref={markerRef} visible={false} geometry={hexagonGeometry}>
            <meshBasicMaterial color={0x474545}/>
        </mesh>
    </Hud>;
};

export default HeadsUpDisplay;
