import {HexVector, HexVectorLike} from "./hex-grid";

interface ITile {
    color: number;
    stackHeight: number;
    position: HexVectorLike;
    pieceType: number;
}

export interface HiveState {
    whiteReserve: {
        QUEEN_BEE: number;
        SOLDIER_ANT: number;
        SPIDER: number;
        GRASSHOPPER: number;
        BEETLE: number;
        LADYBUG: number;
        MOSQUITO: number;
    };
    blackReserve: {
        QUEEN_BEE: number;
        SOLDIER_ANT: number;
        SPIDER: number;
        GRASSHOPPER: number;
        BEETLE: number;
        LADYBUG: number;
        MOSQUITO: number;
    };
    tiles: {
        color: HiveColor;
        position: HexVectorLike;
        stackHeight: number;
        pieceType: HivePieceType;
    }[];
    colorToMove: HiveColor;
    move: number;
}

export interface HiveGameObject {
    createHiveGame(): HiveState;
    placeTile(game: HiveState, pieceType: number, position: HexVectorLike): [HiveState, boolean];
    moveTile(game: HiveState, from: HexVectorLike, to: HexVectorLike): [HiveState, boolean];
    tiles(game: HiveState): ITile[];
    idOfLastPlaced(game: HiveState): number;
    idOfTileAt(game: HiveState, position: HexVectorLike): number;
    colorToMove(game: HiveState): HiveColor;
    getTilesRemaining(game: HiveState, color: number, pieceType: number): number;
    moveNumber(game: HiveState): number;
    legalMoves(game: HiveState, position: HexVectorLike): HexVectorLike[];
}

export enum HiveColor {
    Black = 0,
    White = 1,
}

export enum HivePieceType {
    QueenBee = 0,
    SoldierAnt = 1,
    Grasshopper = 2,
    Spider = 3,
    Beetle = 4,
    Ladybug = 5,
    Mosquito = 6,
}

export interface HiveTile {
    color: HiveColor;
    position: HexVector;
    stackHeight: number;
    pieceType: HivePieceType;
}

export class HiveGame {
    private game: HiveState;

    public constructor() {
        this.game = hive.createHiveGame();
    }

    public setState(state: HiveState) {
        this.game = state;
    }

    public getState(): HiveState {
        return this.game;
    }

    public placeTile(pieceType: HivePieceType, where: HexVectorLike): boolean {
        const [game, success] = hive.placeTile(this.game, pieceType, where);
        this.game = game;
        return success;
    }

    public moveTile(from: HexVectorLike, to: HexVectorLike): boolean {
        const [game, success] = hive.moveTile(this.game, from, to);
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
            color: t.color,
            pieceType: t.pieceType,
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
        return hive.colorToMove(this.game);
    }

    public getTilesRemaining(color: HiveColor, pieceType: HivePieceType) {
        return hive.getTilesRemaining(
            this.game,
            color,
            pieceType
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
