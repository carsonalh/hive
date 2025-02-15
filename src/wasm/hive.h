// No header guard; no need!

#ifdef HIVE_WASM
#include <emscripten.h>
#define NDEBUG
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

#include <stdint.h>
#include <stdbool.h>

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

EMSCRIPTEN_KEEPALIVE Game *create_hive_game(void);
EMSCRIPTEN_KEEPALIVE bool place_tile(int32_t pos_q, int32_t pos_r, int32_t piece_type);
EMSCRIPTEN_KEEPALIVE bool move_tile(int32_t from_q, int32_t from_r, int32_t to_q, int32_t to_r);

// TODO either find a decent way of unpacking this struct from js, or make some
// useful getters. (We know exactly which getters should be useful thanks to
// the go wasm exports.)

