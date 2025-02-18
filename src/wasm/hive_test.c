#define UNITY_OUTPUT_COLOR
#include <unity.h>

#include <string.h>

#include "hive.h"

void setUp(void)
{
}

void tearDown(void)
{
}

void test_create_game()
{
	Game *game = init_game();

	TEST_ASSERT_EQUAL(1, game->move);
	TEST_ASSERT_EQUAL(0, game->tiles_len);
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
}

void test_places_the_first_piece(void)
{
	Game *game = init_game();

	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);
	TEST_ASSERT_EQUAL(1, game->tiles_len);
}

void test_alternates_between_black_and_white(void)
{
	Game *game = init_game();

	place_tile(0, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(1, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(-2, 0, PIECE_TYPE_GRASSHOPPER);

	TEST_ASSERT_EQUAL(COLOR_BLACK, game->tiles[0].color);
	TEST_ASSERT_EQUAL(COLOR_WHITE, game->tiles[1].color);
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->tiles[2].color);
	TEST_ASSERT_EQUAL(COLOR_WHITE, game->tiles[3].color);
}

void test_cannot_place_pieces_atop_others(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE_MESSAGE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER), "Falsely flagged bad placement for initial Move");
	TEST_ASSERT_FALSE_MESSAGE(place_tile(0, 0, PIECE_TYPE_BEETLE), "Cannot place tiles atop other tiles");
}

void test_ensures_queen_placed_by_move4(void)
{
	(void)init_game();

	// Move 1
	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_GRASSHOPPER));

	// Move 2
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(2, 0, PIECE_TYPE_GRASSHOPPER));

	// Move 3
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(3, 0, PIECE_TYPE_GRASSHOPPER));

	// Move 4
	TEST_ASSERT_FALSE_MESSAGE(place_tile(-3, 0, PIECE_TYPE_GRASSHOPPER), "Cannot pass this move as the queen should have been placed (black)");
	TEST_ASSERT_TRUE(place_tile(-3, 0, PIECE_TYPE_QUEEN_BEE));

	TEST_ASSERT_FALSE_MESSAGE(place_tile(4, 0, PIECE_TYPE_GRASSHOPPER), "Cannot pass this move as the queen should have been placed (white)");

	TEST_ASSERT_TRUE(place_tile(4, 0, PIECE_TYPE_QUEEN_BEE));
}

void test_cannot_place_more_pieces_than_player_has(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(2, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-3, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(3, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(-4, 0, PIECE_TYPE_GRASSHOPPER));

	TEST_ASSERT_FALSE_MESSAGE(place_tile(4, 0, PIECE_TYPE_GRASSHOPPER), "Cannot allow a player to place more than three grasshoppers");
}

void test_follows_adjacency_rules_for_placement(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE_MESSAGE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER), "First Move need not follow the normal rules");
	TEST_ASSERT_TRUE_MESSAGE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER), "Second Move need not follow the normal rules");

	TEST_ASSERT_FALSE_MESSAGE(place_tile(0, -1, PIECE_TYPE_GRASSHOPPER), "Should not be able to place a piece that touches the opposite Color");
	// this touches nothing
	TEST_ASSERT_FALSE_MESSAGE(place_tile(0, 2, PIECE_TYPE_GRASSHOPPER), "A piece must be touching one if its own");
}

void test_cannot_move_before_queen_placed(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER));

	TEST_ASSERT_FALSE(move_tile(0, 0, -2, 0));
}

void test_move_ant_around_the_hive(void)
{
	Game *game = init_game();
	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);    // black
	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE);   // white
	place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT);  // black
	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT); // white

	Game proto;
	memcpy(&proto, game, sizeof proto);

	// black ant starts at (1, 0)
	TEST_ASSERT_TRUE(move_tile(1, 0, 1, -1));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, 1, -1));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, 0, -1));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -1, -1)); memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -2, -1)); memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -3, 0));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -3, 1));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -2, 1));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -1, 1));  memcpy(game, &proto, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, 0, 1));   memcpy(game, &proto, sizeof proto);

	TEST_ASSERT_FALSE(move_tile(1, 0, 1, 0));
	TEST_ASSERT_FALSE(move_tile(1, 0, 3, 7));
}

void test_respects_freedom_to_move(void)
{
	(void)init_game();

	// setup the space for an illegal freedom to move
	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(1, -1, PIECE_TYPE_GRASSHOPPER);
	place_tile(-1, -1, PIECE_TYPE_GRASSHOPPER);
	place_tile(1, -2, PIECE_TYPE_GRASSHOPPER);
	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT);
	place_tile(1, 0, PIECE_TYPE_GRASSHOPPER);

	// try and pull off the illegal move violating freedom to move
	TEST_ASSERT_FALSE(move_tile(-2, 0, 0, -1));
}

void test_one_hive_rule(void)
{
	Game *game = init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT));

	TEST_ASSERT_FALSE_MESSAGE(move_tile(0, 0, 1, -1), "Allowed one-hive rule violation");

	TEST_ASSERT_TRUE(move_tile(1, 0, 1, -1));

	TEST_ASSERT_FALSE_MESSAGE(move_tile(-1, 0, -2, -1), "Allowed one-hive rule violation");

	TEST_ASSERT_TRUE(move_tile(-2, 0, -2, 1));

	Tile expected_tiles[] = {
		{ .piece_type = PIECE_TYPE_QUEEN_BEE,   .position = { 0, 0 },  .color = COLOR_BLACK },
		{ .piece_type = PIECE_TYPE_QUEEN_BEE,   .position = { -1, 0 }, .color = COLOR_WHITE },
		{ .piece_type = PIECE_TYPE_SOLDIER_ANT, .position = { 1, -1 }, .color = COLOR_BLACK },
		{ .piece_type = PIECE_TYPE_SOLDIER_ANT, .position = { -2, 1 }, .color = COLOR_WHITE },
	};
	const size_t expected_tiles_len = sizeof expected_tiles / sizeof (Tile);

	TEST_ASSERT_EQUAL(expected_tiles_len, game->tiles_len);
	TEST_ASSERT_EQUAL(0, memcmp(game->tiles, expected_tiles, sizeof expected_tiles));
}

void test_cannot_move_pieces_of_opposite_color(void)
{
	(void)init_game();

	place_tile(0, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(1, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(-2, 0, PIECE_TYPE_QUEEN_BEE);

	TEST_ASSERT_FALSE_MESSAGE(move_tile(-2, 0, -2, 1), "Allowed black to move a white piece");
}

void test_move_queen_bee(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_QUEEN_BEE));

	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, -3, 0), "Allowed queen to move more than one tile");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, 2, 0), "Allowed queen to move off the hive");
	TEST_ASSERT_TRUE_MESSAGE(move_tile(1, 0, 1, -1), "Did not allow valid queen move");
}

void test_move_grasshopper(void)
{
	Game *game = init_game();

	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT);
	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT);
	place_tile(0, 1, PIECE_TYPE_GRASSHOPPER);

	move_tile(-2, 0, -1, 1);

	Game proto = *game;

	TEST_ASSERT_FALSE_MESSAGE(move_tile(0, 1, 1, 1),  "Falsely allowed grasshopper to move to adjacent tile");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(0, 1, -1, 2), "Falsely allowed grasshopper to move to adjacent tile");
	TEST_ASSERT_TRUE_MESSAGE(move_tile(0, 1, 0, -1),  "Failed to allow to move grasshopper legally");

	*game = proto;
	TEST_ASSERT_TRUE_MESSAGE(move_tile(0, 1, 2, -1), "Failed to allow to move grasshopper legally");

	*game = proto;
	TEST_ASSERT_TRUE_MESSAGE(move_tile(0, 1, -2, 1), "Failed to allow to move grasshopper legally");
}

void test_move_spider(void)
{
	Game *game = init_game();
	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(1, 0, PIECE_TYPE_SPIDER);
	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT);
	Game proto = *game;

	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, 1, -1),  "Falsely allowed spider to move one space");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, 0, 1),   "Falsely allowed spider to move one space");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, 0, -1),  "Falsely allowed spider to move two spaces");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, -1, 1),  "Falsely allowed spider to move two spaces");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, -2, -1), "Falsely allowed spider to move four spaces");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, -3, 1),  "Falsely allowed spider to move four spaces");

	TEST_ASSERT_TRUE_MESSAGE(move_tile(1, 0, -2, 1),   "Would not let spider move three spaces");

	*game = proto;

	TEST_ASSERT_TRUE_MESSAGE(move_tile(1, 0, -1, -1),  "Would not let spider move three spaces");
}

void test_move_beetle(void)
{
	const Game example_from_rulebook_p4 = {
		.color_to_move = COLOR_WHITE,
		.move = 6,
		.tiles_len = 6,
		.tiles = {
			{ .color = COLOR_WHITE, .position = { 1, -1}, .piece_type = PIECE_TYPE_BEETLE      },
			{ .color = COLOR_WHITE, .position = { 0,  0}, .piece_type = PIECE_TYPE_SOLDIER_ANT },
			{ .color = COLOR_WHITE, .position = { 0, -1}, .piece_type = PIECE_TYPE_SPIDER      },
			{ .color = COLOR_WHITE, .position = {-1,  0}, .piece_type = PIECE_TYPE_QUEEN_BEE   },
			{ .color = COLOR_BLACK, .position = { 0,  1}, .piece_type = PIECE_TYPE_QUEEN_BEE   },
			{ .color = COLOR_BLACK, .position = { 1,  1}, .piece_type = PIECE_TYPE_GRASSHOPPER },
		},
	};

	Game *game = init_game();

	*game = example_from_rulebook_p4;
	TEST_ASSERT_TRUE(move_tile(1, -1, 0, 0));  *game = example_from_rulebook_p4;
	TEST_ASSERT_TRUE(move_tile(1, -1, 1, 0));  *game = example_from_rulebook_p4;
	TEST_ASSERT_TRUE(move_tile(1, -1, 0, -1)); *game = example_from_rulebook_p4;
	TEST_ASSERT_TRUE(move_tile(1, -1, 1, -2)); *game = example_from_rulebook_p4;

	TEST_ASSERT_FALSE(move_tile(1, -1, 2, 0));
	TEST_ASSERT_FALSE(move_tile(1, -1, 0, -2));
}

void test_move_ladybug(void)
{
	const Game example_from_rulebook_p7 = {
		.color_to_move = COLOR_WHITE,
		.move = 6,
		.tiles_len = 6,
		.tiles = {
			{.color = COLOR_BLACK, .position = {0, 0},   .piece_type = PIECE_TYPE_BEETLE},
			{.color = COLOR_BLACK, .position = {0, -2},  .piece_type = PIECE_TYPE_QUEEN_BEE},
			{.color = COLOR_WHITE, .position = {-1, 0},  .piece_type = PIECE_TYPE_BEETLE},
			{.color = COLOR_WHITE, .position = {-1, -1}, .piece_type = PIECE_TYPE_GRASSHOPPER},
			{.color = COLOR_WHITE, .position = {1, -1},  .piece_type = PIECE_TYPE_QUEEN_BEE},
			{.color = COLOR_WHITE, .position = {-1, 1},  .piece_type = PIECE_TYPE_LADYBUG},
		},
	};

	Game *game = init_game();
	*game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -2, 0));  *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -2, 1));  *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -2, -1)); *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -1, -2)); *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 0, -1));  *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 1, -2));  *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 2, -2));  *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 2, -1));  *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 1, 0));   *game = example_from_rulebook_p7;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 0, 1));   *game = example_from_rulebook_p7;

	TEST_ASSERT_FALSE(move_tile(-1, 1, 0, -3));
	TEST_ASSERT_FALSE(move_tile(-1, 1, 1, -3));
	TEST_ASSERT_FALSE(move_tile(-1, 1, -1, 2));
	TEST_ASSERT_FALSE(move_tile(-1, 1, -2, 2));
}

void test_move_mosquito(void)
{
	const Game example_from_rulebook_p8 = {
		.color_to_move = COLOR_WHITE,
		.move = 6,
		.tiles_len = 5,
		.tiles = {
			{ .color = COLOR_WHITE, .position = {0, 0},  .piece_type = PIECE_TYPE_BEETLE },
			{ .color = COLOR_WHITE, .position = {1, 0},  .piece_type = PIECE_TYPE_QUEEN_BEE },
			{ .color = COLOR_WHITE, .position = {-1, 1}, .piece_type = PIECE_TYPE_MOSQUITO },
			{ .color = COLOR_BLACK, .position = {-1, 0}, .piece_type = PIECE_TYPE_SPIDER },
			{ .color = COLOR_BLACK, .position = {1, -1}, .piece_type = PIECE_TYPE_QUEEN_BEE },
		},
	};

	Game *game = init_game();

	*game = example_from_rulebook_p8;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 0, 0));   *game = example_from_rulebook_p8;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -1, 0));  *game = example_from_rulebook_p8;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -1, -1)); *game = example_from_rulebook_p8;
	TEST_ASSERT_TRUE(move_tile(-1, 1, -2, 1));  *game = example_from_rulebook_p8;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 0, 1));   *game = example_from_rulebook_p8;
	TEST_ASSERT_TRUE(move_tile(-1, 1, 2, 0));   *game = example_from_rulebook_p8;

	TEST_ASSERT_FALSE(move_tile(-1, 1, -2, 0));
	TEST_ASSERT_FALSE(move_tile(-1, 1, 0, -1));
	TEST_ASSERT_FALSE(move_tile(-1, 1, 2, -1));
	TEST_ASSERT_FALSE(move_tile(-1, 1, 1, 0));
}

void test_beetle_stack(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_QUEEN_BEE));

	TEST_ASSERT_TRUE(place_tile(1, -1, PIECE_TYPE_BEETLE));
	TEST_ASSERT_TRUE(place_tile(-2, 1, PIECE_TYPE_BEETLE));

	TEST_ASSERT_TRUE(move_tile(1, -1, 0, 0));
	TEST_ASSERT_TRUE(move_tile(-2, 1, -1, 0));

	TEST_ASSERT_TRUE(move_tile(0, 0, -1, 0));

	TEST_ASSERT_TRUE(place_tile(-3, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE_MESSAGE(place_tile(0, -1, PIECE_TYPE_SPIDER), "Failure to place next to a beetle stack with same color on top");

	TEST_ASSERT_FALSE_MESSAGE(move_tile(-1, 0, 0, 0), "Tried to move beetle under top of stack");
}

void test_stack_heights_are_updated(void)
{
	Game *game = init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_BEETLE));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_BEETLE));

	move_tile(1, 0, 0, 0);

	TEST_ASSERT_TRUE_MESSAGE(game->tiles[2].stack_height == 1, "The beetle should have had its stack height updated");

	TEST_ASSERT_EQUAL(0, game->tiles[0].stack_height);
	TEST_ASSERT_EQUAL(0, game->tiles[1].stack_height);
	TEST_ASSERT_EQUAL(0, game->tiles[3].stack_height);
}

void test_stack_mosquitos(void)
{
	Game *game = init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_BEETLE));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_MOSQUITO));

	TEST_ASSERT_TRUE(move_tile(1, 0, 0, 0));
	TEST_ASSERT_TRUE(move_tile(-2, 0, -1, -1));
	TEST_ASSERT_TRUE(move_tile(0, 0, -1, 0));

	TEST_ASSERT_TRUE_MESSAGE(move_tile(-1, -1, -1, 0), "Failed to let mosquito behave like a beetle");

	TEST_ASSERT_EQUAL_MESSAGE(2, game->tiles[3].stack_height, "Did not stack the mosquito on top of the beetle");
}

void test_once_mosquitos_are_stacked_they_are_beetles(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_BEETLE));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_MOSQUITO));

	TEST_ASSERT_TRUE(move_tile(1, 0, 0, 0));
	TEST_ASSERT_TRUE(move_tile(-2, 0, -1, -1));
	TEST_ASSERT_TRUE(move_tile(0, 0, -1, 0));
	TEST_ASSERT_TRUE(move_tile(-1, -1, -1, 0));
	TEST_ASSERT_TRUE(move_tile(0, 0, -1, 1));
	TEST_ASSERT_TRUE(move_tile(-1, 0, -1, 1));
}

void test_cannot_hop_across_gaps(void)
{
	(void)init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-1, 1, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT));
	TEST_ASSERT_TRUE(place_tile(-1, 2, PIECE_TYPE_SPIDER));
	TEST_ASSERT_TRUE(place_tile(1, 1, PIECE_TYPE_BEETLE));
	TEST_ASSERT_TRUE(place_tile(-2, 2, PIECE_TYPE_SOLDIER_ANT));

	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 1, 0, 2), "Allowed hopping across a gap in a single move");
}

void test_pin_queen_and_surround(void)
{
	Game *game = init_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));  // Black, move 1
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE)); // White, move 1
	TEST_ASSERT_TRUE(place_tile(1, -1, PIECE_TYPE_BEETLE));    // Black, move 2
	TEST_ASSERT_TRUE(move_tile(-1, 0, 0, -1));                 // White, move 2
	TEST_ASSERT_TRUE(move_tile(1, -1, 0, -1));                 // Black, move 3

	TEST_ASSERT_EQUAL_MESSAGE(COMPLETION_STATE_INCOMPLETE, completion_state(), "Game was declared as over too early");
	
	TEST_ASSERT_EQUAL_MESSAGE(COLOR_BLACK, game->color_to_move, "Did not skip white's move, though white had no available moves");
	TEST_ASSERT_EQUAL_MESSAGE(4, game->move, "Did not skip white's move, though white had no available moves");
	
	TEST_ASSERT_TRUE(place_tile(1, -1, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
	TEST_ASSERT_TRUE(place_tile(-1, -1, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER));
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
	TEST_ASSERT_TRUE(place_tile(0, -2, PIECE_TYPE_SOLDIER_ANT));
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
	TEST_ASSERT_TRUE(place_tile(1, -2, PIECE_TYPE_SOLDIER_ANT));
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
	
	TEST_ASSERT_EQUAL_MESSAGE(
			COMPLETION_STATE_BLACK_WON,
			completion_state(),
			"Black must have won a game wherein white's queen is surrounded");
}

void test_get_legal_placements_basic(void)
{
	(void)init_game();
	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);

	Vec2 placements[MAX_MOVES];
	const int placements_len = legal_placements(placements);

	TEST_ASSERT_EQUAL(6, placements_len);
	const Vec2 adjacents[6] = {
		{0, -1},
		{1, -1},
		{1, 0},
		{0, 1},
		{-1, 1},
		{-1, 0},
	};
	for (int i = 0; i < 6; i++) {
		bool found = false;
		for (int j = 0; j < 6; j++) {
			if (!memcmp(&adjacents[i], &placements[j], sizeof (Vec2))) {
				found = true;
				break;
			}
		}
		TEST_ASSERT_TRUE_MESSAGE(found, "must find each tile adjacent to the first in the output");
	}
}

int main(void)
{
	UNITY_BEGIN();
	RUN_TEST(test_create_game);
	RUN_TEST(test_places_the_first_piece);
	RUN_TEST(test_alternates_between_black_and_white);
	RUN_TEST(test_cannot_place_pieces_atop_others);
	RUN_TEST(test_ensures_queen_placed_by_move4);
	RUN_TEST(test_cannot_place_more_pieces_than_player_has);
	RUN_TEST(test_follows_adjacency_rules_for_placement);
	RUN_TEST(test_cannot_move_before_queen_placed);
	RUN_TEST(test_move_ant_around_the_hive);
	RUN_TEST(test_respects_freedom_to_move);
	RUN_TEST(test_one_hive_rule);
	RUN_TEST(test_cannot_move_pieces_of_opposite_color);
	RUN_TEST(test_move_queen_bee);
	RUN_TEST(test_move_grasshopper);
	RUN_TEST(test_move_spider);
	RUN_TEST(test_move_beetle);
	RUN_TEST(test_move_ladybug);
	RUN_TEST(test_move_mosquito);
	RUN_TEST(test_beetle_stack);
	RUN_TEST(test_stack_heights_are_updated);
	RUN_TEST(test_stack_mosquitos);
	RUN_TEST(test_once_mosquitos_are_stacked_they_are_beetles);
	RUN_TEST(test_cannot_hop_across_gaps);
	RUN_TEST(test_pin_queen_and_surround);
	RUN_TEST(test_get_legal_placements_basic);
	return UNITY_END();
}

