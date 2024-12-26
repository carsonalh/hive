import Component from "./component";
import {Camera} from "three";

export default class CameraComponent extends Component {
    constructor(public camera: Camera, public main = true) {
        super();
    }
}