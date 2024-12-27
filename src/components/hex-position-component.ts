import Component from "./component";
import {HexVector} from "../hex-grid";

export default class HexPositionComponent extends Component {
    position = new HexVector(0, 0);
    stackHeight = 0;
}