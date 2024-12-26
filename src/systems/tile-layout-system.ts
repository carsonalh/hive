import System from "./system";
import TileLayoutComponent from "../components/tile-layout-component";
import TileComponent from "../components/tile-component";
import MeshComponent from "../components/mesh-component";
import {Vector3} from "three";
import {STACK_HEIGHT_DISTANCE} from "../constants";
import HiveGameComponent from "../components/hive-game-component";

export default class TileLayoutSystem extends System{
    onUpdate() {
        const {hexGrid} = this.registry.getSingletonComponent(TileLayoutComponent);
        const entities = this.registry.getEntitiesWithComponents(TileComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);

        const layout = new Vector3();

        for (const entity of entities) {
            const {id} = entity.getComponent(TileComponent);
            const {mesh} = entity.getComponent(MeshComponent);

            const tiles = game.tiles();

            if (0 <= id && id < tiles.length) {
                layout.copy({...hexGrid.hexToEuclidean(tiles[id].position), z: 0});
                layout.z += STACK_HEIGHT_DISTANCE * tiles[id].stackHeight;
                mesh.position.copy(layout);
            }
        }
    }
}