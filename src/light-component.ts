import {Light} from "three";
import Object3DComponent from "./object3d-component";

export default class LightComponent extends Object3DComponent {
    constructor(private _light: Light) {
        super(_light);
    }

    public get light() {
        return this._light;
    }
}