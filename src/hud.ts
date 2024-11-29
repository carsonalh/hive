import {HiveColor, HivePieceType} from "./hive-game";
import * as THREE from "three";
import {
    BLACK_BEETLE,
    BLACK_GRASSHOPPER,
    BLACK_LADYBUG,
    BLACK_MOSQUITO,
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    BLACK_SPIDER,
    HEXAGON_SHAPE,
    WHITE_BEETLE,
    WHITE_GRASSHOPPER,
    WHITE_LADYBUG,
    WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT,
    WHITE_SPIDER
} from "./tiles";
import {MouseState} from "./mouse-state";
import {HexGrid, HexVector} from "./hex-grid";
import {RADIUS} from "./constants";

const TILE_WIDTH_PX = 100;
const TILE_GAP_PX = 5;
const TILE_0_LEFT_PX = 55;
const TILE_0_TOP_PX = 55 * 2 / Math.sqrt(3);

export enum PlayerColor {
    ColorToMove,
    Black,
    White,
}

class Hud {
    private readonly _scene: THREE.Scene;
    private readonly _camera: THREE.OrthographicCamera;
    private readonly whiteMeshes: THREE.Mesh[];
    private readonly blackMeshes: THREE.Mesh[];
    private readonly pieceTypes: HivePieceType[];
    private readonly pieceCountElements: HTMLParagraphElement[];
    private readonly marker: THREE.Mesh;
    private readonly locations: HexVector[];
    private grid: HexGrid;
    private selected: HivePieceType | null;

    private tile0Location = new THREE.Vector3();
    private pieceCounts: Record<HivePieceType, number> = {
        [HivePieceType.QueenBee]: 0,
        [HivePieceType.SoldierAnt]: 0,
        [HivePieceType.Spider]: 0,
        [HivePieceType.Grasshopper]: 0,
        [HivePieceType.Beetle]: 0,
        [HivePieceType.Ladybug]: 0,
        [HivePieceType.Mosquito]: 0,
    };
    private playerColor: HiveColor = HiveColor.Black;

    public constructor() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);
        this._camera.position.z = 5;
        this.selected = null;

        this.locations = [
            new HexVector(0, 0),
            new HexVector(0, 1),
            new HexVector(-1, 2),
            new HexVector(-1, 3),
            new HexVector(-2, 4),
            new HexVector(-2, 5),
            new HexVector(-3, 6),
        ];

        this.marker = new THREE.Mesh(
            new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()),
            new THREE.MeshBasicMaterial({color: 0xff0000})
        );
        this.marker.rotateZ(1 / 12 * 2 * Math.PI);

        this.pieceCountElements = new Array(7).fill(0).map(_ => document.createElement('p'));
        this.pieceCountElements.forEach((e, i) => {
            if (i % 2 == 0) {
                e.style.transform = 'translate(calc(-100% - 30px), -50%)';
            } else {
                e.style.transform = 'translate(30px, -50%)';
            }
            e.style.position = 'absolute';
            e.style.display = 'block';
            document.body.appendChild(e)
        });

        this.whiteMeshes = [
            WHITE_QUEEN_BEE.clone(),
            WHITE_SOLDIER_ANT.clone(),
            WHITE_SPIDER.clone(),
            WHITE_GRASSHOPPER.clone(),
            WHITE_BEETLE.clone(),
            WHITE_LADYBUG.clone(),
            WHITE_MOSQUITO.clone(),
        ];

        this.blackMeshes = [
            BLACK_QUEEN_BEE.clone(),
            BLACK_SOLDIER_ANT.clone(),
            BLACK_SPIDER.clone(),
            BLACK_GRASSHOPPER.clone(),
            BLACK_BEETLE.clone(),
            BLACK_LADYBUG.clone(),
            BLACK_MOSQUITO.clone(),
        ];

        this.pieceTypes = [
            HivePieceType.QueenBee,
            HivePieceType.SoldierAnt,
            HivePieceType.Spider,
            HivePieceType.Grasshopper,
            HivePieceType.Beetle,
            HivePieceType.Ladybug,
            HivePieceType.Mosquito,
        ];

        this.grid = new HexGrid((TILE_WIDTH_PX + TILE_GAP_PX) * 10 / window.innerWidth);
        this.onResize();
    }

    /**
     * Return true if the click hit something in the hud.
     */
    public onMouseDown(e: MouseEvent, _: MouseState): boolean {
        const hudPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const raycaster = new THREE.Raycaster();
        const clicked = new THREE.Vector2(
            2 * e.clientX / window.innerWidth - 1,
            -2 * e.clientY / window.innerHeight + 1,
        );
        raycaster.setFromCamera(clicked, this._camera);
        const clickedWorld = new THREE.Vector3();
        raycaster.ray.intersectPlane(hudPlane, clickedWorld);
        clickedWorld.sub(this.tile0Location);
        const hex = this.grid.euclideanToHex(new THREE.Vector2(clickedWorld.x, clickedWorld.y));
        const found = this.locations.findIndex(v => v.equals(hex));
        if (found >= 0) {
            this.selected = this.pieceTypes[found];
            const placeMarker = this.grid.hexToEuclidean(hex);
            placeMarker.add(this.tile0Location);
            this.marker.position.set(placeMarker.x, placeMarker.y, 0);
            this._scene.add(this.marker);
            return true;
        } else {
            return false;
        }
    }

    public onClickAway(): void {
        this._scene.remove(this.marker);
        this.selected = null;
    }

    public onResize() {
        this.grid = new HexGrid((TILE_WIDTH_PX + TILE_GAP_PX) * 10 / window.innerWidth);
        this._camera.top = 5 * window.innerHeight / window.innerWidth;
        this._camera.bottom = -5 * window.innerHeight / window.innerWidth;
        this._camera.updateProjectionMatrix();
        this.placeMeshesAndPieceCounts(this.coloredMeshes());
        this.marker.scale.set(1, 1, 1);
        this.marker.scale.multiplyScalar(
            ((TILE_WIDTH_PX + 2 * TILE_GAP_PX) * 10 / window.innerWidth) / (2 * RADIUS)
        );
        if (this.selected != null) {
            const placeMarker = this.grid.hexToEuclidean(this.locations[this.pieceTypes.indexOf(this.selected)]);
            placeMarker.add(this.tile0Location);
            this.marker.position.set(placeMarker.x, placeMarker.y, 0);
        }
    }

    public update() {
        this._scene.clear();
        this.placeMeshesAndPieceCounts(this.coloredMeshes());
    }

    /**
     * Gets which piece type should be placed based on the HUD selection.
     */
    public get selectedPieceType(): HivePieceType | null {
        return this.selected;
    }

    public setPieceCounts(counts: Record<HivePieceType, number>): void {

    }

    public setPlayerColor(color: HiveColor) {
        this.playerColor = color;
        this._scene.clear();
        this.placeMeshesAndPieceCounts(this.coloredMeshes())
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this._camera;
    }

    private coloredMeshes(): THREE.Mesh[] {
        switch (this.playerColor) {
            case HiveColor.Black:
                return this.blackMeshes;
            case HiveColor.White:
                return this.whiteMeshes;
            default:
                throw new Error('unreachable');
        }
    }

    private placeMeshesAndPieceCounts(meshes: THREE.Mesh[]): void {
        this.tile0Location = new THREE.Vector3(
            2 * (TILE_0_LEFT_PX / window.innerWidth) - 1,
            -2 * (TILE_0_TOP_PX / window.innerHeight) + 1,
            0
        );
        this.tile0Location.applyMatrix4(this._camera.projectionMatrixInverse);
        this.tile0Location.setZ(0);

        for (let i = 0; i < meshes.length; i++) {
            const position = this.grid.hexToEuclidean(this.locations[i]);
            meshes[i].position.set(position.x, position.y, 0);
            meshes[i].position.add(this.tile0Location);
            const scale = TILE_WIDTH_PX * 5 / (window.innerWidth * RADIUS);
            meshes[i].scale.set(scale, scale, scale);
            this._scene.add(meshes[i]);
        }

        for (let i = 0; i < this.pieceCountElements.length; i++) {
            let hex: HexVector;
            if (i % 2 == 0) {
                hex = this.locations[i].add(new HexVector(1, 0));
            } else {
                hex = this.locations[i].add(new HexVector(-1, 0));
            }

            const location2d = this.grid.hexToEuclidean(hex).add(this.tile0Location);
            const location3d = new THREE.Vector3(location2d.x, location2d.y, 0);
            location3d.applyMatrix4(this._camera.projectionMatrix);

            this.pieceCountElements[i].style.left = `${window.innerWidth * (.5 * location3d.x + .5)}px`;
            this.pieceCountElements[i].style.top = `${window.innerHeight * (-.5 * location3d.y + .5)}px`;
            this.pieceCountElements[i].textContent = String(this.pieceCounts[this.pieceTypes[i]]);
        }
    }
}

export default Hud;