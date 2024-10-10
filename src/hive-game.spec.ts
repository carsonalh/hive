import { HexVector } from "./hex-grid";
import { HiveBoardPiece, HiveColour, HiveGame, HivePiece } from "./hive-game";

describe('preliminary tests', () => {
    it('has equality on the HexVector class', () => {
        expect(new HexVector(1, -3)).toEqual(new HexVector(1, -3));
        expect(new HexVector(0, 0)).not.toEqual(new HexVector(1, -3));
    });
});

describe('hive game class tests', () => {
    it('places the first piece', () => {
        const game = new HiveGame();
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, 0) });
        expect(game.getHive()).toEqual(
            expect.arrayContaining([{
                colour: HiveColour.BLACK,
                piece: HivePiece.GRASSHOPPER,
                position: new HexVector(0, 0)
            } as HiveBoardPiece])
        );
    });

    it('alternates between black and white', () => {
        const game = new HiveGame();
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-1, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(1, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-2, 0) });
        expect(game.getHive()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({colour: HiveColour.BLACK}),
                expect.objectContaining({colour: HiveColour.WHITE}),
                expect.objectContaining({colour: HiveColour.BLACK}),
                expect.objectContaining({colour: HiveColour.WHITE}),
            ])
        );
    });

    it('ensures queen be placed by move 4', () => {
        const game = new HiveGame();
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-1, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(1, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-2, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(2, 0) });
        game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-3, 0) });

        expect(game.executeMove({ type: 'place', piece: HivePiece.SPIDER, position: new HexVector(3, 0) })).toStrictEqual(false);
        expect(game.executeMove({ type: 'place', piece: HivePiece.QUEEN_BEE, position: new HexVector(3, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.SPIDER, position: new HexVector(-4, 0) })).toStrictEqual(false);
        expect(game.executeMove({ type: 'place', piece: HivePiece.QUEEN_BEE, position: new HexVector(-4, 0) })).toStrictEqual(true);
    });

    it('cannot place more pieces than the player has', () => {
        const game = new HiveGame();

        // we have grasshoppers left
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-1, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(1, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-2, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(2, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-3, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.QUEEN_BEE, position: new HexVector(3, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.QUEEN_BEE, position: new HexVector(-4, 0) })).toStrictEqual(true);

        // we have no grasshoppers left
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(4, 0) })).toStrictEqual(false);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-5, 0) })).toStrictEqual(false);
    });

    it('follows adjacency rules for placing pieces', () => {
        const game = new HiveGame();

        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, 0) })).toStrictEqual(true);
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(-1, 0) })).toStrictEqual(true);

        // this touches black and white
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, -1) })).toStrictEqual(false);

        // this touches nothing
        expect(game.executeMove({ type: 'place', piece: HivePiece.GRASSHOPPER, position: new HexVector(0, 2) })).toStrictEqual(false);
    });

    it('can move an ant anywhere around the hive', () => {
        const createTwoQueensAndTwoAntsGame = () => {
            const game = new HiveGame();
            game.executeMove({ type: 'place', piece: HivePiece.QUEEN_BEE, position: new HexVector(0, 0) });
            game.executeMove({ type: 'place', piece: HivePiece.QUEEN_BEE, position: new HexVector(-1, 0) });
            game.executeMove({ type: 'place', piece: HivePiece.SOLDIER_ANT, position: new HexVector(1, 0) });
            game.executeMove({ type: 'place', piece: HivePiece.SOLDIER_ANT, position: new HexVector(-2, 0) });
            return game;
        };

        const validNewAntLocations = [
            new HexVector(1, -1),
            new HexVector(0, -1),
            new HexVector(-1, -1),
            new HexVector(-2, -1),
            new HexVector(-3, 0),
            new HexVector(-3, 1),
            new HexVector(-2, 1),
            new HexVector(-1, 1),
            new HexVector(0, 1),
        ];

        let game: HiveGame;

        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[0]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[0]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[1]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[1]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[2]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[2]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[3]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[3]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[4]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[4]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[5]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[5]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[6]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[6]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[7]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[7]))).toStrictEqual(true);
        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: validNewAntLocations[8]})).toStrictEqual(true);
        expect(game.getHive().some(p => p.position.equals(validNewAntLocations[8]))).toStrictEqual(true);

        const invalidNewAntLocations = [
            new HexVector(1, 0),
            new HexVector(3, 7),
        ];

        game = createTwoQueensAndTwoAntsGame();
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: invalidNewAntLocations[0]})).toStrictEqual(false);
        expect(game.executeMove({type: 'move', from: new HexVector(1, 0), to: invalidNewAntLocations[1]})).toStrictEqual(false);
    });

    it('respects freedom to move on the ant', () => {
    });

    it('can move a queen bee one tile around the hive', () => {
    });
});
