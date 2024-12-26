import System from "./system";
import CameraComponent from "./camera-component";
import {Mesh, Plane, Raycaster, Vector2, Vector3} from "three";
import {eventNdcCoords} from "./util";
import MeshComponent from "./mesh-component";
import {createTile} from "./tiles";
import {HiveColor, HivePieceType} from "./hive-game";
import TileComponent from "./tile-component";
import {HexGrid, HexVector} from "./hex-grid";
import {LEFT_BUTTON} from "./constants";
import MoveManager, {LocalMoveManager} from "./move-manager";

export default class TilePlacementSystem extends System {
    private readonly plane = new Plane(new Vector3(0, 0, 1));
    private raycaster = new Raycaster();
    private moveManager: MoveManager = new LocalMoveManager();
    private selected: HexVector | null = null;

    setMoveManager(moveManager: MoveManager): void {
        this.moveManager = moveManager;
    }

    onMouseDown(e: MouseEvent) {
        // if (e.button !== LEFT_BUTTON) {
        //     return false;
        // }
        return false;

        // const tiles = this.registry.getEntitiesWithComponents(TileComponent);
        // const meshes = tiles.map(t => t.getComponent(MeshComponent).mesh);
        // const intersections = this.raycaster.intersectObjects(meshes)
        //
        // if (this.selected == null) {
        //     if (intersections.length > 0) {
        //         const tileComponent = tiles[meshes.indexOf(intersections[0].object as Mesh)].getComponent(TileComponent);
        //         this.selected = tileComponent.position;
        //     }
        //
        //     return;
        // }
        //
        // if (intersections.length > 0) {
        //     const tileComponent = tiles[meshes.indexOf(intersections[0].object as Mesh)].getComponent(TileComponent);
        //     if (this.moveManager.moveTile(this.selected, tileComponent.position)) {
        //         this.selected = null;
        //         return
        //     }
        // }
        //
        // const camera = this.registry.getComponents(CameraComponent).find(c => c.main)!.camera;
        // const hitNdc = eventNdcCoords(e);
        //
        // const hit3d = new Vector3();
        //
        // this.raycaster.setFromCamera(hitNdc, camera);
        // this.raycaster.ray.intersectPlane(this.plane, hit3d);
        //
        // const grid = new HexGrid();
        // const hex = grid.euclideanToHex(new Vector2().copy(hit3d));
        // const rounded = grid.hexToEuclidean(hex);
        //
        // (async () => {
        //     const mesh = await createTile(HiveColor.Black, HivePieceType.QueenBee);
        //     mesh.visible = true;
        //     mesh.position.copy(new Vector3().copy({...rounded, z: 0}));
        //     this.registry.addEntity([new MeshComponent(mesh), new TileComponent(new HexVector(0, 0), 0)]);
        // })();
    }
}