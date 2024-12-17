import React, {RefCallback, useDebugValue, useEffect, useMemo, useState} from 'react';
import {ThreeEvent, useLoader} from "@react-three/fiber";
import {CanvasTexture, ImageBitmapLoader, Object3D, Texture, TextureLoader, Vector3} from "three";
import {useHiveStateContext} from "./GameplayOnline";
import {HiveColor, HivePieceType} from "../hive-game";
import {HexGrid} from "../hex-grid";
import {RADIUS} from "../constants";
// @ts-ignore
import ObjGeometryLoader from "../obj-geometry-loader";
// @ts-ignore
import ImageLoader from "../image-loader";

const Tiles: React.FC = () => {
    const hiveState = useHiveStateContext();
    const hexGrid = new HexGrid();
    const meshes = useMemo<Object3D[]>(() => [], []);

    return hiveState.tiles.map((t, i) => {
        const position2d = hexGrid.hexToEuclidean(t.position);
        const position3d = new Vector3().copy({...position2d, z: 0})

        if (meshes[i] == null) {
            meshes.push(null!);
        }

        return <Tile
            meshRef={mesh => {
                if (mesh == null) return;
                mesh.position.copy(position3d);
                mesh.scale.setScalar(RADIUS * Math.sqrt(3) / 2);
                meshes[i] = mesh;
            }}
            key={i}
            color={t.color}
            pieceType={t.pieceType}
        />
    });
};

namespace pbr {
    export const WHITE_BACKGROUND = 0xffec8c;
    export const BLACK_BACKGROUND = 0x000000;
    export const QUEEN_BEE_COLOUR = 0xff6f00;
    export const SOLDIER_ANT_COLOUR = 0x3098F4;
    export const BEETLE_COLOUR = 0xA646E3;
    export const SPIDER_COLOUR = 0x551B0B;
    export const GRASSHOPPER_COLOUR = 0x20F312;
    export const LADYBUG_COLOUR = 0xA40006;
    export const MOSQUITO_COLOUR = 0x888888;
}

namespace basic {
    // export const WHITE_BACKGROUND = 0xEDE8D0;
    // export const BLACK_BACKGROUND = 0x404040;
    // export const QUEEN_BEE_COLOUR = 0xFDCF00;
    // export const SOLDIER_ANT_COLOUR = 0x87C3F6;
    // export const BEETLE_COLOUR = 0xBFA1ED;
    // export const SPIDER_COLOUR = 0xC48120;
    // export const GRASSHOPPER_COLOUR = 0x7FE262;
    // export const LADYBUG_COLOUR = 0xE61717;
    // export const MOSQUITO_COLOUR = 0xC8C8C8;
    export const WHITE_BACKGROUND = 0xffec8c;
    export const BLACK_BACKGROUND = 0x000000;
    export const QUEEN_BEE_COLOUR = 0xff6f00;
    export const SOLDIER_ANT_COLOUR = 0x3098F4;
    export const BEETLE_COLOUR = 0xA646E3;
    export const SPIDER_COLOUR = 0x551B0B;
    export const GRASSHOPPER_COLOUR = 0x20F312;
    export const LADYBUG_COLOUR = 0xA40006;
    export const MOSQUITO_COLOUR = 0x888888;
}

export interface TileProps {
    color: HiveColor;
    pieceType: HivePieceType;
    meshRef?: RefCallback<Object3D>;
    basic?: boolean;
    onPointerDown?: (e: ThreeEvent<PointerEvent>) => unknown;
}

export const Tile: React.FC<TileProps> = props => {
    const backgroundPbrLookup = {
        [HiveColor.Black]: pbr.BLACK_BACKGROUND,
        [HiveColor.White]: pbr.WHITE_BACKGROUND,
    } as const;
    const backgroundBasicLookup = {
        [HiveColor.Black]: basic.BLACK_BACKGROUND,
        [HiveColor.White]: basic.WHITE_BACKGROUND,
    } as const;

    const background = (props.basic ? backgroundBasicLookup : backgroundPbrLookup)[props.color];

    const pieceTypicalPbrLookup = {
        [HivePieceType.QueenBee]: [pbr.QUEEN_BEE_COLOUR, '/textures/queenbee.png', '/textures/queenbee_normal.png'],
        [HivePieceType.SoldierAnt]: [pbr.SOLDIER_ANT_COLOUR, '/textures/soldierant.png', '/textures/soldierant_normal.png'],
        [HivePieceType.Grasshopper]: [pbr.GRASSHOPPER_COLOUR, '/textures/grasshopper.png', '/textures/grasshopper_normal.png'],
        [HivePieceType.Spider]: [pbr.SPIDER_COLOUR, '/textures/spider.png', '/textures/spider_normal.png'],
        [HivePieceType.Beetle]: [pbr.BEETLE_COLOUR, '/textures/beetle.png', '/textures/beetle_normal.png'],
        [HivePieceType.Ladybug]: [pbr.LADYBUG_COLOUR, '/textures/ladybug.png', '/textures/ladybug_normal.png'],
        [HivePieceType.Mosquito]: [pbr.MOSQUITO_COLOUR, '/textures/mosquito.png', '/textures/mosquito_normal.png'],
    } as const;
    const pieceTypicalBasicLookup = {
        [HivePieceType.QueenBee]: [basic.QUEEN_BEE_COLOUR, '/textures/queenbee.png', '/textures/queenbee_normal.png'],
        [HivePieceType.SoldierAnt]: [basic.SOLDIER_ANT_COLOUR, '/textures/soldierant.png', '/textures/soldierant_normal.png'],
        [HivePieceType.Grasshopper]: [basic.GRASSHOPPER_COLOUR, '/textures/grasshopper.png', '/textures/grasshopper_normal.png'],
        [HivePieceType.Spider]: [basic.SPIDER_COLOUR, '/textures/spider.png', '/textures/spider_normal.png'],
        [HivePieceType.Beetle]: [basic.BEETLE_COLOUR, '/textures/beetle.png', '/textures/beetle_normal.png'],
        [HivePieceType.Ladybug]: [basic.LADYBUG_COLOUR, '/textures/ladybug.png', '/textures/ladybug_normal.png'],
        [HivePieceType.Mosquito]: [basic.MOSQUITO_COLOUR, '/textures/mosquito.png', '/textures/mosquito_normal.png'],
    } as const;

    const [foreground, colorMap, normalMap] = (
        props.basic
            ? pieceTypicalBasicLookup
            : pieceTypicalPbrLookup
    )[props.pieceType];

    const geometry = useLoader(ObjGeometryLoader, props.basic ? '/models/tile-simplified.obj' : '/models/tile.obj');
    const image = useLoader(ImageLoader, colorMap);
    const normalTexture = useLoader(TextureLoader, normalMap);

    const canvas = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = image.width;
        c.height = image.height;
        return c;
    }, []);

    const texture = useMemo(() => {
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const {data: pixelBuffer} = imageData;

        for (let i = 0; i < pixelBuffer.length; i += 4) {
            if (pixelBuffer[i] > 128) {
                pixelBuffer[i] = ((foreground >>> 16) & 0xff);
                pixelBuffer[i + 1] = ((foreground >>> 8) & 0xff);
                pixelBuffer[i + 2] = (foreground & 0xff);
            } else {
                pixelBuffer[i] = ((background >>> 16) & 0xff);
                pixelBuffer[i + 1] = ((background >>> 8) & 0xff);
                pixelBuffer[i + 2] = (background & 0xff);
            }
        }

        context.putImageData(imageData, 0, 0);

        return new CanvasTexture(canvas);
    }, [background, foreground]);

    return <mesh ref={props.meshRef} geometry={geometry} castShadow onPointerDown={props.onPointerDown}>
        {props.basic
            ? <meshBasicMaterial map={texture}/>
            : <meshPhysicalMaterial roughness={0.1} map={texture} normalMap={normalTexture}/>}
    </mesh>;
};

// TODO make some basic shapes to fill in as a fallback (mostly used for rejoining/viewing a game, not really for beginning one)
export const BareTiles: React.FC = () => <></>;

export default Tiles;