import * as THREE from 'three'
import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import {STACK_HEIGHT_DISTANCE} from "./constants";
import {MouseState} from "./mouse-state";
import {createTile,} from "./tiles";
import {HexGrid, HexVector} from "./hex-grid";
import {ExternalGameInfo} from "./hud";
import ErrorModal from "./error-modal";
import CameraController from "./camera-controller";

export interface Move {
    moveType: "MOVE" | "PLACE";
    movement?: {
        from: {
            q: number;
            r: number;
        };
        to: {
            q: number;
            r: number;
        };
    };
    placement?: {
        pieceType: number;
        position: {
            q: number;
            r: number;
        };
    };
}

export interface MoveConsumer {
    consume(move: Move): unknown;
}

class Gameplay {
    private readonly _scene: THREE.Scene;
    private readonly grid: HexGrid = new HexGrid();
    private readonly blackMeshes = new Map<HivePieceType, THREE.Mesh>();
    private readonly whiteMeshes = new Map<HivePieceType, THREE.Mesh>();
    private readonly meshes = new Map<number, THREE.Mesh>();
    private readonly incorrectMoveModal = new ErrorModal({message: 'The attempted move was illegal'});
    private readonly cameraController: CameraController;
    public moveConsumer: MoveConsumer = {consume: () => {}};
    private selected: HexVector | null = null;

    public static async create(game: HiveGame, externalGameInfo: ExternalGameInfo, moveConsumer: MoveConsumer = {consume: () => {}}): Promise<Gameplay> {
        const gameplay = new Gameplay(game, externalGameInfo);
        gameplay.moveConsumer = moveConsumer;
        const pieceTypes = [
            HivePieceType.QueenBee, HivePieceType.SoldierAnt, HivePieceType.Spider,
            HivePieceType.Grasshopper, HivePieceType.Beetle, HivePieceType.Ladybug,
            HivePieceType.Mosquito];

        const createBlackMeshes = [];
        const createWhiteMeshes = [];

        for (const pieceType of pieceTypes) {
            createBlackMeshes.push(createTile(HiveColor.Black, pieceType));
            createWhiteMeshes.push(createTile(HiveColor.White, pieceType));
        }

        const blackMeshes = await Promise.all(createBlackMeshes);
        const whiteMeshes = await Promise.all(createWhiteMeshes);

        for (let i = 0; i < pieceTypes.length; i++) {
            gameplay.blackMeshes.set(pieceTypes[i], blackMeshes[i]);
            gameplay.whiteMeshes.set(pieceTypes[i], whiteMeshes[i]);
        }

        return gameplay;
    }

    private constructor(private readonly game: HiveGame, private readonly selector: ExternalGameInfo) {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x175c29);
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.copy(new THREE.Vector3(-1, -1, 1).normalize());
        light.castShadow = true;
        light.shadow.camera.lookAt(new THREE.Vector3(0, 0, 0));
        light.shadow.camera.near = -100.;
        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this._scene.add(light);
        this._scene.add(ambient);

        const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshPhysicalMaterial({
            color: 0x5cc955,
            specularIntensity: 0.8,
            roughness: 0.5,
        }));
        backgroundPlane.position.set(0, 0, 0);
        backgroundPlane.receiveShadow = true;
        this._scene.add(backgroundPlane);

        this.cameraController = new CameraController();
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
        const hex = this.getClickedTile(e);
        let selectedPieceType: HivePieceType | null;

        if ((selectedPieceType = this.selector.selectedPieceType()) != null) { // we have this.selected a piece and are now clicking to place it
            this.tryPlacePiece(selectedPieceType, hex);
        } else if (this.selected instanceof HexVector) {
            this.tryMovePiece(this.selected, hex);
        } else {
            this.selected = hex;
        }

        return true;
    }

    public getClickedTile(e: MouseEvent): HexVector {
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
        return this.grid.euclideanToHex(new THREE.Vector2(clickedWorld.x, clickedWorld.y));
    }

    public tryPlacePiece(pieceType: HivePieceType, position: HexVector): void {
        const color = this.game.colorToMove();
        const success = this.game.placeTile(pieceType, position);

        if (success) {
            let mesh: THREE.Mesh;
            switch (color) {
                case HiveColor.White: {
                    const got = this.whiteMeshes.get(pieceType)?.clone();
                    if (got == null) {
                        throw new Error(`mesh of piece type ${pieceType} was not created on game setup`);
                    }
                    mesh = got;
                    break;
                }
                case HiveColor.Black: {
                    const got = this.blackMeshes.get(pieceType)?.clone();
                    if (got == null) {
                        throw new Error(`mesh of piece type ${pieceType} was not created on game setup`);
                    }
                    mesh = got;
                    break;
                }
            }

            const position2d = this.grid.hexToEuclidean(position);
            mesh.position.set(position2d.x, position2d.y, 0);
            this._scene.add(mesh);
            this.meshes.set(this.game.idOfLastPlaced()!, mesh);

            this.moveConsumer.consume({
                moveType: "PLACE",
                placement: {
                    pieceType,
                    position: { q: position.q, r: position.r },
                },
            });
        } else {
            this.incorrectMoveModal.show();
        }

        this.updateMidpoint();
        this.selected = null;
    }

    public tryMovePiece(from: HexVector, to: HexVector): void {
        // we rely on the facts that 'this.game' never re-orders the tiles, and that tiles
        // cannot be removed from play
        const tileToMoveId = this.game.idOfTileAt(from);

        if (tileToMoveId != null) {
            const success = this.game.moveTile(from, to);
            this.updateMidpoint();

            if (success) {
                const position2d = this.grid.hexToEuclidean(to);
                const mesh = this.meshes.get(tileToMoveId)!;
                mesh.position.set(
                    position2d.x,
                    position2d.y,
                    this.game.tiles()[tileToMoveId].stackHeight * STACK_HEIGHT_DISTANCE
                );

                this.moveConsumer.consume({
                    moveType: "MOVE",
                    movement: {
                        from: { q: from.q, r: from.r },
                        to: { q: to.q, r: to.r },
                    },
                })
            } else {
                this.incorrectMoveModal.show();
            }
        }

        this.selected = null;
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
