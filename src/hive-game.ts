interface HexVector {
    q: number;
    r: number;
}

interface HiveGameObject {
    createHiveGame(): unknown;
    placeTile(game: unknown, pieceType: number, position: HexVector): unknown;

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
