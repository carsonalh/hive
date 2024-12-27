import System from "./system";
import SelectableComponent, {SelectableState} from "../components/selectable-component";
import MeshComponent from "../components/mesh-component";
import {Mesh, Raycaster, Vector2} from "three";
import CameraComponent from "../components/camera-component";
import {screenToNdc} from "../util";
import UserSelectionComponent from "../components/user-selection-component";
import HiveGameComponent from "../components/hive-game-component";
import TileComponent from "../components/tile-component";
import MouseStateComponent from "../components/mouse-state-component";

export default class SelectionSystem extends System {
    private raycaster = new Raycaster();

    onUpdate() {
        this.updateSelected();
        this.updateHovered();
    }

    private updateSelected() {
        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);
        const {game} = this.registry.getSingletonComponent(HiveGameComponent);
        if (userSelection.position != null) {
            const id = game.idOfTileAt(userSelection.position);
            const selectable = this.registry
                .getEntitiesWithComponents(TileComponent, SelectableComponent)
                .find(e => e.getComponent(TileComponent).id === id)!
                .getComponent(SelectableComponent);

            selectable.state = SelectableState.Selected;
        } else {
            for (const selectable of this.registry.getComponents(SelectableComponent)) {
                if (selectable.state === SelectableState.Selected) {
                    selectable.state = SelectableState.Unselected;
                }
            }
        }
    }

    private updateHovered() {
        const selectableEntities = this.registry
            .getEntitiesWithComponents(SelectableComponent, MeshComponent)

        for (const e of selectableEntities) {
            const selectable = e.getComponent(SelectableComponent);
            if (selectable.state === SelectableState.Hovered) {
                selectable.state = SelectableState.Unselected;
            }
        }

        const selectableMeshes = selectableEntities.map(e => e.getComponent(MeshComponent).mesh);

        const {camera} = this.registry.getSingletonComponent(CameraComponent);
        const ndc = new Vector2();
        const mouseState = this.registry.getSingletonComponent(MouseStateComponent);
        screenToNdc(mouseState.position, ndc);
        this.raycaster.setFromCamera(ndc, camera);

        const intersections = this.raycaster.intersectObjects(selectableMeshes);
        if (intersections.length === 0) {
            return;
        }

        const mesh = intersections[0].object as Mesh;
        const selectable = selectableEntities[selectableMeshes.indexOf(mesh)].getComponent(SelectableComponent);
        selectable.state = SelectableState.Hovered;
    }
}