import {HexVector} from "./hex-grid";

interface IHexVector {
    q: number;
    r: number;
}

interface ITile {
    color: number;
    stackHeight: number;
    position: IHexVector;
    pieceType: number;
}

interface HiveGameObject {
    createHiveGame(): unknown;

    placeTile(game: unknown, pieceType: number, position: IHexVector): [unknown, boolean];

    moveTile(game: unknown, from: IHexVector, to: IHexVector): [unknown, boolean];

    legalMoves(game: unknown, position: IHexVector): IHexVector[];

    tiles(game: unknown): ITile[];

    idOfLastPlaced(game: unknown): number;

    idOfTileAt(game: unknown, position: IHexVector): number;

    colorToMove(game: unknown): number;

    getTilesRemaining(game: unknown, color: number, pieceType: number): number;

    moveNumber(game: unknown): number;

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

export enum HiveColor {
    Black,
    White,
}

export enum HivePieceType {
    QueenBee,
    SoldierAnt,
    Spider,
    Grasshopper,
    Beetle,
    Ladybug,
    Mosquito,
}

export interface HiveTile {
    color: HiveColor;
    position: HexVector;
    stackHeight: number;
    pieceType: HivePieceType;
}

export class HiveGame {
    private game: unknown;
    private readonly pieceTypeMap: Record<HivePieceType, number>;
    private readonly colorMap: Record<HiveColor, number>;

    public static internalPieceTypeMap(): Record<HivePieceType, number> {
        return {
            [HivePieceType.QueenBee]: hive.PIECE_TYPE_QUEEN_BEE,
            [HivePieceType.SoldierAnt]: hive.PIECE_TYPE_SOLDIER_ANT,
            [HivePieceType.Spider]: hive.PIECE_TYPE_SPIDER,
            [HivePieceType.Grasshopper]: hive.PIECE_TYPE_GRASSHOPPER,
            [HivePieceType.Beetle]: hive.PIECE_TYPE_BEETLE,
            [HivePieceType.Ladybug]: hive.PIECE_TYPE_LADYBUG,
            [HivePieceType.Mosquito]: hive.PIECE_TYPE_MOSQUITO,
        };
    }

    public constructor() {
        this.game = hive.createHiveGame();
        this.pieceTypeMap = {
            [HivePieceType.QueenBee]: hive.PIECE_TYPE_QUEEN_BEE,
            [HivePieceType.SoldierAnt]: hive.PIECE_TYPE_SOLDIER_ANT,
            [HivePieceType.Spider]: hive.PIECE_TYPE_SPIDER,
            [HivePieceType.Grasshopper]: hive.PIECE_TYPE_GRASSHOPPER,
            [HivePieceType.Beetle]: hive.PIECE_TYPE_BEETLE,
            [HivePieceType.Ladybug]: hive.PIECE_TYPE_LADYBUG,
            [HivePieceType.Mosquito]: hive.PIECE_TYPE_MOSQUITO,
        };

        this.colorMap = {
            [HiveColor.Black]: hive.COLOR_BLACK,
            [HiveColor.White]: hive.COLOR_WHITE,
        };
    }

    public placeTile(pieceType: HivePieceType, where: HexVector): boolean {
        let game: unknown, success: boolean;
        [game, success] = hive.placeTile(this.game, this.pieceTypeMap[pieceType], where);

        this.game = game;

        return success;
    }

    public moveTile(from: HexVector, to: HexVector): boolean {
        let game: unknown, success: boolean;
        [game, success] = hive.moveTile(this.game, from, to);

        this.game = game;

        return success;
    }

    public legalMoves(tile: HexVector): HexVector[] {
        const moves = hive.legalMoves(this.game, tile);
        return moves.map(m => new HexVector(m.q, m.r));
    }

    public tiles(): HiveTile[] {
        const rawTiles = hive.tiles(this.game)
        return rawTiles.map(t => ({
            color: Number(Object.entries(this.colorMap).find(([_, v]) => v === t.color)![0]),
            pieceType: Number(Object.entries(this.pieceTypeMap).find(([_, v]) => v === t.pieceType)![0]),
            stackHeight: t.stackHeight,
            position: new HexVector(t.position.q, t.position.r),
        }));
    }

    public idOfLastPlaced(): number | null {
        const id = hive.idOfLastPlaced(this.game);

        if (id < 0) {
            return null;
        }

        return id;
    }

    public idOfTileAt(position: HexVector): number | null {
        const id = hive.idOfTileAt(this.game, position);

        if (id < 0) {
            return null;
        }

        return id;
    }

    public colorToMove(): HiveColor {
        const color = hive.colorToMove(this.game);
        return Number(Object.entries(this.colorMap).find(([_, v]) => v === color)![0]);
    }

    public getTilesRemaining(color: HiveColor, pieceType: HivePieceType) {
        return hive.getTilesRemaining(
            this.game,
            this.colorMap[color],
            this.pieceTypeMap[pieceType]
        );
    }

    public moveNumber(): number {
        return hive.moveNumber(this.game);
    }

    /**
     * `console.dir`s the game's internal state.
     */
    public debug(): void {
        console.dir(this.game);
    }
}
