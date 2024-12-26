import Component from "./component";
import {HexVector} from "./hex-grid";

export default class TileComponent extends Component {
    constructor(public position: HexVector, public stackHeight: number) {
        super();
    }
}