import {Mesh} from "three";
import Object3DComponent from "./object3d-component";

export default class MeshComponent extends Object3DComponent {
    constructor(private _mesh: Mesh) {
        super(_mesh);
    }

    get mesh() {
        return this._mesh;
    }
}