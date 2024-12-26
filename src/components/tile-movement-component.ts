import Component from "./component";
import {HexVector} from "../hex-grid";

export default class TileMovementComponent extends Component {
    selectedTile: HexVector | null = null;
}