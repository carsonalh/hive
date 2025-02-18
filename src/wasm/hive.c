#include "hive.h"

#include <assert.h>
#include <string.h>

#define max(a, b) ((a) > (b)) ? (a) : (b)

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

// important that these are in order, this array could be reversed and/or
// rotated and produce a correct algorithm for checking freedom to move
static const Vec2 unit_dirs[6] = {
	{0, -1},
	{1, -1},
	{1, 0},
	{0, 1},
	{-1, 1},
	{-1, 0},
};

// Each of these functions return the amount of legal moves there were
// They ignore 'from' from the hive in their search
// TODO Game* self param
// TODO make 'moves' nullable?
static int move_queen_bee  (Vec2 from, Vec2 moves[MAX_MOVES]);
static int move_soldier_ant(Vec2 from, Vec2 moves[MAX_MOVES]);
static int move_grasshopper(Vec2 from, Vec2 moves[MAX_MOVES]);
static int move_spider     (Vec2 from, Vec2 moves[MAX_MOVES]);
static int move_beetle     (Vec2 from, Vec2 moves[MAX_MOVES]);
static int move_ladybug    (Vec2 from, Vec2 moves[MAX_MOVES]);
static int move_mosquito   (Vec2 from, Vec2 moves[MAX_MOVES]);

static void advance_move(void);

static inline bool v2_adjacent(Vec2 a, Vec2 b)
{
	const Vec2 diff = {a.q - b.q, a.r - b.r};

	for (int i = 0; i < 6; i++) {
		if (v2_equal(diff, unit_dirs[i])) {
			return true;
		}
	}

	return false;
}

static Tile *top_of_stack(Vec2 pos)
{
	Tile *top = NULL;
	for (int i = 0; i < game.tiles_len; i++) {
		if (v2_equal(game.tiles[i].position, pos)) {
			if (!top || game.tiles[i].stack_height > top->stack_height) {
				top = &game.tiles[i];
			}
		}
	}
	return top;
}

EMSCRIPTEN_KEEPALIVE
Game *init_game(void)
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

	for (int i = 0; i < 6; i++) {
		const Vec2 neighbour = { pos.q + unit_dirs[i].q, pos.r + unit_dirs[i].r };
		const Tile *top = top_of_stack(neighbour);
		if (top) {
			if (top->color == game.color_to_move) {
				neighbours_friend = true;
			} else {
				neighbours_enemy = true;
			}
		}
	}

	for (int i = 0; i < game.tiles_len; i++) {
		if (v2_equal(game.tiles[i].position, pos)) {
			atop_other = true;
			break;
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
	advance_move();
	return true;
}

static int popcount(uint64_t x)
{
	int sum = 0;
	while (x) {
		sum += x & 1;
		x >>= 1;
	}
	return sum;
}

#define MAX_BFS_QUEUE (MAX_TILES * 6) // each tile can append at most 6 neighbours to the search

// We get our terminology from graph theory
// https://en.wikipedia.org/wiki/Bridge_(graph_theory)
static bool tile_is_bridge(Vec2 pos)
{
	Vec2 neighbours[6];
	int neighbours_len = 0;

	for (int i = 0; i < game.tiles_len; i++) {
		if (v2_adjacent(pos, game.tiles[i].position)) {
			neighbours[neighbours_len++] = game.tiles[i].position;
		}
	}

	if (neighbours_len <= 1) {
		return false;
	}

	// for the first neighbour, do a bfs starting from that position (manually
	// exclude 'pos')

	// while we have other neighbours that can go back to the first pool, we
	// skip them
	// if we find a neighbour that has no path to that first pool, then we know
	// our tile is a bridge

	Vec2 queue[MAX_BFS_QUEUE] = { neighbours[0] };
	int queue_begin = 0;
	int queue_next = 1;

	Vec2 seen_first[MAX_TILES];
	int seen_first_len = 0;

	while (queue_begin != queue_next) {
		const Vec2 next = queue[queue_begin++];

		if (v2_equal(next, pos)) {
			continue;
		}

		bool was_seen = false;
		for (int i = 0; i < seen_first_len; i++) {
			if (v2_equal(next, seen_first[i])) {
				was_seen = true;
				break;
			}
		}
		if (was_seen) {
			continue;
		}

		for (int i = 0; i < game.tiles_len; i++) {
			if (v2_adjacent(game.tiles[i].position, next)) {
				queue[queue_next++] = game.tiles[i].position;
			}
		}

		assert(seen_first_len < MAX_TILES);
		seen_first[seen_first_len++] = next;
	}

	Vec2 seen[MAX_TILES];
	int seen_len;

	for (int i = 1; i < neighbours_len; i++) {
		queue[0] = neighbours[i];
		queue_begin = 0;
		queue_next = 1;

		seen_len = 0;

		while (queue_begin != queue_next) {
			const Vec2 next = queue[queue_begin++];

			if (v2_equal(next, pos)) {
				continue;
			}

			for (int j = 0; j < seen_first_len; j++) {
				if (v2_equal(seen_first[j], next)) {
					return false;
				}
			}

			bool was_seen = false;
			for (int j = 0; j < seen_len; j++) {
				if (v2_equal(next, seen[j])) {
					was_seen = true;
					break;
				}
			}
			if (was_seen) {
				continue;
			}

			for (int j = 0; j < game.tiles_len; j++) {
				for (int k = 0; k < 6; k++) {
					const Vec2 tile_pos = game.tiles[j].position;
					const Vec2 with_diff = { unit_dirs[k].q + next.q, unit_dirs[k].r + next.r };
					if (v2_equal(tile_pos, with_diff)) {
						queue[queue_next++] = tile_pos;
					}
				}
			}

			seen[seen_len++] = next;
		}
	}

	return true;
}

static void move_once_around_hive(Vec2 from, int *places_len, Vec2 places[4])
{
	assert(places_len != NULL);

	// we get the adjacent pieces, and look left and right for empty places
	// we must also check one hive and freedom to move for each of these
	// though we implement graph algorithms, we do it the n^2 and n^3 way
	// because n <= 26

	// we find the empty places with a bitfield of size 6 bits
	// these bit places correspond to indices in 'unit_dirs'
	uint32_t occupied = 0;

	Vec2 adjacents[6];
	memcpy(adjacents, unit_dirs, sizeof adjacents);
	for (int i = 0; i < 6; i++) {
		adjacents[i].q += from.q;
		adjacents[i].r += from.r;
	}

	for (int i = 0; i < game.tiles_len; i++) {
		for (int j = 0; j < 6; j++) {
			if (v2_equal(game.tiles[i].position, adjacents[j])) {
				occupied |= 1 << j;
			}
		}
	}

	// if we have any 101 patterns in 'occupied', we fill this in to 111
	// because, to pass through two pieces as such violates the 'freedom to
	// move' rule
	uint32_t mask = 0x05;
	uint32_t fill = 0x07;
	for (int i = 0; i < 6; i++) {
		if ((occupied & mask) == mask) {
			occupied |= fill;
		}
		mask = ((mask << 1) & 0x3f) | (mask >> 5);
		fill = ((fill << 1) & 0x3f) | (fill >> 5);
	}

	// rotate left with size 6 bits
	const uint32_t occ_left = ((occupied << 1) & 0x3f) | (occupied >> 5);
	const uint32_t occ_right = (occupied >> 1) | ((occupied & 1) << 5);

	const uint32_t available = (occ_left | occ_right) & ~occupied;
	// there is no situation where a piece can move in more than four
	// directions
	assert(popcount(available) <= 4);
	*places_len = popcount(available);

	int next_place = 0;
	for (int i = 0; i < 6; i++) {
		if (available & (1 << i)) {
			places[next_place++] = adjacents[i];
		}
	}
}

int legal_placements(Vec2 placements[MAX_MOVES])
{
	if (game.move == 1) {
		assert(game.color_to_move == COLOR_BLACK || game.tiles_len == 1);

		if (game.color_to_move == COLOR_BLACK) {
			placements[0] = (Vec2) { 0, 0 };
			return 1;
		} else {
			for (int i = 0; i < 6; i++) {
				placements[i] = (Vec2) {
					unit_dirs[i].q + game.tiles[0].position.q,
					unit_dirs[i].r + game.tiles[0].position.r,
				};
			}
			return 6;
		}
	}

	int len_placements = 0;
	for (int i = 0; i < game.tiles_len; i++) {
		const Vec2 pos = game.tiles[i].position;
		Tile *t = top_of_stack(pos);
		if (t != &game.tiles[i] || t->color != game.color_to_move) {
			continue;
		}
		for (int j = 0; j < 6; j++) {
			const Vec2 neighbour = { unit_dirs[j].q + pos.q, unit_dirs[j].r + pos.r };
			if (top_of_stack(neighbour)) {
				continue;
			} else {
				bool can_place = true;
				for (int k = 0; k < 6; k++) {
					const Vec2 second_neighbour = { unit_dirs[i].q + neighbour.q, unit_dirs[i].r + neighbour.r };
					const Tile *s = top_of_stack(second_neighbour);
					if (s && s->color != game.color_to_move) {
						can_place = false;
						break;
					}
				}
				if (!can_place) {
					continue;
				}
			}
			bool already_found = false;
			for (int k = 0; k < len_placements; k++) {
				if (v2_equal(placements[k], neighbour)) {
					already_found = true;
					break;
				}
			}
			if (!already_found) {
				placements[len_placements++] = neighbour;
			}
		}
	}
	return len_placements;
}

int legal_movements(const Tile *t, Vec2 moves[MAX_MOVES])
{
	assert((!t || t == top_of_stack(t->position)) && "cannot move a tile which is covered by another");

	const Vec2 from = t->position;

	bool queen_placed = false;

	for (int i = 0; i < game.tiles_len; i++) {
		if (game.tiles[i].color == game.color_to_move
			&& game.tiles[i].piece_type == PIECE_TYPE_QUEEN_BEE) {
			queen_placed = true;
			break;
		}
	}

	if (!queen_placed) {
		return 0;
	}

	if (!t) {
		// cannot move a tile which is not in play
		return 0;
	}

	if (t->color != game.color_to_move) {
		// cannot move an opponent's piece
		return 0;
	}

	if (tile_is_bridge(from)) {
		// this would be a violation of the one hive rule
		return 0;
	}

	int len_moves;

	switch (t->piece_type) {
	case PIECE_TYPE_QUEEN_BEE:
		len_moves = move_queen_bee(from, moves);
		break;
	case PIECE_TYPE_SOLDIER_ANT:
		len_moves = move_soldier_ant(from, moves);
		break;
	case PIECE_TYPE_GRASSHOPPER:
		len_moves = move_grasshopper(from, moves);
		break;
	case PIECE_TYPE_SPIDER:
		len_moves = move_spider(from, moves);
		break;
	case PIECE_TYPE_BEETLE:
		len_moves = move_beetle(from, moves);
		break;
	case PIECE_TYPE_LADYBUG:
		len_moves = move_ladybug(from, moves);
		break;
	case PIECE_TYPE_MOSQUITO:
		if (t->stack_height > 0) {
			len_moves = move_beetle(from, moves);
		} else {
			len_moves = move_mosquito(from, moves);
		}
		break;
	default:
		assert(0 && "unreachable");
	}

	return len_moves;
}

static void advance_move_unchecked(void)
{
	game.move += game.color_to_move == COLOR_WHITE;
	game.color_to_move = game.color_to_move == COLOR_BLACK
		? COLOR_WHITE
		: COLOR_BLACK;
}

static void advance_move(void)
{
	advance_move_unchecked();

	bool has_legal_moves = false;
	Vec2 moves[MAX_MOVES];
	for (int i = 0; i < game.tiles_len; i++) {
		const Tile *top = top_of_stack(game.tiles[i].position);
		if (&game.tiles[i] != top) continue;
		const int len_moves = legal_movements(&game.tiles[i], moves);
		if (len_moves > 0) {
			has_legal_moves = true;
			break;
		}
	}
	if (has_legal_moves) return;
	const int len_moves = legal_placements(moves);
	if (len_moves > 0) return;

	// TODO check both players being unable to move once the pillbug is added
	// to this implementation

	advance_move_unchecked();
}

EMSCRIPTEN_KEEPALIVE
bool move_tile(int32_t from_q, int32_t from_r, int32_t to_q, int32_t to_r)
{
	const Vec2 from = { from_q, from_r };
	const Vec2 to = { to_q, to_r };

	Vec2 moves[MAX_MOVES];
	int len_moves;

	Tile *t = top_of_stack(from);

	len_moves = legal_movements(t, moves);

	int greatest_stack_height = -1;
	for (int i = 0; i < game.tiles_len; i++) {
		if (v2_equal(game.tiles[i].position, to)) {
			greatest_stack_height = max(greatest_stack_height, game.tiles[i].stack_height);
		}
	}

	for (int i = 0; i < len_moves; i++) {
		assert(t && "null t should have resulted in 0 moves");
		if (v2_equal(moves[i], to)) {
			t->position = to;
			t->stack_height = greatest_stack_height + 1;
			advance_move();
			return true;
		}
	}

	return false;
}

EMSCRIPTEN_KEEPALIVE
CompletionState completion_state(void)
{
	bool white_surrounded = false, black_surrounded = false;

	for (int i = 0; i < game.tiles_len; i++) {
		if (game.tiles[i].piece_type == PIECE_TYPE_QUEEN_BEE) {
			const Vec2 pos = game.tiles[i].position;
			bool surrounded = true;
			for (int j = 0; j < 6; j++) {
				const Vec2 neighbour = { unit_dirs[j].q + pos.q, unit_dirs[j].r + pos.r };
				bool neighbour_found = false;
				for (int k = 0; k < game.tiles_len; k++) {
					if (v2_equal(game.tiles[k].position, neighbour)) {
						neighbour_found = true;
						break;
					}
				}
				if (!neighbour_found) {
					surrounded = false;
					break;
				}
			}

			if (game.tiles[i].color == COLOR_BLACK) {
				black_surrounded = black_surrounded || surrounded;
			} else {
				white_surrounded = white_surrounded || surrounded;
			}
		}
	}

	if (white_surrounded && black_surrounded) {
		return COMPLETION_STATE_DRAW;
	}

	if (white_surrounded) {
		return COMPLETION_STATE_BLACK_WON;
	}

	if (black_surrounded) {
		return COMPLETION_STATE_WHITE_WON;
	}

	return COMPLETION_STATE_INCOMPLETE;
}

static int move_queen_bee(Vec2 from, Vec2 moves[MAX_MOVES])
{
	int moves_len;
	move_once_around_hive(from, &moves_len, moves);
	return moves_len;
}

static int move_soldier_ant(Vec2 from, Vec2 moves[MAX_MOVES])
{
	// we exclude 'from' from the moves
	int moves_len = 0;

	Vec2 queue[MAX_MOVES] = { from };
	int queue_begin = 0;
	int queue_next = 1;

	while (queue_begin != queue_next) {
		assert(queue_begin < MAX_MOVES);
		const Vec2 next = queue[queue_begin++];

		if (queue_begin > 1 && v2_equal(next, from)) {
			continue;
		}

		bool was_seen = false;
		for (int i = 0; i < moves_len; i++) {
			if (v2_equal(moves[i], next)) {
				was_seen = true;
				break;
			}
		}
		if (was_seen) {
			continue;
		}

		assert(queue_next + 4 <= MAX_MOVES);

		int len_next_moves;
		move_once_around_hive(next, &len_next_moves, &queue[queue_next]);
		queue_next += len_next_moves;

		if (!v2_equal(next, from)) {
			assert(moves_len < MAX_MOVES);
			moves[moves_len++] = next;
		}
	}

	return moves_len;
}

static int move_grasshopper(Vec2 from, Vec2 moves[MAX_MOVES])
{
	int len_moves = 0;
	for (int i = 0; i < 6; i++) {
		Vec2 search = from;
		int row_len = 0;
		bool found;

		do {
			found = false;
			search = (Vec2) { search.q + unit_dirs[i].q, search.r + unit_dirs[i].r };
			for (int j = 0; j < game.tiles_len; j++) {
				if (v2_equal(game.tiles[j].position, search)) {
					found = true;
					break;
				}
			}
			row_len++;
		} while (found);

		if (row_len > 1) {
			moves[len_moves++] = search;
		}
	}
	return len_moves;
}

static int move_spider(Vec2 from, Vec2 moves[MAX_MOVES])
{
	// do a bfs, stopping at path len = 3
	int len_moves = 0;
	Vec2 seen[MAX_MOVES];
	int seen_len = 0;

	Vec2 queue[MAX_MOVES];
	queue[0] = from;
	int queue_begin = 0;
	int queue_next = 1;

	uint8_t depth_queue[MAX_MOVES] = {0};
	while (queue_begin != queue_next && depth_queue[queue_begin] < 4) {
		const uint8_t depth = depth_queue[queue_begin];
		const Vec2 next = queue[queue_begin];
		queue_begin++;

		bool was_seen = false;
		for (int i = 0; i < seen_len; i++) {
			if (v2_equal(next, seen[i])) {
				was_seen = true;
				break;
			}
		}
		if (was_seen) {
			continue;
		}

		if (depth == 3) {
			moves[len_moves++] = next;
		}

		int len_next_moves;
		assert(queue_next + 4 <= MAX_MOVES);
		move_once_around_hive(next, &len_next_moves, &queue[queue_next]);
		static_assert(sizeof *depth_queue == 1, "memset is per-byte");
		memset(&depth_queue[queue_next], depth + 1, len_next_moves * sizeof(uint8_t));
		queue_next += len_next_moves;

		assert(seen_len < MAX_MOVES);
		seen[seen_len++] = next;
	}
	return len_moves;
}

static int move_beetle(Vec2 from, Vec2 moves[MAX_MOVES])
{
	int len_moves = 0;
	move_once_around_hive(from, &len_moves, moves);
	// the moves are guaranteed to be empty spaces
	for (int i = 0; i < 6; i++) {
		const Vec2 neighbour = { unit_dirs[i].q + from.q, unit_dirs[i].r + from.r };
		if (top_of_stack(neighbour)) {
			moves[len_moves++] = neighbour;
		}
	}

	assert(len_moves <= 6);

	return len_moves;
}

static void move_ladybug_rec(int depth, Vec2 from, Vec2 exclude, Vec2 moves[MAX_MOVES], int *moves_len)
{
	assert(depth <= 3);
	assert(depth > 0);

	if (depth < 3) {
		for (int i = 0; i < game.tiles_len; i++) {
			if (v2_equal(game.tiles[i].position, exclude)) continue;
			if (v2_adjacent(game.tiles[i].position, from)) {
				move_ladybug_rec(depth + 1, game.tiles[i].position, exclude, moves, moves_len);
			}
		}
	} else {
		for (int i = 0; i < 6; i++) {
			const Vec2 to_check = { unit_dirs[i].q + from.q, unit_dirs[i].r + from.r };
			bool found = false;
			for (int j = 0; j < game.tiles_len; j++) {
				if (v2_equal(to_check, game.tiles[j].position)) {
					found = true;
					break;
				}
			}

			if (found) continue;

			// valid ladybug move; only append it to 'moves' once
			bool was_seen = false;
			for (int k = 0; k < *moves_len; k++) {
				if (v2_equal(to_check, moves[k])) {
					was_seen = true;
					break;
				}
			}
			if (!was_seen) {
				moves[(*moves_len)++] = to_check;
			}
		}
	}
}

static int move_ladybug(Vec2 from, Vec2 moves[MAX_MOVES])
{
	int moves_len = 0;
	move_ladybug_rec(1, from, from, moves, &moves_len);
	return moves_len;
}

static void append_unique(
	int buffer_len, Vec2 buffer[restrict MAX_MOVES],
	int *moves_len, Vec2 moves[restrict MAX_MOVES])
{
	for (int i = 0; i < buffer_len; i++) {
		bool was_seen = false;
		for (int j = 0; j < *moves_len; j++) {
			if (v2_equal(buffer[i], moves[j])) {
				was_seen = true;
				break;
			}
		}
		if (!was_seen) {
			moves[(*moves_len)++] = buffer[i];
		}
	}
}

static int move_mosquito(Vec2 from, Vec2 moves[MAX_MOVES])
{
	// bits are the place in the enum of piece types
	int to_mimic = 0;
	for (int i = 0; i < 6; i++) {
		const Vec2 neighbour = { unit_dirs[i].q + from.q, unit_dirs[i].r + from.r };
		const Tile *top = top_of_stack(neighbour);
		if (top) {
			to_mimic |= 1 << top->piece_type;
		}
	}
	Vec2 buffer[MAX_MOVES];
	int buffer_len;
	int moves_len = 0;
	if (to_mimic & (1 << PIECE_TYPE_QUEEN_BEE)) {
		buffer_len = move_queen_bee(from, buffer);
		append_unique(buffer_len, buffer, &moves_len, moves);
	}
	if (to_mimic & (1 << PIECE_TYPE_SOLDIER_ANT)) {
		buffer_len = move_soldier_ant(from, buffer);
		append_unique(buffer_len, buffer, &moves_len, moves);
	}
	if (to_mimic & (1 << PIECE_TYPE_GRASSHOPPER)) {
		buffer_len = move_grasshopper(from, buffer);
		append_unique(buffer_len, buffer, &moves_len, moves);
	}
	if (to_mimic & (1 << PIECE_TYPE_SPIDER)) {
		buffer_len = move_spider(from, buffer);
		append_unique(buffer_len, buffer, &moves_len, moves);
	}
	if (to_mimic & (1 << PIECE_TYPE_BEETLE)) {
		buffer_len = move_beetle(from, buffer);
		append_unique(buffer_len, buffer, &moves_len, moves);
	}
	if (to_mimic & (1 << PIECE_TYPE_LADYBUG)) {
		buffer_len = move_ladybug(from, buffer);
		append_unique(buffer_len, buffer, &moves_len, moves);
	}
	return moves_len;
}

