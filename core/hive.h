// No header guard; no need!

#ifdef HIVE_WASM
#define NDEBUG
#define HIVE_EXPORT(name) __attribute__((export_name(#name)))
#else
#define HIVE_EXPORT(name)
#endif

#define max(a, b) ((a) > (b)) ? (a) : (b)

#ifdef HIVE_WASM

// it doesn't make sense to link libc just for some utilities without syscalls

#define static_assert(x, msg) _Static_assert(x, msg)

typedef unsigned long long uint64_t;
typedef long long int64_t;
typedef unsigned int uint32_t;
typedef int int32_t;
typedef unsigned short uint16_t;
typedef short int16_t;
typedef unsigned char uint8_t;
typedef char int8_t;

static_assert(sizeof (uint64_t) == 8, "");
static_assert(sizeof (int64_t)  == 8, "");
static_assert(sizeof (uint32_t) == 4, "");
static_assert(sizeof (int32_t)  == 4, "");
static_assert(sizeof (uint16_t) == 2, "");
static_assert(sizeof (int16_t)  == 2, "");
static_assert(sizeof (uint8_t)  == 1, "");
static_assert(sizeof (int8_t)   == 1, "");

typedef long ssize_t;
typedef unsigned long size_t;

static_assert(sizeof (ssize_t) == sizeof (void*), "");
static_assert(sizeof (size_t) == sizeof (void*), "");

#define NULL ((void *)0)
#define assert(x)

typedef _Bool bool;

#define true ((_Bool)!0)
#define false ((_Bool)0)

void *memcpy(void *dst, const void *src, size_t count);
void *memset(void *s, int c, size_t n);

#else
#include <stdint.h>
#include <stdlib.h>
#include <stdbool.h>
#include <assert.h>
#include <string.h>
#endif

enum {
	COLOR_BLACK = 0,
	COLOR_WHITE = 1,
};

enum {
	PIECE_TYPE_QUEEN_BEE = 0,
	PIECE_TYPE_SOLDIER_ANT = 1,
	PIECE_TYPE_GRASSHOPPER = 2,
	PIECE_TYPE_SPIDER = 3,
	PIECE_TYPE_BEETLE = 4,
	PIECE_TYPE_LADYBUG = 5,
	PIECE_TYPE_MOSQUITO = 6,
	/* the number of piece types */
	PIECE_TYPE_COUNT = 7,
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

// this is a trivial upper bound to the surface area (in hexagons) of a hive
// we can have at most 26 tiles on the board, each with at most 6 adjacent
// places, each with at most 4 possible moves. I'm sure the actual limit is
// much smaller than this (624 in total)
#define MAX_MOVES (26*6*4)

typedef struct {
	/* what move we are on, starting at 1 */
	uint32_t move;
	uint8_t color_to_move;
	uint8_t white_reserve[PIECE_TYPE_COUNT];
	uint8_t black_reserve[PIECE_TYPE_COUNT];
	uint8_t tiles_len;
	Tile tiles[MAX_TILES];
} Game;

typedef enum {
	COMPLETION_STATE_INCOMPLETE = 0,
	COMPLETION_STATE_BLACK_WON,
	COMPLETION_STATE_WHITE_WON,
	COMPLETION_STATE_DRAW,
} CompletionState;

HIVE_EXPORT(game_create)      Game *game_create(void);
HIVE_EXPORT(game_free)        void game_free(Game *game);
HIVE_EXPORT(place_tile)       bool game_place_tile(Game *game, int32_t pos_q, int32_t pos_r, int32_t piece_type);
HIVE_EXPORT(move_tile)        bool game_move_tile(Game *game, int32_t from_q, int32_t from_r, int32_t to_q, int32_t to_r);
HIVE_EXPORT(completion_state) CompletionState game_completion_state(const Game *game);
HIVE_EXPORT(legal_placements) int game_legal_placements(const Game *game, Vec2 placements[MAX_MOVES]);
HIVE_EXPORT(legal_movements)  int game_legal_movements(const Game *game, const Tile *t, Vec2 moves[MAX_MOVES]);

