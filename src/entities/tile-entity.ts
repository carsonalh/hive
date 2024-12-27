import {Entity} from "./entity";
import MeshComponent from "../components/mesh-component";
import {HiveColor, HivePieceType} from "../hive-game";
import SelectableComponent from "../components/selectable-component";
import TileComponent from "../components/tile-component";
import {createTile} from "../tiles";
import Component from "../components/component";

export default class TileEntity extends Entity {
    static async create(color: HiveColor, pieceType: HivePieceType, id: number, selectable = true): Promise<TileEntity> {
        const mesh = await createTile(color, pieceType);

        const cs: Component[] = [new MeshComponent(mesh), new TileComponent(id)];
        if (selectable) {
            cs.push(new SelectableComponent());
        }

        return new TileEntity(...cs);
    }
}