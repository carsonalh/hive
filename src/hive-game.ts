import {HexVector} from "./hex-grid";

interface IHexVector {
    q: number;
    r: number;
}

interface HiveGameObject {
    createHiveGame(): unknown;
    placeTile(game: unknown, pieceType: number, position: IHexVector): [unknown, boolean];
    moveTile(game: unknown, from: IHexVector, to: IHexVector): [unknown, boolean];
    legalMoves(game: unknown, position: IHexVector): IHexVector[];

    COLOR_BLACK: number;
    COLOR_WHITE: number;

    PIECE_TYPE_QUEEN_BEE: number;
    PIECE_TYPE_SOLDIER_ANT: number;
    PIECE_TYPE_SPIDER: number;
    PIECE_TYPE_GRASSHOPPER: number;
    PIECE_TYPE_BEETLE: number;
    PIECE_TYPE_LADYBUG: number;
    PIECE_TYPE_MOSQUITO: number;
}

declare const hive: HiveGameObject;

export enum HivePieceType {
    QueenBee,
    SoldierAnt,
    Grasshopper,
    Beetle,
    Ladybug,
    Mosquito,
}

export class HiveGame {
    private game: unknown;
    private readonly pieceTypeMap: Record<HivePieceType, number>;

    public constructor() {
        this.game = hive.createHiveGame();
        this.pieceTypeMap = {
            [HivePieceType.QueenBee]: hive.PIECE_TYPE_QUEEN_BEE,
            [HivePieceType.SoldierAnt]: hive.PIECE_TYPE_SOLDIER_ANT,
            [HivePieceType.Grasshopper]: hive.PIECE_TYPE_GRASSHOPPER,
            [HivePieceType.Beetle]: hive.PIECE_TYPE_BEETLE,
            [HivePieceType.Ladybug]: hive.PIECE_TYPE_LADYBUG,
            [HivePieceType.Mosquito]: hive.PIECE_TYPE_MOSQUITO,
        };
    }

    public placeTile(pieceType: HivePieceType, where: HexVector) {
        let game: unknown, success: boolean;
        [game, success] = hive.placeTile(this.game, this.pieceTypeMap[pieceType], where);

        if (!success) {
            throw new Error('internal error trying to place tile')
        }

        this.game = game;
    }

    public moveTile(from: HexVector, to: HexVector) {
        let game: unknown, success: boolean;
        [game, success] = hive.moveTile(this.game, from, to);

        if (!success) {
            throw new Error('internal error trying to move tile')
        }

        this.game = game;
    }

    public legalMoves(tile: HexVector): HexVector[] {
        const moves = hive.legalMoves(this.game, tile);
        return moves.map(m => new HexVector(m.q, m.r));
    }

    /**
     * `console.dir`s the game's internal state.
     */
    public debug(): void {
        console.dir(this.game);
    }
}
