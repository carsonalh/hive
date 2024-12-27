import System from "./system";
import TileLayoutComponent from "../components/tile-layout-component";
import {Vector3} from "three";
import MeshComponent from "../components/mesh-component";
import {STACK_HEIGHT_DISTANCE} from "../constants";
import HexPositionComponent from "../components/hex-position-component";

export default class HexLayoutSystem extends System {
    onUpdate() {
        const {hexGrid} = this.registry.getSingletonComponent(TileLayoutComponent);
        const entities = this.registry.getEntitiesWithComponents(HexPositionComponent, MeshComponent);

        const layout = new Vector3();

        for (const entity of entities) {
            const {position, stackHeight} = entity.getComponent(HexPositionComponent);
            const {mesh} = entity.getComponent(MeshComponent);

            layout.copy({...hexGrid.hexToEuclidean(position), z: 0});
            layout.z += STACK_HEIGHT_DISTANCE * stackHeight;
            mesh.position.copy(layout);
        }
    }
}