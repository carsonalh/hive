import Game from "./game";

interface GameStore {
    game: Game;
}

let gameStore: GameStore = null!;

export function initialise(): void {
    if (gameStore != null) {
        throw new Error('game store double initialise')
    }

    gameStore = {
        game: new Game(),
    };
}

export function getGame(): Game {
    if (gameStore == null) {
        throw new Error('game store must be initialised before retrieval')
    }

    return gameStore.game;
}
