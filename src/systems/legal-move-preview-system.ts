import System from "./system";
import {HexVector} from "../hex-grid";
import UserSelectionComponent from "../components/user-selection-component";
import TileComponent from "../components/tile-component";
import HiveGameComponent from "../components/hive-game-component";
import TilePreviewComponent from "../components/tile-preview-component";
import MeshComponent from "../components/mesh-component";
import {Material} from "three";
import HexPositionComponent from "../components/hex-position-component";
import SelectableComponent from "../components/selectable-component";
import {HiveColor, HivePieceType} from "../hive-game";
import {createTile} from "../tiles";
import PlayModeComponent, {PlayMode} from "../components/play-mode-component";

export default class LegalMovePreviewSystem extends System {
    private lastSelected: HexVector | HivePieceType | null = null;

    onUpdate() {
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);
        const currentlySelected = userSelection.position ?? userSelection.pieceType;

        if (currentlySelected !== this.lastSelected) {
            this.lastSelected = currentlySelected;
            this.registry.removeEntity(...this.registry.getEntitiesWithComponents(TilePreviewComponent));

            const {position, pieceType} = userSelection;

            if (position == null && pieceType == null) {
                return;
            }

            if (position != null) {
                const {game} = this.registry.getSingletonComponent(HiveGameComponent);
                const id = game.idOfTileAt(position);
                if (id == null) {
                    throw new Error('cannot have selected an id which does not exist')
                }

                const tile = game.tiles()[id];
                const moves = game.legalMoves(tile.position);
                const tileEntity = this.registry
                    .getEntitiesWithComponents(TileComponent)
                    .find(e => e.getComponent(TileComponent).id === id);
                if (tileEntity == null) {
                    throw new Error('selected a tile which does not exist');
                }
                const tileMesh = tileEntity.getComponent(MeshComponent).mesh;
                const material = (tileMesh.material as Material).clone();
                material.transparent = true;
                material.opacity = tile.color === HiveColor.Black ? 0.4 : 0.2;
                const protoMesh = tileMesh.clone();
                protoMesh.material = material;

                for (const position of moves) {
                    const hexPosition = new HexPositionComponent();
                    hexPosition.position = position;
                    let id: number | null;
                    if ((id = game.idOfTileAt(position)) == null) {
                        hexPosition.stackHeight = 0;
                    } else {
                        hexPosition.stackHeight = game.tiles()[id].stackHeight + 1;
                    }
                    this.registry.addEntityFromComponents([
                        new MeshComponent(protoMesh.clone()),
                        hexPosition,
                        new TilePreviewComponent(),
                        new SelectableComponent(),
                    ]);
                }

                return;
            }

            if (pieceType != null) {
                const {game} = this.registry.getSingletonComponent(HiveGameComponent);
                const mode = this.registry.getSingletonComponent(PlayModeComponent);
                const playerColor = mode.playMode() === PlayMode.Online ? mode.client().color() : game.colorToMove();
                // currently no way of getting legal placements, must fix
                for (const position of game.legalPlacements()) {
                    // TODO we really need a mesh bank, sending network requests in a loop now in a
                    //  frame update... ._.
                    (async () => {
                        const mesh = await createTile(playerColor, pieceType);
                        const material = mesh.material as Material;
                        material.transparent = true;
                        material.opacity = playerColor === HiveColor.Black ? 0.4 : 0.2;
                        const protoMesh = mesh.clone();
                        protoMesh.material = material;
                        const hexPosition = new HexPositionComponent();
                        hexPosition.position = position;
                        hexPosition.stackHeight = 0;
                        this.registry.addEntityFromComponents([
                            new MeshComponent(protoMesh.clone()),
                            hexPosition,
                            new TilePreviewComponent(),
                            new SelectableComponent(),
                        ]);
                    })();
                }

                return;
            }
        }
    }
}