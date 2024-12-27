import Component from "./component";
import {Vector2} from "three";

export default class MouseStateComponent extends Component {
    position = new Vector2()
    leftButtonDown = false
    middleButtonDown = false
    rightButtonDown = false
}