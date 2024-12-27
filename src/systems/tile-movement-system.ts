import System from "./system";
import {Mesh, PlaneGeometry, Raycaster, Vector2} from "three";
import MeshComponent from "../components/mesh-component";
import TileComponent from "../components/tile-component";
import {LEFT_BUTTON} from "../constants";
import HiveGameComponent from "../components/hive-game-component";
import CameraComponent from "../components/camera-component";
import {screenToNdc} from "../util";
import TileLayoutComponent from "../components/tile-layout-component";
import UserSelectionComponent from "../components/user-selection-component";
import PlayModeComponent, {PlayMode} from "../components/play-mode-component";
import {Move} from "../online-client";
import {HexVector} from "../hex-grid";
import {HiveGame, HivePieceType} from "../hive-game";
import TileEntity from "../entities/tile-entity";

/**
 * Responsible for making moves in the game.
 */
export default class TileMovementSystem extends System {
    private raycaster = new Raycaster();
    private previousPlayMode = PlayMode.Local;

    onUpdate() {
        const mode = this.registry.getSingletonComponent(PlayModeComponent);

        const currentMode = mode.playMode()

        if (this.previousPlayMode !== currentMode) {
            if (currentMode === PlayMode.Online) {
                mode.client().addReceiveMoveHandler(this.onReceiveMove.bind(this));
            } else {
                const gameComponent = this.registry.getSingletonComponent(HiveGameComponent);
                gameComponent.game = new HiveGame();
                this.registry.removeEntity(...this.registry.getEntitiesWithComponents(TileComponent));
            }
        }

        this.previousPlayMode = currentMode;
    }

    private onReceiveMove(move: Move) {
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);
        const opponentColor = game.colorToMove();

        if (move.moveType === 'PLACE') {
            if (game.placeTile(move.pieceType, move.position)) {
                const id = game.idOfLastPlaced();
                if (id == null) {
                    throw new Error('id cannot be null');
                }

                // We don't want to be able to hover/select opponent tiles
                const selectable = false;
                TileEntity.create(opponentColor, move.pieceType, id, selectable).then(entity => {
                    this.registry.addEntity(entity);
                });
            }
        } else {
            game.moveTile(move.from, move.to);
        }
    }

    onMouseDown(e: MouseEvent) {
        if (e.button !== LEFT_BUTTON) {
            return false;
        }

        const hiveGameComponent = this.registry.getSingletonComponent(HiveGameComponent);
        const {game} = hiveGameComponent;
        const mode = this.registry.getSingletonComponent(PlayModeComponent);
        if (mode.playMode() === PlayMode.Online && game.colorToMove() !== mode.client().color()) {
            return true;
        }

        const ndc = new Vector2();
        screenToNdc(new Vector2(e.clientX, e.clientY), ndc);
        const {camera} = this.registry.getSingletonComponent(CameraComponent);
        this.raycaster.setFromCamera(ndc, camera);

        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);
        const tiles = this.registry.getEntitiesWithComponents(TileComponent);
        const tileMeshes = tiles.map(t => t.getComponent(MeshComponent).mesh);
        const tileIntersections = this.raycaster.intersectObjects(tileMeshes)

        const backgroundPlane = this.registry
            .getComponents(MeshComponent)
            .find(mc => mc.mesh.geometry instanceof PlaneGeometry)!
            .mesh;
        const backgroundIntersections = this.raycaster.intersectObject(backgroundPlane);

        const hitTile = tileIntersections.length > 0;
        const hitBackground = backgroundIntersections.length > 0;

        const playerColor = mode.playMode() === PlayMode.Online ? mode.client().color() : game.colorToMove();

        if (hitTile) {
            const hitTileComponent = tiles[tileMeshes.indexOf(tileIntersections[0].object as Mesh)]
                .getComponent(TileComponent);
            const tile = game.tiles()[hitTileComponent.id];

            if (tile.color !== playerColor) {
                return true;
            }

            if (userSelection.position != null) {
                if (this.moveTile(userSelection.position, tile.position)) {
                    tile.position = userSelection.position;
                }
            } else {
                userSelection.position = tile.position;
            }

            return true;
        } else if (hitBackground) {
            const hit = new Vector2().copy(backgroundIntersections[0].point.clone());
            const {hexGrid} = this.registry.getSingletonComponent(TileLayoutComponent);
            const hex = hexGrid.euclideanToHex(hit);

            if (userSelection.pieceType != null) {
                const {pieceType} = userSelection;
                const colorToMove = game.colorToMove();
                if (this.placeTile(pieceType, hex)) {
                    const id = game.idOfLastPlaced();
                    if (id == null) {
                        throw new Error('id cannot be null');
                    }

                    TileEntity.create(colorToMove, pieceType, id).then(entity => {
                        userSelection.deselectAll();
                        this.registry.addEntity(entity);
                    })
                }
            } else if (userSelection.position != null) {
                if (this.moveTile(userSelection.position, hex)) {
                    userSelection.deselectAll();
                }
            }

            return true;
        }

        return false;
    }

    private moveTile(from: HexVector, to: HexVector): boolean {
        const mode = this.registry.getSingletonComponent(PlayModeComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        const success = game.moveTile(from, to);

        if (mode.playMode() === PlayMode.Online) {
            mode.client().moveTile(from, to);
        }

        if (success) {
            userSelection.deselectAll();
        }

        return success;
    }

    private placeTile(pieceType: HivePieceType, position: HexVector): boolean {
        const mode = this.registry.getSingletonComponent(PlayModeComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        const success = game.placeTile(pieceType, position);

        if (mode.playMode() === PlayMode.Online) {
            mode.client().placeTile(pieceType, position);
        }

        if (success) {
            userSelection.deselectAll();
        }

        return success;
    }
}