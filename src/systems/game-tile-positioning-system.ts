import System from "./system";
import TileComponent from "../components/tile-component";
import HiveGameComponent from "../components/hive-game-component";
import HexPositionComponent from "../components/hex-position-component";

export default class GameTilePositioningSystem extends System {
    onUpdate() {
        const entities = this.registry.getEntitiesWithComponents(TileComponent, HexPositionComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);

        for (const entity of entities) {
            const {id} = entity.getComponent(TileComponent);
            const hexPosition = entity.getComponent(HexPositionComponent);

            const tiles = game.tiles();

            if (0 <= id && id < tiles.length) {
                hexPosition.position = tiles[id].position;
                hexPosition.stackHeight = tiles[id].stackHeight;
            }
        }
    }
}