import Component from "./component";
import {HiveColor, HiveGame} from "../hive-game";

export default class HiveGameComponent extends Component {
    playerColor = HiveColor.Black

    constructor(public game: HiveGame) {
        super();
    }
}