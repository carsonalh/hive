import React, {
    createContext,
    MutableRefObject,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import {useLoader} from "@react-three/fiber";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Material, Mesh, MeshPhysicalMaterial, TextureLoader, Vector3} from "three";
import {useHiveStateContext} from "./GameplayOnline";
import {HiveColor, HivePieceType} from "../hive-game";
import {HexGrid} from "../hex-grid";

const WHITE_BACKGROUND = 0xffec8c;
const BLACK_BACKGROUND = 0x000000;
const QUEEN_BEE_COLOUR = 0xff6f00;
const SOLDIER_ANT_COLOUR = 0x3098F4;
const BEETLE_COLOUR = 0xA646E3;
const SPIDER_COLOUR = 0x551B0B;
const GRASSHOPPER_COLOUR = 0x20F312;
const LADYBUG_COLOUR = 0xA40006;
const MOSQUITO_COLOUR = 0x888888;

const TileContext = createContext<MutableRefObject<PreloadedTiles | null>>(null!);
const useTileContext = () => useContext(TileContext);

interface PreloadedTiles {
    blackQueenBee: Mesh;
    blackSoldierAnt: Mesh;
    blackGrasshopper: Mesh;
    blackSpider: Mesh;
    blackBeetle: Mesh;
    blackLadybug: Mesh;
    blackMosquito: Mesh;
    whiteQueenBee: Mesh;
    whiteSoldierAnt: Mesh;
    whiteGrasshopper: Mesh;
    whiteSpider: Mesh;
    whiteBeetle: Mesh;
    whiteLadybug: Mesh;
    whiteMosquito: Mesh;
    blackQueenBeeBasic: Mesh;
    blackSoldierAntBasic: Mesh;
    blackGrasshopperBasic: Mesh;
    blackSpiderBasic: Mesh;
    blackBeetleBasic: Mesh;
    blackLadybugBasic: Mesh;
    blackMosquitoBasic: Mesh;
    whiteQueenBeeBasic: Mesh;
    whiteSoldierAntBasic: Mesh;
    whiteGrasshopperBasic: Mesh;
    whiteSpiderBasic: Mesh;
    whiteBeetleBasic: Mesh;
    whiteLadybugBasic: Mesh;
    whiteMosquitoBasic: Mesh;
}

interface TileProviderProps {
    children: React.ReactNode;
}

const TileProvider: React.FC<TileProviderProps> = props => {
    const mesh = useMesh('/models/tile.obj');
    // const basicMesh = useMesh('/models/tile-simplified.obj');

    const preloadedTilesBuilderRef = useRef<Partial<PreloadedTiles>>({});
    const preloadedTilesRef = useRef<PreloadedTiles | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const jobs: [number, number, string, string, keyof PreloadedTiles][] = [
            [QUEEN_BEE_COLOUR, BLACK_BACKGROUND, '/textures/queenbee.png', '/textures/queenbee_normal.png', 'blackQueenBee'],
            [SOLDIER_ANT_COLOUR, BLACK_BACKGROUND, '/textures/soldierant.png', '/textures/soldierant_normal.png', 'blackSoldierAnt'],
            [GRASSHOPPER_COLOUR, BLACK_BACKGROUND, '/textures/grasshopper.png', '/textures/grasshopper_normal.png', 'blackGrasshopper'],
            [SPIDER_COLOUR, BLACK_BACKGROUND, '/textures/spider.png', '/textures/spider_normal.png', 'blackSpider'],
            [BEETLE_COLOUR, BLACK_BACKGROUND, '/textures/beetle.png', '/textures/beetle_normal.png', 'blackBeetle'],
            [LADYBUG_COLOUR, BLACK_BACKGROUND, '/textures/ladybug.png', '/textures/ladybug_normal.png', 'blackLadybug'],
            [MOSQUITO_COLOUR, BLACK_BACKGROUND, '/textures/mosquito.png', '/textures/mosquito_normal.png', 'blackMosquito'],
            [QUEEN_BEE_COLOUR, WHITE_BACKGROUND, '/textures/queenbee.png', '/textures/queenbee_normal.png', 'whiteQueenBee'],
            [SOLDIER_ANT_COLOUR, WHITE_BACKGROUND, '/textures/soldierant.png', '/textures/soldierant_normal.png', 'whiteSoldierAnt'],
            [GRASSHOPPER_COLOUR, WHITE_BACKGROUND, '/textures/grasshopper.png', '/textures/grasshopper_normal.png', 'whiteGrasshopper'],
            [SPIDER_COLOUR, WHITE_BACKGROUND, '/textures/spider.png', '/textures/spider_normal.png', 'whiteSpider'],
            [BEETLE_COLOUR, WHITE_BACKGROUND, '/textures/beetle.png', '/textures/beetle_normal.png', 'whiteBeetle'],
            [LADYBUG_COLOUR, WHITE_BACKGROUND, '/textures/ladybug.png', '/textures/ladybug_normal.png', 'whiteLadybug'],
            [MOSQUITO_COLOUR, WHITE_BACKGROUND, '/textures/mosquito.png', '/textures/mosquito_normal.png', 'whiteMosquito'],
        ];

        const promises: Promise<Mesh>[] = [];

        for (const job of jobs) {
            const [foreground, background, colorSrc, normalSrc, key] = job;
            const p = (async () => {
                const m = mesh.clone();
                m.material = await loadMaterial(foreground, background, colorSrc, normalSrc);
                return (preloadedTilesBuilderRef.current[key] = m);
            })()
            promises.push(p);
        }

        Promise.all(promises).then(() => {
            if (preloadedTilesBuilderRef.current.blackQueenBee != null &&
                preloadedTilesBuilderRef.current.blackSoldierAnt != null &&
                preloadedTilesBuilderRef.current.blackGrasshopper != null &&
                preloadedTilesBuilderRef.current.blackSpider != null &&
                preloadedTilesBuilderRef.current.blackBeetle != null &&
                preloadedTilesBuilderRef.current.blackLadybug != null &&
                preloadedTilesBuilderRef.current.blackMosquito != null &&
                preloadedTilesBuilderRef.current.whiteQueenBee != null &&
                preloadedTilesBuilderRef.current.whiteSoldierAnt != null &&
                preloadedTilesBuilderRef.current.whiteGrasshopper != null &&
                preloadedTilesBuilderRef.current.whiteSpider != null &&
                preloadedTilesBuilderRef.current.whiteBeetle != null &&
                preloadedTilesBuilderRef.current.whiteLadybug != null &&
                preloadedTilesBuilderRef.current.whiteMosquito != null) {
                preloadedTilesRef.current = preloadedTilesBuilderRef.current as PreloadedTiles;
                setLoaded(true)
            } else {
                throw new Error('implicitly failed to load at least one mesh');
            }
        })

        return () => {
            for (const p of promises) {
                p.then(mesh => {
                    mesh.geometry.dispose();
                    (mesh.material as Material).dispose();
                });
            }
        }
    }, []);

    if (loaded && preloadedTilesRef.current == null) {
        throw new Error('illegal state, the preloaded tiles should be set once loaded');
    }

    return <TileContext.Provider value={preloadedTilesRef}>
        {props.children}
    </TileContext.Provider>
}

const Tiles: React.FC = () => {
    const hiveState = useHiveStateContext();
    const hexGrid = new HexGrid();

    return <TileProvider>
        {hiveState.tiles.map((t, i) => {
            const position2d = hexGrid.hexToEuclidean(t.position);
            const position3d = new Vector3().copy({...position2d, z: 0})

            return <Tile
                key={i}
                color={t.color}
                pieceType={t.pieceType}
                position={position3d}
            />
        })}
    </TileProvider>;
};

export interface TileProps {
    color: HiveColor;
    pieceType: HivePieceType;
    position: Vector3;
}

const Tile: React.FC<TileProps> = props => {
    const preloadedTilesRef = useTileContext();
    const meshRef = useRef<Mesh | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (preloadedTilesRef.current == null) return;
        const key = ({
            [HiveColor.Black]: {
                [HivePieceType.QueenBee]: 'blackQueenBee',
                [HivePieceType.SoldierAnt]: 'blackSoldierAnt',
                [HivePieceType.Grasshopper]: 'blackGrasshopper',
                [HivePieceType.Spider]: 'blackSpider',
                [HivePieceType.Beetle]: 'blackBeetle',
                [HivePieceType.Ladybug]: 'blackLadybug',
                [HivePieceType.Mosquito]: 'blackMosquito',
            },
            [HiveColor.White]: {
                [HivePieceType.QueenBee]: 'whiteQueenBee',
                [HivePieceType.SoldierAnt]: 'whiteSoldierAnt',
                [HivePieceType.Grasshopper]: 'whiteGrasshopper',
                [HivePieceType.Spider]: 'whiteSpider',
                [HivePieceType.Beetle]: 'whiteBeetle',
                [HivePieceType.Ladybug]: 'whiteLadybug',
                [HivePieceType.Mosquito]: 'whiteMosquito',
            },
        } as const)[props.color][props.pieceType];
        meshRef.current = preloadedTilesRef.current[key].clone();
        const mesh = meshRef.current;
        mesh.rotation.set(Math.PI / 2, 0, 0);
        setLoaded(true);
    }, [preloadedTilesRef.current]);

    useEffect(() => {
        if (preloadedTilesRef.current == null) return;
        const mesh = meshRef.current as Mesh;
        mesh.position.copy(props.position);
    }, [preloadedTilesRef.current, props.position]);

    return <>
        {loaded
            ? <primitive object={meshRef.current as Mesh} />
            : null}
    </>;
};

const useMesh = (path: string) => {
    const tile = useLoader(OBJLoader, path);
    const meshRef = useRef<Mesh | null>(null);

    if (meshRef.current == null) {
        tile.traverse((o: any) => {
            if (o.isMesh) {
                meshRef.current = (o as Mesh).clone();
            }
        });

        if (meshRef.current == null) {
            throw new Error('either got an unexpected obj file or incorrect logic');
        }

        console.dir(meshRef.current)
    }

    console.log('mesh should have resolved')

    return meshRef.current;
}

async function loadMaterial(foregroundColor: number, backgroundColor: number, shapeUrl: string, normalUrl: string) {
    const dumpCanvas = document.createElement('canvas');
    dumpCanvas.width = dumpCanvas.height = 1024;
    const loadCanvas = document.createElement('canvas');
    loadCanvas.width = loadCanvas.height = 1024;
    const dumpContext = dumpCanvas.getContext('2d');
    if (dumpContext == null) {
        throw new Error('context cannot be null');
    }
    const loadContext = loadCanvas.getContext('2d');
    if (loadContext == null) {
        throw new Error('context cannot be null');
    }

    const foreground = {
        r: (foregroundColor >>> 16) & 0xff,
        g: (foregroundColor >>> 8) & 0xff,
        b: (foregroundColor >>> 0) & 0xff,
    };

    const background = {
        r: (backgroundColor >>> 16) & 0xff,
        g: (backgroundColor >>> 8) & 0xff,
        b: (backgroundColor >>> 0) & 0xff,
    };

    const textureImage = new Image(1024, 1024);
    textureImage.src = shapeUrl;
    const loadedImageUrl = new Promise<string>(resolve => {
        textureImage.onload = function () {
            textureImage.style.display = 'none';
            dumpContext.drawImage(textureImage, 0, 0);
            const imageData = dumpContext.getImageData(0, 0, dumpCanvas.width, dumpCanvas.height);
            const {data} = imageData;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 128) {
                    data[i] = foreground.r;
                    data[i + 1] = foreground.g;
                    data[i + 2] = foreground.b;
                } else {
                    data[i] = background.r;
                    data[i + 1] = background.g;
                    data[i + 2] = background.b;
                }
            }

            loadContext.putImageData(imageData, 0, 0);
            resolve(loadCanvas.toDataURL('image/png'));
        };
    });

    const texture = await new TextureLoader().loadAsync(await loadedImageUrl);
    const normalMap = await new TextureLoader().loadAsync(normalUrl);
    return new MeshPhysicalMaterial({
        roughness: .1,
        map: texture,
        normalMap: normalMap,
    });
}

// TODO make some basic shapes to fill in as a fallback (mostly used for rejoining/viewing a game, not really for beginning one)
export const BareTiles: React.FC = () => <></>;

export default Tiles;