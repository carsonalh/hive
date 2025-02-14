#include <emscripten.h>
#include <stdint.h>

enum {
	COLOR_BLACK = 0,
	COLOR_WHITE = 1,
};

enum {
	PIECE_TYPE_QUEEN_BEE = 0,
	PIECE_TYPE_SOLDIER_ANT,
	PIECE_TYPE_GRASSHOPPER,
	PIECE_TYPE_SPIDER,
	PIECE_TYPE_BEETLE,
	PIECE_TYPE_LADYBUG,
	PIECE_TYPE_MOSQUITO,
	/* the number of piece types */
	PIECE_TYPE_COUNT,
};

enum {
	INITIAL_PIECE_COUNT_QUEEN_BEE   = 1,
	INITIAL_PIECE_COUNT_SOLDIER_ANT = 3,
	INITIAL_PIECE_COUNT_GRASSHOPPER = 3,
	INITIAL_PIECE_COUNT_SPIDER      = 2,
	INITIAL_PIECE_COUNT_BEETLE      = 2,
	INITIAL_PIECE_COUNT_LADYBUG     = 1,
	INITIAL_PIECE_COUNT_MOSQUITO    = 1,
};

typedef struct {
	int32_t q, r;
} Vec2;

typedef struct {
	Vec2 position;
	uint8_t color;
	uint8_t piece_type;
	uint8_t stack_height;
} Tile;

#define MAX_TILES 26

typedef struct {
	/* what move we are on, starting at 1 */
	uint32_t move;
	uint8_t color_to_move;
	uint8_t white_reserve[PIECE_TYPE_COUNT];
	uint8_t black_reserve[PIECE_TYPE_COUNT];
	uint8_t tiles_len;
	Tile tiles[MAX_TILES];
} Game;

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

EMSCRIPTEN_KEEPALIVE
void *create_hive_game(void)
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
		.tiles = {0},
	};
	return (void *)&game;
}

EMSCRIPTEN_KEEPALIVE
bool place_tile(int32_t pos_q, int32_t pos_r, int32_t piece_type)
{
	const Vec2 pos = { pos_q, pos_r };
	for (int i = 0; i < game.tiles_len; i++) {
		if (v2_equal(game.tiles[i].position, pos)) {
			return false;
		}
	}

	return true;
}
