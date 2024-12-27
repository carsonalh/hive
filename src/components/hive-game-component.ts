import Component from "./component";
import {HiveGame} from "../hive-game";

export default class HiveGameComponent extends Component {
    constructor(public game: HiveGame) {
        super();
    }
}