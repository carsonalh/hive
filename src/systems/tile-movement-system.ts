import System from "./system";
import {Mesh, PlaneGeometry, Raycaster, Vector2} from "three";
import MeshComponent from "../components/mesh-component";
import TileComponent from "../components/tile-component";
import {LEFT_BUTTON} from "../constants";
import HudComponent from "../components/hud-component";
import TileMovementComponent from "../components/tile-movement-component";
import HiveGameComponent from "../components/hive-game-component";
import CameraComponent from "../components/camera-component";
import {screenToNdc} from "../util";
import TileLayoutComponent from "../components/tile-layout-component";
import {createTile} from "../tiles";

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

        const tilePlacementComponent = this.registry.getSingletonComponent(TileMovementComponent);
        const hudComponent = this.registry.getSingletonComponent(HudComponent);
        const hiveGameComponent = this.registry.getSingletonComponent(HiveGameComponent);
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

            if (tilePlacementComponent.selectedTile != null) {
                if (game.moveTile(tilePlacementComponent.selectedTile, tile.position)) {
                    tile.position = tilePlacementComponent.selectedTile;
                    hiveGameComponent.playerColor = game.colorToMove();
                }
            } else {
                tilePlacementComponent.selectedTile = tile.position;
            }

            return true;
        } else if (backgroundIntersections.length > 0) {
            const hit = new Vector2().copy(backgroundIntersections[0].point.clone());

            const {hexGrid} = this.registry.getSingletonComponent(TileLayoutComponent);
            const hex = hexGrid.euclideanToHex(hit);

            if (hudComponent.selectedPieceType != null) {
                const {selectedPieceType} = hudComponent;
                const colorToMove = game.colorToMove();
                if (game.placeTile(hudComponent.selectedPieceType, hex)) {
                    const id = game.idOfLastPlaced();
                    if (id == null) {
                        throw new Error('id cannot be null');
                    }

                    (async () => {
                        const mesh = await createTile(colorToMove, selectedPieceType);
                        hudComponent.selectedPieceType = null;
                        tilePlacementComponent.selectedTile = null;
                        hiveGameComponent.playerColor = game.colorToMove();
                        this.registry.addEntity([new MeshComponent(mesh), new TileComponent(id)]);
                    })();
                }
            } else if (tilePlacementComponent.selectedTile != null) {
                if (game.moveTile(tilePlacementComponent.selectedTile, hex)) {
                    hudComponent.selectedPieceType = null;
                    tilePlacementComponent.selectedTile = null;
                    hiveGameComponent.playerColor = game.colorToMove();
                }
            }

            return true;
        }

        return false;
    }
}