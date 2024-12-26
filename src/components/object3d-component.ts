import Component from "./component";
import {Object3D} from "three";

export default class Object3DComponent extends Component {
    constructor(public object3d: Object3D) {
        super();
    }
}