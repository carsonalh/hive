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

void test_create_hive_game()
{
	Game *game = create_hive_game();

	TEST_ASSERT_EQUAL(1, game->move);
	TEST_ASSERT_EQUAL(0, game->tiles_len);
	TEST_ASSERT_EQUAL(COLOR_BLACK, game->color_to_move);
}

void test_places_the_first_piece(void)
{
	Game *game = create_hive_game();

	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);
	TEST_ASSERT_EQUAL(1, game->tiles_len);
}

void test_alternates_between_black_and_white(void)
{
	Game *game = create_hive_game();

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
	create_hive_game();

	TEST_ASSERT_TRUE_MESSAGE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER), "Falsely flagged bad placement for initial Move");
	TEST_ASSERT_FALSE_MESSAGE(place_tile(0, 0, PIECE_TYPE_BEETLE), "Cannot place tiles atop other tiles");
}

void test_ensures_queen_placed_by_move4(void)
{
	(void)create_hive_game();

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
	(void)create_hive_game();

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
	(void)create_hive_game();

	TEST_ASSERT_TRUE_MESSAGE(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER), "First Move need not follow the normal rules");
	TEST_ASSERT_TRUE_MESSAGE(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER), "Second Move need not follow the normal rules");

	TEST_ASSERT_FALSE_MESSAGE(place_tile(0, -1, PIECE_TYPE_GRASSHOPPER), "Should not be able to place a piece that touches the opposite Color");
	// this touches nothing
	TEST_ASSERT_FALSE_MESSAGE(place_tile(0, 2, PIECE_TYPE_GRASSHOPPER), "A piece must be touching one if its own");
}

void test_move_ant_around_the_hive(void)
{
	Game *game = create_hive_game();
	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE);    // black
	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE);   // white
	place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT);  // black
	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT); // white

	Game proto;
	memcpy(&proto, game, sizeof proto);

	// black ant starts at (1, 0)
	TEST_ASSERT_TRUE(move_tile(1, 0, 1, -1));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, 1, -1));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, 0, -1));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -1, -1)); memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -2, -1)); memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -3, 0));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -3, 1));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -2, 1));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, -1, 1));  memcpy(&proto, game, sizeof proto);
	TEST_ASSERT_TRUE(move_tile(1, 0, 0, 1));   memcpy(&proto, game, sizeof proto);

	TEST_ASSERT_FALSE(move_tile(1, 0, 1, 0));
	TEST_ASSERT_FALSE(move_tile(1, 0, 3, 7));
}

void test_respects_freedom_to_move(void)
{
	(void)create_hive_game();

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
	Game *game = create_hive_game();

	TEST_ASSERT_TRUE(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE));
	TEST_ASSERT_TRUE(place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT));
	TEST_ASSERT_TRUE(place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT));

	TEST_ASSERT_FALSE_MESSAGE(move_tile(0, 0, 1, -1), "Allowed one-hive rule violation");

	TEST_ASSERT_TRUE(move_tile(1, 0, 1, -1));

	TEST_ASSERT_FALSE_MESSAGE(move_tile(-2, 0, -2, -1), "Allowed one-hive rule violation");

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
	(void)create_hive_game();

	place_tile(0, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(1, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(-2, 0, PIECE_TYPE_QUEEN_BEE);

	TEST_ASSERT_FALSE_MESSAGE(move_tile(-2, 0, -2, 1), "Allowed black to move a white piece");
}

void test_move_queen_bee(void)
{
	(void)create_hive_game();

	place_tile(0, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER);
	place_tile(1, 0, PIECE_TYPE_QUEEN_BEE);
	place_tile(-2, 0, PIECE_TYPE_QUEEN_BEE);

	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, -3, 0), "Allowed queen to move more than one tile");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, 2, 0), "Allowed queen to move off the hive");
	TEST_ASSERT_FALSE_MESSAGE(move_tile(1, 0, 1, -1), "Did not allow valid queen move");
}

void test_move_spider(void)
{
	// initGame := void() HiveGame {
	// 	game := CreateHiveGame()
	//
	// 	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE)
	// 	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE)
	// 	place_tile(1, 0, PIECE_TYPE_SPIDER)
	// 	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT)
	//
	// 	return game
	// }
	//
	// var ok bool
	// game := initGame()
	// ok = game.MoveTile(1, 0, 1, -1)
	// if ok {
	// 	t.Fatalf("Falsely allowed spider to move one space")
	// }
	// ok = game.MoveTile(1, 0, 0, 1)
	// if ok {
	// 	t.Fatalf("Falsely allowed spider to move one space")
	// }
	// ok = game.MoveTile(1, 0, 0, -1)
	// if ok {
	// 	t.Fatalf("Falsely allowed spider to move two spaces")
	// }
	// ok = game.MoveTile(1, 0, -1, 1)
	// if ok {
	// 	t.Fatalf("Falsely allowed spider to move two spaces")
	// }
	// ok = game.MoveTile(1, 0, -2, -1)
	// if ok {
	// 	t.Fatalf("Falsely allowed spider to move four spaces")
	// }
	// ok = game.MoveTile(1, 0, -3, 1)
	// if ok {
	// 	t.Fatalf("Falsely allowed spider to move four spaces")
	// }
	//
	// ok = game.MoveTile(1, 0, -2, 1)
	// if !ok {
	// 	t.Fatalf("Would not let spider move three spaces")
	// }
	//
	// game = initGame()
	//
	// ok = game.MoveTile(1, 0, -1, -1)
	// if !ok {
	// 	t.Fatalf("Would not let spider move three spaces")
	// }
}

void test_move_grasshopper(void)
{
	// initGame := void() HiveGame {
	// 	game := CreateHiveGame()
	//
	// 	place_tile(0, 0, PIECE_TYPE_QUEEN_BEE)
	// 	place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE)
	// 	place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT)
	// 	place_tile(-2, 0, PIECE_TYPE_SOLDIER_ANT)
	// 	place_tile(0, 1, PIECE_TYPE_GRASSHOPPER)
	//
	// 	game.MoveTile(-2, 0, -1, 1)
	//
	// 	return game
	// }
	//
	// game := initGame()
	// if ok := game.MoveTile(0, 1, 1, 1); ok {
	// 	t.Fatalf("Falsely allowed grasshopper to move to adjacent tile")
	// }
	// if ok := game.MoveTile(0, 1, -1, 2); ok {
	// 	t.Fatalf("Falsely allowed grasshopper to move to adjacent tile")
	// }
	//
	// if ok := game.MoveTile(0, 1, 0, -1); !ok {
	// 	t.Fatalf("Failed to allow to move grasshopper legally")
	// }
	//
	// game = initGame()
	// if ok := game.MoveTile(0, 1, 2, -1); !ok {
	// 	t.Fatalf("Failed to allow to move grasshopper legally")
	// }
	//
	// game = initGame()
	// if ok := game.MoveTile(0, 1, -2, 1); !ok {
	// 	t.Fatalf("Failed to allow to move grasshopper legally")
	// }
}

void test_move_ladybug(void)
{
	// exampleFromRulebookP7 := void() HiveGame {
	// 	return HiveGame{
	// 		ColorToMove: ColorWhite,
	// 		Move:        6,
	// 		Tiles: []HiveTile{
	// 			{Color: ColorBlack, Position: 0, 0}, PieceType: PIECE_TYPE_BEETLE,
	// 			{Color: ColorBlack, Position: 0, -2}, PieceType: PIECE_TYPE_QUEEN_BEE,
	// 			{Color: ColorWhite, Position: -1, 0}, PieceType: PIECE_TYPE_BEETLE,
	// 			{Color: ColorWhite, Position: -1, -1}, PieceType: PIECE_TYPE_GRASSHOPPER,
	// 			{Color: ColorWhite, Position: 1, -1}, PieceType: PIECE_TYPE_QUEEN_BEE,
	// 			{Color: ColorWhite, Position: -1, 1}, PieceType: PIECE_TYPE_LADYBUG,
	// 		},
	// 	}
	// }
	//
	// ladybugPosition := -1, 1
	// legalMoves := []HexVectorInt{
	// 	{-2, 0},
	// 	{-2, 1},
	// 	{-2, -1},
	// 	{-1, -2},
	// 	{0, -1},
	// 	{1, -2},
	// 	{2, -2},
	// 	{2, -1},
	// 	{1, 0},
	// 	{0, 1},
	// }
	//
	// illegalMoves := []HexVectorInt{
	// 	{0, -3},
	// 	{1, -3},
	// 	{-1, 2},
	// 	{-2, 2},
	// }
	//
	// for _, legalMove := range legalMoves {
	// 	game := exampleFromRulebookP7()
	//
	// 	if ok := game.MoveTile(ladybugPosition, legalMove); !ok {
	// 		t.Fatalf("Did not allow legal move from %v to %v", ladybugPosition, legalMove)
	// 	}
	// }
	//
	// game := exampleFromRulebookP7()
	// for _, illegalMove := range illegalMoves {
	// 	if ok := game.MoveTile(ladybugPosition, illegalMove); ok {
	// 		t.Fatalf("Incorrectly allowed illegal move from %v to %v", ladybugPosition, illegalMove)
	// 	}
	// }
}

void test_move_beetle(void)
{
	// exampleFromRulebookP4 := void() HiveGame {
	// 	return HiveGame{
	// 		ColorToMove: ColorWhite,
	// 		Move:        6,
	// 		Tiles: []HiveTile{
	// 			{Color: ColorWhite, Position: 1, -1}, PieceType: PIECE_TYPE_BEETLE,
	// 			{Color: ColorWhite, Position: 0, 0}, PieceType: PIECE_TYPE_SOLDIER_ANT,
	// 			{Color: ColorWhite, Position: 0, -1}, PieceType: PIECE_TYPE_SPIDER,
	// 			{Color: ColorWhite, Position: -1, 0}, PieceType: PIECE_TYPE_QUEEN_BEE,
	// 			{Color: ColorBlack, Position: 0, 1}, PieceType: PIECE_TYPE_QUEEN_BEE,
	// 			{Color: ColorBlack, Position: 1, 1}, PieceType: PIECE_TYPE_GRASSHOPPER,
	// 		},
	// 	}
	// }
	//
	// legalMoves := []HexVectorInt{
	// 	{0, 0},
	// 	{1, 0},
	// 	{0, -1},
	// 	{1, -2},
	// }
	//
	// illegalMoves := []HexVectorInt{
	// 	{2, 0},
	// 	{0, -2},
	// }
	//
	// beetlePosition := 1, -1
	//
	// for _, legalMove := range legalMoves {
	// 	game := exampleFromRulebookP4()
	//
	// 	if ok := game.MoveTile(beetlePosition, legalMove); !ok {
	// 		t.Fatalf("did not allow legal move from %v to %v", beetlePosition, legalMove)
	// 	}
	// }
	//
	// game := exampleFromRulebookP4()
	// for _, illegalMove := range illegalMoves {
	// 	if ok := game.MoveTile(beetlePosition, illegalMove); ok {
	// 		t.Fatalf("Incorrectly allowed illegal move from %v to %v", beetlePosition, illegalMove)
	// 	}
	// }
}

void test_move_mosquito(void)
{
	// exampleFromRulebookP8 := void() HiveGame {
	// 	return HiveGame{
	// 		ColorToMove: ColorWhite,
	// 		Move:        6,
	// 		Tiles: []HiveTile{
	// 			{Color: ColorWhite, Position: 0, 0}, PieceType: PIECE_TYPE_BEETLE,
	// 			{Color: ColorWhite, Position: 1, 0}, PieceType: PIECE_TYPE_QUEEN_BEE,
	// 			{Color: ColorWhite, Position: -1, 1}, PieceType: PIECE_TYPE_MOSQUITO,
	// 			{Color: ColorBlack, Position: -1, 0}, PieceType: PIECE_TYPE_SPIDER,
	// 			{Color: ColorBlack, Position: 1, -1}, PieceType: PIECE_TYPE_QUEEN_BEE,
	// 		},
	// 	}
	// }
	//
	// legalMoves := []HexVectorInt{
	// 	{0, 0},
	// 	{-1, 0},
	// 	{-1, -1},
	// 	{-2, 1},
	// 	{0, 1},
	// 	{2, 0},
	// }
	//
	// illegalMoves := []HexVectorInt{
	// 	{-2, 0},
	// 	{0, -1},
	// 	{2, -1},
	// 	{1, 0},
	// }
	//
	// mosquitoPosition := -1, 1
	//
	// for _, legalMove := range legalMoves {
	// 	game := exampleFromRulebookP8()
	//
	// 	if ok := game.MoveTile(mosquitoPosition, legalMove); !ok {
	// 		t.Fatalf("Did not allow legal move from %v to %v", mosquitoPosition, legalMove)
	// 	}
	// }
	//
	// game := exampleFromRulebookP8()
	// for _, illegalMove := range illegalMoves {
	// 	if ok := game.MoveTile(mosquitoPosition, illegalMove); ok {
	// 		t.Fatalf("Incorrectly allowed illegal move from %v to %v", mosquitoPosition, illegalMove)
	// 	}
	// }
}

void test_beetle_stack(void)
{
	// expectLegal := void(ret bool) {
	// 	if !ret {
	// 		t.Fatalf("Incorrectly failed to make a legal move")
	// 	}
	// }
	//
	// game := CreateHiveGame()
	//
	// expectLegal(place_tile(0, 0, PIECE_TYPE_GRASSHOPPER))
	// expectLegal(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER))
	// expectLegal(place_tile(1, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(-2, 0, PIECE_TYPE_QUEEN_BEE))
	//
	// expectLegal(place_tile(1, -1, PIECE_TYPE_BEETLE))
	// expectLegal(place_tile(-2, 1, PIECE_TYPE_BEETLE))
	//
	// expectLegal(game.MoveTile(1, -1}, HexVectorInt{0, 0))
	// expectLegal(game.MoveTile(-2, 1}, HexVectorInt{-1, 0))
	//
	// expectLegal(game.MoveTile(0, 0}, HexVectorInt{-1, 0))
	//
	// expectLegal(place_tile(-3, 0, PIECE_TYPE_GRASSHOPPER))
	// if ok := place_tile(0, -1, PIECE_TYPE_SPIDER); !ok {
	// 	t.Fatalf("Failure to place next to a beetle stack with same color on top")
	// }
	//
	// if ok := game.MoveTile(-1, 0}, HexVectorInt{0, 0); ok {
	// 	t.Fatalf("Tried to move beetle under top of stack")
	// }
}

void test_stack_heights_are_updated(void)
{
	// game := CreateHiveGame()
	//
	// expectLegal := void(ret bool) {
	// 	if !ret {
	// 		t.Fatalf("Incorrectly failed to make a legal move")
	// 	}
	// }
	//
	// expectLegal(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(1, 0, PIECE_TYPE_BEETLE))
	// expectLegal(place_tile(-2, 0, PIECE_TYPE_BEETLE))
	//
	// game.MoveTile(1, 0}, HexVectorInt{0, 0)
	//
	// if game.Tiles[2].StackHeight != 1 {
	// 	t.Fatalf("The beetle should have had its stack height updated")
	// }
	//
	// for i := 0; i < 4; i++ {
	// 	if i != 2 && game.Tiles[i].StackHeight != 0 {
	// 		t.Fatalf("Some other tile at idx. %d has stack height %d", i, game.Tiles[i].StackHeight)
	// 	}
	// }
}

void test_stack_mosquitos(void)
{
	// game := CreateHiveGame()
	//
	// expectLegal := void(ret bool) {
	// 	if !ret {
	// 		t.Fatalf("Incorrectly failed to make a legal move")
	// 	}
	// }
	//
	// expectLegal(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(1, 0, PIECE_TYPE_BEETLE))
	// expectLegal(place_tile(-2, 0, PIECE_TYPE_MOSQUITO))
	//
	// expectLegal(game.MoveTile(1, 0}, HexVectorInt{0, 0))
	// expectLegal(game.MoveTile(-2, 0}, HexVectorInt{-1, -1))
	// expectLegal(game.MoveTile(0, 0}, HexVectorInt{-1, 0))
	//
	// if ok := game.MoveTile(-1, -1}, HexVectorInt{-1, 0); !ok {
	// 	t.Fatalf("Failed to let mosquito behave like a beetle")
	// }
	//
	// if game.Tiles[3].StackHeight != 2 {
	// 	t.Fatalf("Did not stack the mosquito on top of the beetle")
	// }
}

void test_once_mosquitos_are_stacked_they_are_beetles(void)
{
	// game := CreateHiveGame()
	//
	// expectLegal := void(ret bool) {
	// 	if !ret {
	// 		t.Fatalf("Incorrectly failed to make a legal move")
	// 	}
	// }
	//
	// expectLegal(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(1, 0, PIECE_TYPE_BEETLE))
	// expectLegal(place_tile(-2, 0, PIECE_TYPE_MOSQUITO))
	//
	// expectLegal(game.MoveTile(1, 0}, HexVectorInt{0, 0))
	// expectLegal(game.MoveTile(-2, 0}, HexVectorInt{-1, -1))
	// expectLegal(game.MoveTile(0, 0}, HexVectorInt{-1, 0))
	// expectLegal(game.MoveTile(-1, -1}, HexVectorInt{-1, 0))
	// expectLegal(game.MoveTile(0, 0}, HexVectorInt{-1, 1))
	// expectLegal(game.MoveTile(-1, 0}, HexVectorInt{-1, 1))
}

void test_cannot_hop_across_gaps(void)
{
	// game := CreateHiveGame()
	//
	// expectLegal := void(ret bool) {
	// 	if !ret {
	// 		t.Fatalf("Incorrectly failed to make a legal move")
	// 	}
	// }
	//
	// expectLegal(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE))
	// expectLegal(place_tile(-1, 1, PIECE_TYPE_GRASSHOPPER))
	// expectLegal(place_tile(1, 0, PIECE_TYPE_SOLDIER_ANT))
	// expectLegal(place_tile(-1, 2, PIECE_TYPE_SPIDER))
	// expectLegal(place_tile(1, 1, PIECE_TYPE_BEETLE))
	// expectLegal(place_tile(-2, 2, PIECE_TYPE_SOLDIER_ANT))
	//
	// if ok := game.MoveTile(1, 1}, HexVectorInt{0, 2); ok {
	// 	t.Fatalf("Allowed hopping across a gap in a single move")
	// }
}

void test_pin_queen_and_surround(void)
{
	// game := CreateHiveGame()
	//
	// expectLegal := void(ret bool) {
	// 	if !ret {
	// 		t.Fatalf("Incorrectly failed to make a legal move")
	// 	}
	// }
	//
	// expectLegal(place_tile(0, 0, PIECE_TYPE_QUEEN_BEE))   // Black, move 1
	// expectLegal(place_tile(-1, 0, PIECE_TYPE_QUEEN_BEE))  // White, move 1
	// expectLegal(place_tile(1, -1, PIECE_TYPE_BEETLE))    // Black, move 2
	// expectLegal(game.MoveTile(-1, 0}, HexVectorInt{0, -1)) // White, move 2
	// expectLegal(game.MoveTile(1, -1}, HexVectorInt{0, -1)) // Black, move 3
	//
	// if over, _ := game.IsOver(); over {
	// 	t.Fatalf("Game being declared as over too early")
	// }
	//
	// if game.ColorToMove != ColorBlack || game.Move != 4 {
	// 	t.Fatalf("Did not skip white's move, though white had no available moves")
	// }
	//
	// expectLegal(place_tile(1, -1, PIECE_TYPE_GRASSHOPPER))
	// if game.ColorToMove != ColorBlack {
	// 	t.Error("Expected ColorToMove to be black")
	// }
	// expectLegal(place_tile(-1, -1, PIECE_TYPE_GRASSHOPPER))
	// if game.ColorToMove != ColorBlack {
	// 	t.Error("Expected ColorToMove to be black")
	// }
	// expectLegal(place_tile(-1, 0, PIECE_TYPE_GRASSHOPPER))
	// if game.ColorToMove != ColorBlack {
	// 	t.Error("Expected ColorToMove to be black")
	// }
	// expectLegal(place_tile(0, -2, PIECE_TYPE_SOLDIER_ANT))
	// if game.ColorToMove != ColorBlack {
	// 	t.Error("Expected ColorToMove to be black")
	// }
	// expectLegal(place_tile(1, -2, PIECE_TYPE_SOLDIER_ANT))
	// if game.ColorToMove != ColorBlack {
	// 	t.Error("Expected ColorToMove to be black")
	// }
	//
	// if over, winner := game.IsOver(); !over {
	// 	t.Fatalf("Game with surrounded queen must be over")
	// } else if winner != ColorBlack {
	// 	t.Fatalf("Black must be the winner of a game wherein white's queen is surrounded")
	// }
}

void test_get_legal_placements_basic(void)
{
	// game := CreateHiveGame()
	// place_tile(0, 0, PIECE_TYPE_QUEEN_BEE)
	//
	// placementsMap := game.LegalPlacements()
	//
	// placements := make([]HexVectorInt, 0, 6)
	// for pos := range placementsMap {
	// 	placements = append(placements, pos)
	// }
	//
	// if len(placements) != 6 {
	// 	t.Errorf("Expected 6 legal placements but got %d", len(placements))
	// }
	//
	// expectedPlacements := 0, 0.AdjacentVectors()
	//
	// for _, p := range expectedPlacements {
	// 	found := false
	//
	// 	for _, q := range placements {
	// 		if p == q {
	// 			found = true
	// 			break
	// 		}
	// 	}
	//
	// 	if !found {
	// 		t.Errorf("Expected to find move %v but did not", p)
	// 	}
	// }
}

int main(void)
{
	UNITY_BEGIN();
	RUN_TEST(test_create_hive_game);
	RUN_TEST(test_places_the_first_piece);
	RUN_TEST(test_alternates_between_black_and_white);
	RUN_TEST(test_cannot_place_pieces_atop_others);
	RUN_TEST(test_ensures_queen_placed_by_move4);
	RUN_TEST(test_cannot_place_more_pieces_than_player_has);
	RUN_TEST(test_follows_adjacency_rules_for_placement);
	RUN_TEST(test_move_ant_around_the_hive);
	RUN_TEST(test_respects_freedom_to_move);
	RUN_TEST(test_one_hive_rule);
	RUN_TEST(test_cannot_move_pieces_of_opposite_color);
	RUN_TEST(test_move_queen_bee);
	RUN_TEST(test_move_spider);
	RUN_TEST(test_move_grasshopper);
	RUN_TEST(test_move_ladybug);
	RUN_TEST(test_move_beetle);
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

