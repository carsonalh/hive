import { HexVector } from "./hex-grid";

export enum HivePiece {
    QUEEN_BEE,
    SOLDIER_ANT,
    BEETLE,
    SPIDER,
    GRASSHOPPER,
    LADYBUG,
    MOSQUITO,
}

export enum HiveColour {
    WHITE,
    BLACK,
}

export type HiveGameOptions = {
    ladybugExpansion: boolean,
    mosquitoExpansion: boolean,
};

export type HiveMove = {
    type: 'place',
    piece: HivePiece,
    position: HexVector,
} | {
    type: 'move',
    from: HexVector,
    to: HexVector,
};

export type HiveBoardPiece = {
    position: HexVector,
    colour: HiveColour,
    piece: HivePiece,
};

export class HiveGame {
    private readonly whiteReserve: Record<HivePiece, number>;
    private readonly blackReserve: Record<HivePiece, number>;
    private readonly board: HiveBoardPiece[];
    private toMove: HiveColour;
    private currentMove: number;

    constructor(options?: HiveGameOptions) {
        this.whiteReserve = {
            [HivePiece.QUEEN_BEE]: 1,
            [HivePiece.SOLDIER_ANT]: 3,
            [HivePiece.BEETLE]: 2,
            [HivePiece.SPIDER]: 2,
            [HivePiece.GRASSHOPPER]: 3,
            [HivePiece.LADYBUG]: options?.ladybugExpansion ? 1 : 0,
            [HivePiece.MOSQUITO]: options?.mosquitoExpansion ? 1 : 0,
        };

        this.blackReserve = {
            [HivePiece.QUEEN_BEE]: 1,
            [HivePiece.SOLDIER_ANT]: 3,
            [HivePiece.BEETLE]: 2,
            [HivePiece.SPIDER]: 2,
            [HivePiece.GRASSHOPPER]: 3,
            [HivePiece.LADYBUG]: options?.ladybugExpansion ? 1 : 0,
            [HivePiece.MOSQUITO]: options?.mosquitoExpansion ? 1 : 0,
        };

        this.board = [];
        this.toMove = HiveColour.BLACK;
        this.currentMove = 1;
    }

    public getColourToMove(): HiveColour {
        return this.toMove;
    }

    /**
     * Gets what number move it is.  Starting with move 1 etc.
     */
    public getMoveNumber(): number {
        return this.currentMove;
    }

    public getHive(): HiveBoardPiece[] {
        return this.board.map(p => ({ ...p }));
    }

    public executeMove(move: Readonly<HiveMove>): boolean {
        const queenPlaced = this.board.find(p => p.colour === this.toMove && p.piece === HivePiece.QUEEN_BEE) != null;

        if (this.currentMove === 4) {
            if (!queenPlaced && (move.type !== 'place' || move.piece !== HivePiece.QUEEN_BEE)) {
                // queen must be placed by move 4
                return false;
            }
        }

        switch (move.type) {
        case 'place':
            {
                const reserve = this.toMove === HiveColour.BLACK ? this.blackReserve : this.whiteReserve;

                if (reserve[move.piece] <= 0) {
                    // cannot place a piece we don't have
                    return false;
                }

                // make sure its next to one of its own and not one of the others
                const nextToOwn = move.position.adjacentVectors().some(adj => this.board.find(p => p.colour === this.toMove && p.position.equals(adj)));
                const nextToOpponent = move.position.adjacentVectors().some(adj => this.board.find(p => p.colour !== this.toMove && p.position.equals(adj)));

                if (this.currentMove !== 1 && (!nextToOwn || nextToOpponent)) {
                    // cannot place a piece next to an opponent's
                    return false;
                }

                this.board.push({ piece: move.piece, position: move.position, colour: this.toMove });
                reserve[move.piece]--;
            }
            break;
        case 'move':
            {
                if (!queenPlaced) {
                    // cannot move until the queen is placed
                    return false;
                }

                const pieceToMove = this.board.find(p => p.position.equals(move.from));

                if (pieceToMove == null) {
                    // cannot move an empty square
                    return false;
                }

                if (pieceToMove.colour !== this.toMove) {
                    // cannot move an opponents piece
                    return false;
                }

                if (pieceToMove.piece === HivePiece.SOLDIER_ANT) {
                    const occupied = this.board.find(p => p.position.equals(move.to)) != null;

                    if (occupied) {
                        // cannot move a piece to an occupied square (including itself)
                        return false;
                    }

                    const neighbours = move.to.adjacentVectors().map(adj => this.board.find(p => p.position.equals(adj))).filter(adj => adj != null);

                    if (neighbours.length === 0) {
                        // the new tile to which to move must be connected to the hive
                        return false;
                    }

                    // TODO freedom to move
                    pieceToMove.position = move.to;
                } else {
                    // TODO implement the other pieces
                    return false
                }

            }
            break;
        }

        if (this.toMove === HiveColour.WHITE) {
            this.currentMove++;
        }

        this.toMove = this.toMove === HiveColour.BLACK ? HiveColour.WHITE : HiveColour.BLACK;

        return true;
    }
}
