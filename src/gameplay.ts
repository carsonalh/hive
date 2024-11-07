import * as THREE from 'three'
import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import {
    CAMERA_POSITION_MAX,
    CAMERA_POSITION_MIN,
    SCROLL_FACTOR,
    STACK_HEIGHT_DISTANCE
} from "./constants";
import {MouseState} from "./mouse-state";
import {
    BLACK_BEETLE,
    BLACK_GRASSHOPPER,
    BLACK_LADYBUG,
    BLACK_MOSQUITO,
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    BLACK_SPIDER, HEXAGON_SHAPE,
    WHITE_BEETLE,
    WHITE_GRASSHOPPER,
    WHITE_LADYBUG,
    WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT,
    WHITE_SPIDER
} from "./tiles";
import {HexGrid, HexVector} from "./hex-grid";
import {ReserveTileSelector} from "./hud";
import ErrorModal from "./error-modal";

class Gameplay {
    private readonly _scene: THREE.Scene;
    private readonly _camera: THREE.PerspectiveCamera;
    private readonly grid: HexGrid = new HexGrid();
    private readonly marker: THREE.Mesh;
    private readonly meshes = new Map<number, THREE.Mesh>();
    private readonly incorrectMoveModal = new ErrorModal({ message: 'The attempted move was illegal' });
    private selected: HexVector | null = null;

    public constructor(private readonly game: HiveGame, private readonly selector: ReserveTileSelector) {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x175c29);

        this._camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
        this._camera.position.z = 10;
        this._camera.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI / 4)

        this.marker = new THREE.Mesh(new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()), new THREE.MeshBasicMaterial({color: 0xff0000}));
        this.marker.rotateZ(1 / 12 * 2 * Math.PI);
    }

    public onResize(): void {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
    }

    public onWheel(e: WheelEvent): void {
        // TODO make this on the axis that the camera is looking at
        let newPosition = this._camera.position.z + SCROLL_FACTOR * e.deltaY;

        if (newPosition > CAMERA_POSITION_MAX) {
            newPosition = CAMERA_POSITION_MAX;
        } else if (newPosition < CAMERA_POSITION_MIN) {
            newPosition = CAMERA_POSITION_MIN;
        }

        this._camera.position.z = newPosition;
    }

    /**
     * Returns true if the event was handled.
     */
    public onClick(e: MouseEvent, state: MouseState): boolean {
        const raycaster = new THREE.Raycaster();
        const clickedNDC = new THREE.Vector2(
            2 * e.clientX / window.innerWidth - 1,
            -2 * e.clientY / window.innerHeight + 1,
        );
        // console.log(clickedWorld)
        const gameSurface = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const clickedWorld = new THREE.Vector3();
        raycaster.ray.intersectPlane(gameSurface, clickedWorld);
        raycaster.setFromCamera(clickedNDC, this._camera);
        raycaster.ray.intersectPlane(gameSurface, clickedWorld)
        const hex = this.grid.euclideanToHex(new THREE.Vector2(clickedWorld.x, clickedWorld.y));
        const hexPosition = this.grid.hexToEuclidean(hex)
        this.marker.position.set(hexPosition.x, hexPosition.y, 0);
        this._scene.add(this.marker);
        let selectedPieceType: HivePieceType | null;
        if ((selectedPieceType = this.selector.selectedPieceTypeForPlacement()) != null) { // we have this.selected a piece and are now clicking to place it
            const color = this.game.colorToMove();
            const success = this.game.placeTile(selectedPieceType, hex);

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

    /**
     * To be called when clicked away from the 'gameplay' scene.
     */
    public onClickAway(): void {
        this.selected = null;
        this._scene.remove(this.marker);
    }

    public onMouseMove(e: MouseEvent, state: MouseState): void {
        if (!state.rightButtonDown) {
            return;
        }

        const raycaster = new THREE.Raycaster();

        const mouseNDC = new THREE.Vector2(
            2 * e.clientX / window.innerWidth - 1,
            -2 * e.clientY / window.innerHeight + 1
        );
        raycaster.setFromCamera(mouseNDC, this._camera);
        const target = new THREE.Vector3();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        raycaster.ray.intersectPlane(plane, target);

        const to = target.clone();

        const previousMouseNDC = new THREE.Vector2(
            2 * (e.clientX + e.movementX) / window.innerWidth - 1,
            -2 * (e.clientY + e.movementY) / window.innerHeight + 1
        );
        raycaster.setFromCamera(previousMouseNDC, this.camera);
        raycaster.ray.intersectPlane(plane, target);
        const from = target.clone();

        const delta = to.sub(from);
        this._camera.position.add(delta);
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this._camera;
    }
}

export default Gameplay;
