import Component from "./component";
import {HivePieceType} from "../hive-game";
import {HexVector} from "../hex-grid";

export default class UserSelectionComponent extends Component {
    private _pieceType: HivePieceType | null = null;
    private _position: HexVector | null = null;

    get pieceType(): HivePieceType | null {
        return this._pieceType;
    }

    set pieceType(pieceType: HivePieceType | null) {
        if (pieceType != null) {
            this._position = null;
        }

        this._pieceType = pieceType;
    }

    get position(): HexVector | null {
        return this._position;
    }

    set position(position: HexVector | null) {
        if (position != null) {
            this._pieceType = null;
        }

        this._position = position;
    }

    deselectAll() {
        this._position = this._pieceType = null;
    }
}