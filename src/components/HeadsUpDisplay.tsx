import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Matrix3, Matrix4, Mesh, Object3D, Quaternion, Shape, ShapeGeometry, Vector3} from "three";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {Tile} from "./Tiles";
import {HiveColor, HivePieceType} from "../hive-game";
import {RADIUS} from "../constants";
import {Html, Hud, OrthographicCamera} from "@react-three/drei";
import {useHiveStateContext} from "./HiveStateContext";

const TILE_GAP_PX = 20;
const HORIZONTAL_PADDING_PX = 30;
const MOVE_INDICATOR_PADDING_TOP_PX = 30;
const MARKER_WIDTH_PX = 8;
const BUBBLE_RADIUS_PX = 15;

const NUM_TILES = 7;

// TODO finish placing pieces (including the background pieces and the marker) on the hud. Use this
// drei helper for the rendering, https://drei.docs.pmnd.rs/misc/html , as regular JSX is supposedly
// not supposed to work in the <Canvas /> context.  We'll create a portal somewhere outside of <Canvas /> in OnlineContainer or App or something.

export interface HudProps {
    onSelectedChange?: (value: HivePieceType | null) => unknown;
    color: HiveColor;
}

const HeadsUpDisplay: React.FC<HudProps> = props => {
    const size = useThree(({size}) => size);

    return <Hud renderPriority={1}>
        <OrthographicCamera
            makeDefault
            left={-1}
            right={1}
            bottom={-size.height / size.width}
            top={size.height / size.width}
            position={[0, 0, 5]}/>
        <HudScene {...props} />
    </Hud>;
};

const HudScene: React.FC<HudProps> = props => {
    const planeRef = useRef<Mesh>(null!);
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
    const {state: hiveState} = useHiveStateContext();
    const reserve = hiveState.colorToMove === HiveColor.Black
        ? hiveState.blackReserve
        : hiveState.whiteReserve;
    const pieceCounts = useMemo(() => ({
        [HivePieceType.QueenBee]: reserve.QUEEN_BEE,
        [HivePieceType.SoldierAnt]: reserve.SOLDIER_ANT,
        [HivePieceType.Grasshopper]: reserve.GRASSHOPPER,
        [HivePieceType.Spider]: reserve.SPIDER,
        [HivePieceType.Beetle]: reserve.BEETLE,
        [HivePieceType.Ladybug]: reserve.LADYBUG,
        [HivePieceType.Mosquito]: reserve.MOSQUITO,
    }), [hiveState.colorToMove, hiveState.move]);

    useEffect(() => {
        setSelectedPieceType(null);
        props.onSelectedChange && props.onSelectedChange(null);
    }, [props.color]);

    const tileBackgroundMeshes = useMemo<Mesh[]>(
        () => Array.from({length: 7}, () => null!),
        []
    );
    const bubbleMeshes = useMemo<Mesh[]>(
        () => Array.from({length: 7}, () => null!),
        []
    );
    const markerRef = useRef<Mesh>(null!);

    const [selectedPieceType, setSelectedPieceType] = useState<HivePieceType | null>(null);

    const size = useThree(({size}) => size);

    const [translateToCamera] = useState(() => new Matrix4());
    const [scaleToCamera] = useState(() => new Matrix3());

    useLayoutEffect(() => {
        // const {innerWidth: width, innerHeight: height} = window;
        const {width, height} = size;

        translateToCamera.set(
            2 / width, 0, 0, -1,
            0, -2 / width, 0, height / width,
            0, 0, 1, 0,
            0, 0, 0, 1
        );

        scaleToCamera.set(
            2 / width, 0, 0,
            0, 2 / width, 0,
            0, 0, 2 / width
        );

        // const camera = cameraRef.current;
        const tileInnerDiameterPx = (height - ((NUM_TILES + 1) * TILE_GAP_PX)) / NUM_TILES;
        const tileOuterDiameterPx = tileInnerDiameterPx * 2 / Math.sqrt(3);
        const containerWidthPx = tileOuterDiameterPx + 2 * HORIZONTAL_PADDING_PX;
        planeRef.current.position.x = containerWidthPx / 2;
        planeRef.current.position.y = height / 2;
        planeRef.current.position.applyMatrix4(translateToCamera);
        planeRef.current.scale.y = height;
        planeRef.current.scale.x = containerWidthPx;
        planeRef.current.scale.applyMatrix3(scaleToCamera);

        for (let i = 0; i < tileMeshes.length; i++) {
            tileMeshes[i].position.x = containerWidthPx / 2;
            tileMeshes[i].position.y = (TILE_GAP_PX + tileInnerDiameterPx) * (i + 1) - tileInnerDiameterPx / 2;
            tileMeshes[i].position.z = 1;
            tileMeshes[i].position.applyMatrix4(translateToCamera);
            tileMeshes[i].scale.setScalar(tileOuterDiameterPx / 2);
            tileMeshes[i].scale.applyMatrix3(scaleToCamera);

            tileBackgroundMeshes[i].position.copy(tileMeshes[i].position).setZ(.5);
            tileBackgroundMeshes[i].scale.copy(tileMeshes[i].scale);
        }

        if (selectedPieceType != null) {
            markerRef.current.position.x = containerWidthPx / 2;
            markerRef.current.position.y = (TILE_GAP_PX + tileInnerDiameterPx) * (selectedPieceType + 1) - tileInnerDiameterPx / 2;
            markerRef.current.position.z = 0.75;
            markerRef.current.position.applyMatrix4(translateToCamera);

            markerRef.current.scale.setScalar(tileOuterDiameterPx / 2 + MARKER_WIDTH_PX * 2 / Math.sqrt(3));
            markerRef.current.scale.applyMatrix3(scaleToCamera);
        }
    }, [size, selectedPieceType]);

    useEffect(() => {
        for (let i = 0; i < tileMeshes.length; i++) {
            tileMeshes[i].rotation.set(0, 0, Math.PI / 6);
        }
    }, []);

    useEffect(() => {
        markerRef.current.visible = selectedPieceType != null;
    }, [selectedPieceType]);

    useEffect(() => {
        const {width, height} = size;

        const tileInnerDiameterPx = (height - ((NUM_TILES + 1) * TILE_GAP_PX)) / NUM_TILES;
        const tileOuterDiameterPx = tileInnerDiameterPx * 2 / Math.sqrt(3);

        const offset = new Vector3();

        for (const [pieceType, count] of Object.entries(pieceCounts)) {
            const index = Number(pieceType)
            tileMeshes[index].visible = count > 0;

            bubbleMeshes[index].visible = count > 1;
            bubbleMeshes[index].position.set(tileOuterDiameterPx / 2, 0, 0);
            bubbleMeshes[index].position.applyQuaternion(
                new Quaternion()
                    .setFromAxisAngle({x: 0, y: 0, z: 1}, -45 * Math.PI / 180)
            );

            offset.copy(tileMeshes[index].position);
            translateToCamera.invert();
            offset.applyMatrix4(translateToCamera);
            translateToCamera.invert();

            bubbleMeshes[index].position.add(offset);

            if (bubbleElements[index] != null) {
                bubbleElements[index].style.left = `${bubbleMeshes[index].position.x - width/2}px`;
                bubbleElements[index].style.top = `${bubbleMeshes[index].position.y - height/2}px`;
            }

            bubbleMeshes[index].position.applyMatrix4(translateToCamera).setZ(3);

            bubbleMeshes[index].scale.setScalar(BUBBLE_RADIUS_PX).applyMatrix3(scaleToCamera);
        }
    }, [pieceCounts, size]);

    const bubbleElements = useMemo<HTMLDivElement[]>(() => Array.from({length: 7}, () => null!), []);

    const bubbleTexts = useMemo(() => Object
            .entries(pieceCounts)
            .map(([t, c]) => [Number(t), c > 1 ? `x${c}` : ''] as const)
            .sort(([t0], [t1]) => t0 - t1)
            .map(([, c]) => c),
        [pieceCounts]
    );

    const createOnPointerDown = (pieceType: HivePieceType) => (e: ThreeEvent<PointerEvent>) => {
        if (!tileMeshes[pieceType].visible) return;

        e.stopPropagation();
        setSelectedPieceType(pieceType);
        props.onSelectedChange && props.onSelectedChange(pieceType);
    };

    const onPointerDownQueenBee = useCallback(createOnPointerDown(HivePieceType.QueenBee), []);
    const onPointerDownSoldierAnt = useCallback(createOnPointerDown(HivePieceType.SoldierAnt), []);
    const onPointerDownGrasshopper = useCallback(createOnPointerDown(HivePieceType.Grasshopper), []);
    const onPointerDownSpider = useCallback(createOnPointerDown(HivePieceType.Spider), []);
    const onPointerDownBeetle = useCallback(createOnPointerDown(HivePieceType.Beetle), []);
    const onPointerDownLadybug = useCallback(createOnPointerDown(HivePieceType.Ladybug), []);
    const onPointerDownMosquito = useCallback(createOnPointerDown(HivePieceType.Mosquito), []);

    const onPointerDownContainer = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setSelectedPieceType(null);
        props.onSelectedChange && props.onSelectedChange(null);
    }, []);

    return <>
        {/*UI Container*/}

        <mesh ref={planeRef} onPointerDown={onPointerDownContainer}>
            <planeGeometry args={[1, 1]}/>
            <meshBasicMaterial color={0x353232}/>
        </mesh>

        {/*Tiles*/}

        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[0] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.QueenBee}
            onPointerDown={onPointerDownQueenBee}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[1] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.SoldierAnt}
            onPointerDown={onPointerDownSoldierAnt}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[2] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.Grasshopper}
            onPointerDown={onPointerDownGrasshopper}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[3] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.Spider}
            onPointerDown={onPointerDownSpider}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[4] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.Beetle}
            onPointerDown={onPointerDownBeetle}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[5] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.Ladybug}
            onPointerDown={onPointerDownLadybug}/>
        <Tile
            meshRef={mesh => mesh != null && (tileMeshes[6] = mesh)}
            basic
            color={props.color}
            pieceType={HivePieceType.Mosquito}
            onPointerDown={onPointerDownMosquito}/>

        {/* Background Meshes */}

        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[0] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[1] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[2] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[3] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[4] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[5] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>
        <mesh geometry={hexagonGeometry}
              ref={mesh => mesh != null && (tileBackgroundMeshes[6] = mesh)}>
            <meshBasicMaterial color={0x252323}/>
        </mesh>

        {/*Bubble Meshes*/}

        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[0] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[1] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[2] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[3] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[4] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[5] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>
        <mesh visible={false} geometry={hexagonGeometry}
              ref={mesh => mesh != null && (bubbleMeshes[6] = mesh)}>
            <meshBasicMaterial color={0xffffff}/>
        </mesh>

        {/*Bubble Elements*/}

        <Html center ref={e => (bubbleElements[0] = e!)}>{bubbleTexts[0]}</Html>
        <Html center ref={e => (bubbleElements[1] = e!)}>{bubbleTexts[1]}</Html>
        <Html center ref={e => (bubbleElements[2] = e!)}>{bubbleTexts[2]}</Html>
        <Html center ref={e => (bubbleElements[3] = e!)}>{bubbleTexts[3]}</Html>
        <Html center ref={e => (bubbleElements[4] = e!)}>{bubbleTexts[4]}</Html>
        <Html center ref={e => (bubbleElements[5] = e!)}>{bubbleTexts[5]}</Html>
        <Html center ref={e => (bubbleElements[6] = e!)}>{bubbleTexts[6]}</Html>

        {/*Marker*/}

        <mesh ref={markerRef} visible={false} geometry={hexagonGeometry}>
            <meshBasicMaterial color={0x474545}/>
        </mesh>
    </>;

};

export default HeadsUpDisplay;
