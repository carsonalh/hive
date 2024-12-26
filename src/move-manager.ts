import {HiveGame, HivePieceType} from "./hive-game";
import {HexVector} from "./hex-grid";
import OnlineClient, {Move} from "./online-client";

export default abstract class MoveManager {
    abstract placeTile(pieceType: HivePieceType, position: HexVector): boolean;
    abstract moveTile(from: HexVector, to: HexVector): boolean;

    abstract canMove(): boolean;
    destroy(): void {}
}

export class LocalMoveManager extends MoveManager {
    private readonly game: HiveGame;

    constructor() {
        super();
        this.game = new HiveGame();
    }

    placeTile(pieceType: HivePieceType, position: HexVector): boolean {
        return this.game.placeTile(pieceType, position);
    }

    moveTile(from: HexVector, to: HexVector): boolean {
        return this.game.moveTile(from, to);
    }

    canMove(): boolean {
        return true;
    }
}

export class OnlineMoveManager extends MoveManager {
    private isOurTurn = false;
    private game = new HiveGame();

    constructor(private readonly client: OnlineClient) {
        super();
        client.addReceiveMoveHandler(this.onReceiveMove.bind(this));
    }

    private onReceiveMove(move: Move) {
        if (move.moveType === 'MOVE') {
            if (!this.game.moveTile(move.from, move.to)) {
                throw new Error('Fatal, received an invalid movement move from the server');
            }
        } else {
            if (!this.game.placeTile(move.pieceType, move.position)) {
                throw new Error('Fatal, received an invalid placement move from the server');
            }
        }

        this.isOurTurn = this.client.color() === this.game.colorToMove();
    }

    canMove(): boolean {
        return this.isOurTurn;
    }

    moveTile(from: HexVector, to: HexVector): boolean {
        if (!this.game.moveTile(from, to)) {
            return false;
        }

        this.isOurTurn = this.client.color() === this.game.colorToMove();
        this.client.moveTile(from, to);
        return true;
    }

    placeTile(pieceType: HivePieceType, position: HexVector): boolean {
        if (!this.game.placeTile(pieceType, position)) {
            return false;
        }

        this.isOurTurn = this.client.color() === this.game.colorToMove();
        this.client.placeTile(pieceType, position);
        return true;
    }

    destroy() {
        super.destroy();
        this.client.close();
    }
}