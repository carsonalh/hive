import System from "./system";
import {Mesh, PlaneGeometry, Raycaster, Vector2} from "three";
import MeshComponent from "../components/mesh-component";
import TileComponent from "../components/tile-component";
import {LEFT_BUTTON} from "../constants";
import HiveGameComponent from "../components/hive-game-component";
import CameraComponent from "../components/camera-component";
import {screenToNdc} from "../util";
import UserSelectionComponent from "../components/user-selection-component";
import PlayModeComponent, {PlayMode} from "../components/play-mode-component";
import {Move} from "../online-client";
import {HexVector} from "../hex-grid";
import {HiveColor, HiveGame, HivePieceType} from "../hive-game";
import TileEntity from "../entities/tile-entity";
import HexPositionComponent from "../components/hex-position-component";
import TilePreviewComponent from "../components/tile-preview-component";
import {RendererComponent} from "./render-system";
import TileLayoutComponent from "../components/tile-layout-component";

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
        const {scene} = this.registry.getSingletonComponent(RendererComponent);
        this.raycaster.setFromCamera(ndc, camera);

        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);
        const intersections = this.raycaster.intersectObjects(scene.children);

        const didHit = intersections.length > 0;
        const playerColor = mode.playMode() === PlayMode.Online ? mode.client().color() : game.colorToMove();

        if (!didHit) {
            throw new Error('unhandled, clicked on no object');
        }

        const tiles = this.registry.getEntitiesWithComponents(HexPositionComponent);
        const hitMesh = intersections[0].object as Mesh;
        const hitTileEntity = tiles.find(e => e.getComponent(MeshComponent).mesh.id === hitMesh.id);

        if (hitTileEntity == null) {
            if (!(hitMesh.geometry instanceof PlaneGeometry)) {
                throw new Error('expected all hits that are not tiles (including previews) to be the background plane');
            }

            if (game.moveNumber() === 1 && game.colorToMove() === HiveColor.Black) {
                if (userSelection.pieceType != null) {
                    const {hexGrid} = this.registry.getSingletonComponent(TileLayoutComponent);
                    const position = hexGrid.euclideanToHex(
                        new Vector2().copy(intersections[0].point)
                    );
                    this.placeTile(userSelection.pieceType, position);
                }
            } else {
                userSelection.deselectAll();
            }
            return true;
        }

        if (hitTileEntity.hasComponent(TilePreviewComponent)) {
            if (userSelection.position != null) {
                if (!this.moveTile(
                    userSelection.position,
                    hitTileEntity.getComponent(HexPositionComponent).position)) {
                    throw new Error('bad state; move should be legal if a preview tile was there');
                }
            } else if (userSelection.pieceType != null) {
                if (!this.placeTile(
                    userSelection.pieceType,
                    hitTileEntity.getComponent(HexPositionComponent).position)) {
                    throw new Error('bad state; placement should be legal if a preview tile was there');
                }
            }
        } else {
            // select the component we hit if it's ours
            const gameTile = game.tiles()[hitTileEntity.getComponent(TileComponent).id];

            if (userSelection.position?.equals(gameTile.position)) {
                userSelection.deselectAll();
            } else if (playerColor === gameTile.color) {
                userSelection.position = gameTile.position;
            }
        }

        return true;
    }

    private moveTile(from: HexVector, to: HexVector): boolean {
        const mode = this.registry.getSingletonComponent(PlayModeComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        const playerColor = mode.playMode() === PlayMode.Online ? mode.client().color() : game.colorToMove();
        if (playerColor !== game.colorToMove()) {
            throw new Error('cannot move tile when it is not our turn');
        }

        if (game.moveTile(from, to)) {
            if (mode.playMode() === PlayMode.Online) {
                mode.client().moveTile(from, to);
            }
            userSelection.deselectAll();

            return true;
        }

        return false;
    }

    private placeTile(pieceType: HivePieceType, position: HexVector): boolean {
        const mode = this.registry.getSingletonComponent(PlayModeComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        const playerColor = mode.playMode() === PlayMode.Online ? mode.client().color() : game.colorToMove();
        if (playerColor !== game.colorToMove()) {
            throw new Error('cannot place tile when it is not our turn');
        }

        if (game.placeTile(pieceType, position)) {
            if (mode.playMode() === PlayMode.Online) {
                mode.client().placeTile(pieceType, position);
            }
            userSelection.deselectAll();
            const id = game.idOfLastPlaced();
            if (id == null) {
                throw new Error('unreachable')
            }
            TileEntity.create(playerColor, pieceType, id).then(entity => {
                this.registry.addEntity(entity);
            });

            return true;
        }

        return false;
    }
}