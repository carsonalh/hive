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
import {HiveColor} from "../hive-game";

export default class LegalMovePreviewSystem extends System {
    private lastSelected: HexVector | null = null;

    onUpdate() {
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        const currentlySelected = userSelection.position != null;
        const previouslySelected = this.lastSelected != null;

        let updated = false;

        if (currentlySelected && previouslySelected) {
            if (!userSelection.position!.equals(this.lastSelected!)) {
                updated = true;
            }
        } else if (currentlySelected !== previouslySelected) {
            updated = true;
        }

        this.lastSelected = userSelection.position;

        if (updated) {
            this.registry.removeEntity(...this.registry.getEntitiesWithComponents(TilePreviewComponent));

            const {position} = userSelection;
            if (position == null) {
                return;
            }

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

            console.log(`just placed ${moves.length} meshes`)
            console.dir(moves);
        }
    }
}