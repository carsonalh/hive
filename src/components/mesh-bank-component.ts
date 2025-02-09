import Component from "./component";
import {Mesh} from "three";
import {HiveColor, HivePieceType} from "../hive-game";

export default class MeshBankComponent extends Component {
    public whiteQueenBee: Mesh = null!
    public whiteSoldierAnt: Mesh = null!
    public whiteSpider: Mesh = null!
    public whiteGrasshopper: Mesh = null!
    public whiteBeetle: Mesh = null!
    public whiteLadybug: Mesh = null!
    public whiteMosquito: Mesh = null!
    public blackQueenBee: Mesh = null!
    public blackSoldierAnt: Mesh = null!
    public blackSpider: Mesh = null!
    public blackGrasshopper: Mesh = null!
    public blackBeetle: Mesh = null!
    public blackLadybug: Mesh = null!
    public blackMosquito: Mesh = null!

    getMesh(color: HiveColor, pieceType: HivePieceType): Mesh {
        switch (color) {
            case HiveColor.Black:
                switch (pieceType) {
                    case HivePieceType.QueenBee:
                        return this.blackQueenBee;
                    case HivePieceType.SoldierAnt:
                        return this.blackSoldierAnt;
                    case HivePieceType.Spider:
                        return this.blackSpider;
                    case HivePieceType.Grasshopper:
                        return this.blackGrasshopper;
                    case HivePieceType.Beetle:
                        return this.blackBeetle;
                    case HivePieceType.Ladybug:
                        return this.blackLadybug;
                    case HivePieceType.Mosquito:
                        return this.blackMosquito;
                }
                break;
            case HiveColor.White:
                switch (pieceType) {
                    case HivePieceType.QueenBee:
                        return this.whiteQueenBee;
                    case HivePieceType.SoldierAnt:
                        return this.whiteSoldierAnt;
                    case HivePieceType.Spider:
                        return this.whiteSpider;
                    case HivePieceType.Grasshopper:
                        return this.whiteGrasshopper;
                    case HivePieceType.Beetle:
                        return this.whiteBeetle;
                    case HivePieceType.Ladybug:
                        return this.whiteLadybug;
                    case HivePieceType.Mosquito:
                        return this.whiteMosquito;
                }
                break;
        }

        throw new Error('Invalid enum value(s) given to retrieve mesh');
    }

}