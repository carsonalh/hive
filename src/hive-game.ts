import {HexMatrix, HexVector} from "./hex-grid";

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

                    const queue: HexVector[] = [];
                    const seen = new Set<string>();

                    queue.push(move.from);

                    let node: HexVector | null = null;
                    while ((node = queue.shift() ?? null) != null) {
                        if (seen.has(node.toString())) {
                            continue;
                        }

                        const neighbours = this.getAdjacentMoves(node);
                        queue.push(...neighbours);

                        seen.add(node.toString());
                    }

                    if (!seen.has(move.to.toString())) {
                        // either the piece was not connected to the hive (an error may have already
                        // been thrown), or freedom to move was not respected
                        return false;
                    }

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

    /**
     * Gets adjacent tiles of the grid respecting freedom to move and the One Hive rule.
     */
    private getAdjacentMoves(fromTile: HexVector): HexVector[] {
        const getAdjacentTilesForSearch = (v: HexVector) => this.board
            .filter(p => v.adjacentVectors().find(adj => p.position.equals(adj)) != null && !p.position.equals(fromTile))
            .map(p => p.position);

        const initiallyAdjacentTiles = getAdjacentTilesForSearch(fromTile);

        if (initiallyAdjacentTiles.length === 0) {
            // this is an invalid state
            throw new Error('cannot have a tile next to no others');
        }

        // do a flood fill on each of the adjacent tiles to find out if this
        // tile is a bridge in the graph (component) of adjacent tiles
        const startingTile = initiallyAdjacentTiles[0];
        const queue: HexVector[] = [];
        const seen = new Set<string>();

        queue.push(...getAdjacentTilesForSearch(startingTile));

        while (queue.length > 0) {
            const next = queue.shift() as HexVector;

            if (seen.has(next.toString())) {
                continue;
            }

            queue.push(...getAdjacentTilesForSearch(next));
            seen.add(next.toString());
        }

        const expectedNumTilesForNoPin = this.board.find(p => p.position.equals(fromTile)) == null
            ? this.board.length
            : this.board.length - 1;

        if (seen.size !== expectedNumTilesForNoPin) {
            // we could not get to every other position, we know that we started with a bridge, and
            // so the One Hive rule would be violated
            return [];
        }

        // we know that the current tile and the new tile must share a neighbour
        const potentialNewTiles = fromTile.adjacentVectors()
            .filter(v => this.board.find(p => p.position.equals(v)) == null);

        const fromNeighbours = this.board.filter(p => fromTile.adjacentVectors().find(adj => adj.equals(p.position)));
        const potentialNewTilesNeighbours = potentialNewTiles.map(newTile => this.board.filter(p => newTile.adjacentVectors().find(adj => adj.equals(p.position))));

        // all the neighbouring tiles who share a neigbour with the original tile
        const withSharedNeighbours = potentialNewTiles.filter((_, i) => fromNeighbours.filter(n => potentialNewTilesNeighbours[i].includes(n)).length !== 0);

        // now we check freedom to move from fromTile to each tile in withSharedNeighbours

        // a rotation matrix in hex space to rotate by 60 degrees, notice that this matrix to the
        // sixth power is the identity
        const rotate60 = new HexMatrix(
            1, 1,
            -1, 0
        );

        const rotate300 = new HexMatrix(
            0, -1,
            1, 1
        );

        const respectingFreedomToMove = withSharedNeighbours.filter(v => {
            const differential = v.subtract(fromTile);
            const clockwise = rotate60.transform(differential);
            const antiClockwise = rotate300.transform(differential);
            const toCheck = [clockwise.add(fromTile), antiClockwise.add(fromTile)];
            return !toCheck.every(u => this.board.find(p => p.position.equals(u)) != null);
        });

        return respectingFreedomToMove;
    }
}
