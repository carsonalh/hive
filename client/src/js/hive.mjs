const memory = new WebAssembly.Memory({
	initial: 1,
	maximum: 1,
});

export const Color = Object.freeze({
	BLACK: 0,
	WHITE: 1,
});

export const PieceType = Object.freeze({
	QUEEN_BEE: 0,
	SOLDIER_ANT: 1,
	GRASSHOPPER: 2,
	SPIDER: 3,
	BEETLE: 4,
	LADYBUG: 5,
	MOSQUITO: 6,
	COUNT: 7,
});

export const CompletionState = Object.freeze({
	INCOMPLETE: 0,
	BLACK_WON: 1,
	WHITE_WON: 2,
	DRAW: 3,
});

const SIZEOF_GAME = 336;
const SIZEOF_TILE = 12;
const TILES_BEGIN_OFFSET = 20;
const SCRATCH_BUFFER_LOCATION = 4096;

/**
 * Gets a copy of the game state, in a readable json format.
 *
 * NOTE: there is not 'game state' object, so only a copy can be retrieved.
 */
export function gameStateCopy() {
	// We unpack the C struct
	// Note that this depends on the game being a singleton in the WASM module
	const view = new DataView(memory.buffer, gamePtr, SIZEOF_GAME);
	const tilesLen = view.getUint8(19);
	const tiles = [];
	for (let i = 0; i < tilesLen; i++) {
		tiles.push({
			position: {
				q: view.getInt32(TILES_BEGIN_OFFSET + SIZEOF_TILE * i, true),
				r: view.getInt32(TILES_BEGIN_OFFSET + SIZEOF_TILE * i + 4, true),
			},
			color: view.getUint8(TILES_BEGIN_OFFSET + SIZEOF_TILE * i + 8),
			pieceType: view.getUint8(TILES_BEGIN_OFFSET + SIZEOF_TILE * i + 9),
			stackHeight: view.getUint8(TILES_BEGIN_OFFSET + SIZEOF_TILE * i + 10),
		});
	}
	return {
		move: view.getUint32(0, true),
		colorToMove: view.getUint8(4),
		whiteReserve: Array.from(new Uint8Array(memory.buffer, gamePtr + 5, PieceType.COUNT)),
		blackReserve: Array.from(new Uint8Array(memory.buffer, gamePtr + 5 + PieceType.COUNT, PieceType.COUNT)),
		tiles,
	};
}

const module = await WebAssembly.instantiateStreaming(fetch('/static/wasm/hive.wasm'), {
	env: {
		// when the stack gets large for the wasm operand stack, what portion
		// of memory should be used as the stack
		__stack_pointer: new WebAssembly.Global({ value: 'i32', mutable: true, }, 32 * 1024),
		// where (static) allocations should start
		__memory_base: 12 * 1024,
		// so static allocations have an allotted space of 20KiB (we only use a
		// small fraction of even this)
		memory: memory,
	}
});
let gamePtr = -1;

export function legalPlacements(tileIndex) {
	console.assert(gamePtr > 0);

	const tilePtr = TILES_BEGIN_OFFSET + SIZEOF_TILE * tileIndex;
	const outputBufferPtr = SCRATCH_BUFFER_LOCATION;
	const placementsLen = module.instance.exports.legal_placements(tilePtr, outputBufferPtr);

	const view = new DataView(memory.buffer, gamePtr, SIZEOF_GAME);
	const placements = [];
	for (let i = 0; i < placementsLen; i++) {
		placements.push({
			q: view.getInt32(outputBufferPtr + 8 * i, true),
			r: view.getInt32(outputBufferPtr + 8 * i + 4, true),
		});
	}
	return placements;
}

export function legalMovements(tileIndex) {
	console.assert(gamePtr > 0);

	const tilePtr = TILES_BEGIN_OFFSET + SIZEOF_TILE * tileIndex;
	const outputBufferPtr = SCRATCH_BUFFER_LOCATION;
	const movementsLen = module.instance.exports.legal_placements(tilePtr, outputBufferPtr);

	const view = new DataView(memory.buffer, gamePtr, SIZEOF_GAME);
	const movements = [];
	for (let i = 0; i < movementsLen; i++) {
		movements.push({
			q: view.getInt32(outputBufferPtr + 8 * i, true),
			r: view.getInt32(outputBufferPtr + 8 * i + 4, true),
		});
	}
	return movements;
}

export const initGame = () => { gamePtr = module.instance.exports.init_game() };
export const placeTile = module.instance.exports.place_tile;
export const moveTile = module.instance.exports.move_tile;
export const completionState = module.instance.exports.completion_state;

