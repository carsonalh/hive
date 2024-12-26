import System from "./system";
import {Mesh, PlaneGeometry, Raycaster, Vector2} from "three";
import MeshComponent from "../components/mesh-component";
import TileComponent from "../components/tile-component";
import {LEFT_BUTTON} from "../constants";
import HudComponent from "../components/hud-component";
import HiveGameComponent from "../components/hive-game-component";
import CameraComponent from "../components/camera-component";
import {screenToNdc} from "../util";
import TileLayoutComponent from "../components/tile-layout-component";
import {createTile} from "../tiles";
import UserSelectionComponent from "../components/user-selection-component";

/**
 * Responsible for making moves in the game.
 */
export default class TileMovementSystem extends System {
    private raycaster = new Raycaster();

    onMouseDown(e: MouseEvent) {
        if (e.button !== LEFT_BUTTON) {
            return false;
        }

        const ndc = new Vector2();
        screenToNdc(new Vector2(e.clientX, e.clientY), ndc);
        const {camera} = this.registry.getSingletonComponent(CameraComponent);
        this.raycaster.setFromCamera(ndc, camera);

        const hiveGameComponent = this.registry.getSingletonComponent(HiveGameComponent);
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);
        const {game} = hiveGameComponent;

        const tiles = this.registry.getEntitiesWithComponents(TileComponent);
        const meshes = tiles.map(t => t.getComponent(MeshComponent).mesh);
        const tileIntersections = this.raycaster.intersectObjects(meshes)

        const backgroundPlane = this.registry
            .getComponents(MeshComponent)
            .find(mc => mc.mesh.geometry instanceof PlaneGeometry)!
            .mesh;

        const backgroundIntersections = this.raycaster.intersectObject(backgroundPlane);

        if (tileIntersections.length > 0) {
            const tileComponent = tiles[meshes.indexOf(tileIntersections[0].object as Mesh)]
                .getComponent(TileComponent);

            const tile = game.tiles()[tileComponent.id];

            if (userSelection.position != null) {
                if (game.moveTile(userSelection.position, tile.position)) {
                    tile.position = userSelection.position;
                    hiveGameComponent.playerColor = game.colorToMove();
                }
            } else {
                userSelection.position = tile.position;
            }

            return true;
        } else if (backgroundIntersections.length > 0) {
            const hit = new Vector2().copy(backgroundIntersections[0].point.clone());

            const {hexGrid} = this.registry.getSingletonComponent(TileLayoutComponent);
            const hex = hexGrid.euclideanToHex(hit);

            if (userSelection.pieceType != null) {
                const { pieceType} = userSelection;
                const colorToMove = game.colorToMove();
                if (game.placeTile(pieceType, hex)) {
                    const id = game.idOfLastPlaced();
                    if (id == null) {
                        throw new Error('id cannot be null');
                    }

                    (async () => {
                        const mesh = await createTile(colorToMove, pieceType);
                        userSelection.pieceType = null;
                        hiveGameComponent.playerColor = game.colorToMove();
                        this.registry.addEntity([new MeshComponent(mesh), new TileComponent(id)]);
                    })();
                }
            } else if (userSelection.position != null) {
                if (game.moveTile(userSelection.position, hex)) {
                    userSelection.position = null;
                    hiveGameComponent.playerColor = game.colorToMove();
                }
            }

            return true;
        }

        return false;
    }
}