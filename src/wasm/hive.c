#include "hive.h"

#include <assert.h>

// I believe that if we know the size and location of our memory
// addresses, we can just write straight to the addresses.  A page
// size in wasm is 64KB which is way larger than we'll need, so let's
// confine ourselves to such addresses
// let us also, for sanity's sake, not allocate anything in the NULL
// address

static Game game;

static inline bool v2_equal(Vec2 a, Vec2 b)
{
	return a.q == b.q && a.r == b.r;
}

static inline bool v2_adjacent(Vec2 a, Vec2 b)
{
	const Vec2 diff = {a.q - b.q, a.r - b.r};
	const Vec2 adjacent_diffs[] = {
		{1, 0},
		{-1, 0},
		{0, 1},
		{0, -1},
		{1, -1},
		{-1, 1},
	};

	for (int i = 0; i < 6; i++) {
		if (diff.q == adjacent_diffs[i].q && diff.r == adjacent_diffs[i].r) {
			return true;
		}
	}

	return false;
}

EMSCRIPTEN_KEEPALIVE
Game *create_hive_game(void)
{
	game = (Game) {
		.move = 1,
		.color_to_move = COLOR_BLACK,
		.white_reserve = {
			[PIECE_TYPE_QUEEN_BEE]   = INITIAL_PIECE_COUNT_QUEEN_BEE,
			[PIECE_TYPE_SOLDIER_ANT] = INITIAL_PIECE_COUNT_SOLDIER_ANT,
			[PIECE_TYPE_GRASSHOPPER] = INITIAL_PIECE_COUNT_GRASSHOPPER,
			[PIECE_TYPE_SPIDER]      = INITIAL_PIECE_COUNT_SPIDER,
			[PIECE_TYPE_BEETLE]      = INITIAL_PIECE_COUNT_BEETLE,
			[PIECE_TYPE_LADYBUG]     = INITIAL_PIECE_COUNT_LADYBUG,
			[PIECE_TYPE_MOSQUITO]    = INITIAL_PIECE_COUNT_MOSQUITO,
		},
		.black_reserve = {
			[PIECE_TYPE_QUEEN_BEE]   = INITIAL_PIECE_COUNT_QUEEN_BEE,
			[PIECE_TYPE_SOLDIER_ANT] = INITIAL_PIECE_COUNT_SOLDIER_ANT,
			[PIECE_TYPE_GRASSHOPPER] = INITIAL_PIECE_COUNT_GRASSHOPPER,
			[PIECE_TYPE_SPIDER]      = INITIAL_PIECE_COUNT_SPIDER,
			[PIECE_TYPE_BEETLE]      = INITIAL_PIECE_COUNT_BEETLE,
			[PIECE_TYPE_LADYBUG]     = INITIAL_PIECE_COUNT_LADYBUG,
			[PIECE_TYPE_MOSQUITO]    = INITIAL_PIECE_COUNT_MOSQUITO,
		},
		.tiles_len = 0,
		.tiles = {{{0}}},
	};
	return &game;
}

EMSCRIPTEN_KEEPALIVE
bool place_tile(int32_t pos_q, int32_t pos_r, int32_t piece_type)
{
	uint8_t (*reserve)[PIECE_TYPE_COUNT] = game.color_to_move == COLOR_BLACK
		? &game.black_reserve
		: &game.white_reserve;

	assert(piece_type < PIECE_TYPE_COUNT);
	if ((*reserve)[piece_type] == 0) {
		return false;
	}

	if (game.move == 1 && game.color_to_move == COLOR_BLACK) {
		goto place_success;
	}

	bool queen_placed = false;

	for (int i = 0; i < game.tiles_len; i++) {
		if (game.tiles[i].color == game.color_to_move
			&& game.tiles[i].piece_type == PIECE_TYPE_QUEEN_BEE) {
			queen_placed = true;
			break;
		}
	}

	if (!queen_placed && game.move == 4 && piece_type != PIECE_TYPE_QUEEN_BEE) {
		return false;
	}

	bool neighbours_friend = false, neighbours_enemy = false;
	bool atop_other = false;

	const Vec2 pos = {pos_q, pos_r};

	for (int i = 0; i < game.tiles_len; i++) {
		if (v2_adjacent(game.tiles[i].position, pos)) {
			if (game.tiles[i].color == game.color_to_move) {
				neighbours_friend = true;
			} else {
				neighbours_enemy = true;
			}
		} else if (v2_equal(game.tiles[i].position, pos)) {
			atop_other = true;
		}
	}

	if (game.move == 1 && neighbours_enemy) {
		assert(!neighbours_friend);
		assert(!atop_other);
		assert(game.color_to_move == COLOR_WHITE && "black should have already been handled");
		goto place_success;
	}

	if (atop_other) {
		return false;
	}

	if (!neighbours_friend || neighbours_enemy) {
		return false;
	}

place_success:
	game.tiles[game.tiles_len++] = (Tile) {
		.position = { pos_q, pos_r },
		.color = game.color_to_move,
		.piece_type = piece_type,
		.stack_height = 0,
	};
	(*reserve)[piece_type]--;
	game.move += game.color_to_move == COLOR_WHITE;
	game.color_to_move = game.color_to_move == COLOR_BLACK ? COLOR_WHITE : COLOR_BLACK;
	return true;
}

EMSCRIPTEN_KEEPALIVE
bool move_tile(int32_t from_q, int32_t from_r, int32_t to_q, int32_t to_r)
{
	(void)from_q;
	(void)from_r;
	(void)to_q;
	(void)to_r;

	return false;
}

