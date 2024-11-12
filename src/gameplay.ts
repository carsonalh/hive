import * as THREE from 'three'
import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import {STACK_HEIGHT_DISTANCE} from "./constants";
import {MouseState} from "./mouse-state";
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
    WHITE_SPIDER,
    createTile,
} from "./tiles";
import {HexGrid, HexVector} from "./hex-grid";
import {ReserveTileSelector} from "./hud";
import ErrorModal from "./error-modal";
import CameraController from "./camera-controller";

class Gameplay {
    private readonly _scene: THREE.Scene;
    private readonly grid: HexGrid = new HexGrid();
    private readonly marker: THREE.Mesh;
    private readonly meshes = new Map<number, THREE.Mesh>();
    private readonly incorrectMoveModal = new ErrorModal({ message: 'The attempted move was illegal' });
    private readonly cameraController: CameraController;
    private selected: HexVector | null = null;

    public static async create(game: HiveGame, selector: ReserveTileSelector): Promise<Gameplay> {
        const gameplay = new Gameplay(game, selector);
        const tile = await createTile(HiveColor.White, HivePieceType.Grasshopper);
        gameplay._scene.add(tile);
        return gameplay
    }

    private constructor(private readonly game: HiveGame, private readonly selector: ReserveTileSelector) {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x175c29);
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.copy(new THREE.Vector3(-1, -1, 1).normalize());
        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this._scene.add(new THREE.AxesHelper(3))
        this._scene.add(light);
        this._scene.add(ambient);

        this.cameraController = new CameraController();

        this.marker = new THREE.Mesh(new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()), new THREE.MeshBasicMaterial({color: 0xff0000}));
        this.marker.rotateZ(1 / 12 * 2 * Math.PI);
    }

    public onResize(): void {
        this.cameraController.onResize();
    }

    public onWheel(e: WheelEvent): void {
        this.cameraController.onWheel(e);
    }

    /**
     * Returns true if the event was handled.
     */
    public onClick(e: MouseEvent, _state: MouseState): boolean {
        const raycaster = new THREE.Raycaster();
        const clickedNDC = new THREE.Vector2(
            2 * e.clientX / window.innerWidth - 1,
            -2 * e.clientY / window.innerHeight + 1,
        );
        // console.log(clickedWorld)
        const gameSurface = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const clickedWorld = new THREE.Vector3();
        raycaster.ray.intersectPlane(gameSurface, clickedWorld);
        raycaster.setFromCamera(clickedNDC, this.cameraController.camera);
        raycaster.ray.intersectPlane(gameSurface, clickedWorld)
        const hex = this.grid.euclideanToHex(new THREE.Vector2(clickedWorld.x, clickedWorld.y));
        const hexPosition = this.grid.hexToEuclidean(hex)
        this.marker.position.set(hexPosition.x, hexPosition.y, 0);
        this._scene.add(this.marker);
        let selectedPieceType: HivePieceType | null;
        if ((selectedPieceType = this.selector.selectedPieceTypeForPlacement()) != null) { // we have this.selected a piece and are now clicking to place it
            const color = this.game.colorToMove();
            const success = this.game.placeTile(selectedPieceType, hex);
            this.updateMidpoint();

            if (success) {
                let mesh: THREE.Mesh;
                switch (color) {
                    case HiveColor.White:
                        switch (selectedPieceType) {
                            case HivePieceType.QueenBee:
                                mesh = WHITE_QUEEN_BEE.clone();
                                break;
                            case HivePieceType.SoldierAnt:
                                mesh = WHITE_SOLDIER_ANT.clone();
                                break;
                            case HivePieceType.Spider:
                                mesh = WHITE_SPIDER.clone();
                                break;
                            case HivePieceType.Grasshopper:
                                mesh = WHITE_GRASSHOPPER.clone();
                                break;
                            case HivePieceType.Beetle:
                                mesh = WHITE_BEETLE.clone();
                                break;
                            case HivePieceType.Ladybug:
                                mesh = WHITE_LADYBUG.clone();
                                break;
                            case HivePieceType.Mosquito:
                                mesh = WHITE_MOSQUITO.clone();
                                break;
                        }
                        break;
                    case HiveColor.Black:
                        switch (selectedPieceType) {
                            case HivePieceType.QueenBee:
                                mesh = BLACK_QUEEN_BEE.clone();
                                break;
                            case HivePieceType.SoldierAnt:
                                mesh = BLACK_SOLDIER_ANT.clone();
                                break;
                            case HivePieceType.Spider:
                                mesh = BLACK_SPIDER.clone();
                                break;
                            case HivePieceType.Grasshopper:
                                mesh = BLACK_GRASSHOPPER.clone();
                                break;
                            case HivePieceType.Beetle:
                                mesh = BLACK_BEETLE.clone();
                                break;
                            case HivePieceType.Ladybug:
                                mesh = BLACK_LADYBUG.clone();
                                break;
                            case HivePieceType.Mosquito:
                                mesh = BLACK_MOSQUITO.clone();
                                break;
                        }
                        break;
                }

                const position2d = this.grid.hexToEuclidean(hex);
                mesh.position.set(position2d.x, position2d.y, 0);
                this._scene.add(mesh);
                this.meshes.set(this.game.idOfLastPlaced()!, mesh);
            } else {
                this.incorrectMoveModal.show();
            }

            this.selected = null;
        } else if (this.selected instanceof HexVector) {
            // we rely on the facts that 'this.game' never re-orders the tiles, and that tiles
            // cannot be removed from play
            const tileToMoveId = this.game.idOfTileAt(this.selected);

            if (tileToMoveId != null) {
                const success = this.game.moveTile(this.selected, hex);
                this.updateMidpoint();

                if (success) {
                    const position2d = this.grid.hexToEuclidean(hex);
                    this.meshes.get(tileToMoveId)!.position.set(
                        position2d.x,
                        position2d.y,
                        this.game.tiles()[tileToMoveId].stackHeight * STACK_HEIGHT_DISTANCE
                    );
                } else {
                    this.incorrectMoveModal.show();
                }
            }

            this.selected = null;
        } else {
            this.selected = hex;
        }

        return true;
    }

    private updateMidpoint(): void {
        const midpoint = new THREE.Vector2();

        let count = 0;
        for (const tile of this.game.tiles()) {
            const point = this.grid.hexToEuclidean(tile.position);
            midpoint.add(point);
            count++;
        }

        midpoint.multiplyScalar(1 / count);

        this.cameraController.onMidpointChange(new THREE.Vector3(midpoint.x, midpoint.y, 0));
    }

    public onUpdate(deltaTimeMs: number, state: MouseState): void {
        this.cameraController.onUpdate(deltaTimeMs, state);
    }

    /**
     * To be called when clicked away from the 'gameplay' scene.
     */
    public onClickAway(): void {
        this.selected = null;
        this._scene.remove(this.marker);
    }

    public onMouseMove(e: MouseEvent, state: MouseState): void {
        this.cameraController.onMouseMove(e, state);
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this.cameraController.camera;
    }
}

export default Gameplay;
