package main

// #include "../core/hive.c"
import "C"

import "runtime"

type HiveColor = int
type HivePieceType = int
type HiveCompletionState = int

type HiveGame struct {
	game *C.Game
}

const ColorBlack = C.COLOR_BLACK
const ColorWhite = C.COLOR_WHITE

const PieceTypeQueenBee    = C.PIECE_TYPE_QUEEN_BEE
const PieceTypeSoldierAnt  = C.PIECE_TYPE_SOLDIER_ANT
const PieceTypeGrasshopper = C.PIECE_TYPE_GRASSHOPPER
const PieceTypeSpider      = C.PIECE_TYPE_SPIDER
const PieceTypeBeetle      = C.PIECE_TYPE_BEETLE
const PieceTypeLadybug     = C.PIECE_TYPE_LADYBUG
const PieceTypeMosquito    = C.PIECE_TYPE_MOSQUITO

const MaxTiles = C.MAX_TILES
const MaxMoves = C.MAX_MOVES

const CompletionStatIncomplete = C.COMPLETION_STATE_INCOMPLETE
const CompletionStatBlackWon   = C.COMPLETION_STATE_BLACK_WON
const CompletionStatWhiteWon   = C.COMPLETION_STATE_WHITE_WON
const CompletionStatDraw       = C.COMPLETION_STATE_DRAW

type Vec2 = C.Vec2

func createHiveGame() *HiveGame {
	game := C.game_create()
	// This allows the garbage collector to call our custom free function for
	// game
	// While 'game' is one contiguous allocation, this allows the user of this
	// to treat a HiveGame as a Go object more than a C allocation
	hiveGame := &HiveGame { game }
	runtime.SetFinalizer(hiveGame, func (hg *HiveGame) {
		C.game_free(hg.game)
	})
	return hiveGame
}

func (game *HiveGame) moveTile(from, to Vec2) bool {
	return bool(C.game_move_tile(game.game, from.q, from.r, to.q, to.r))
}

func (game *HiveGame) placeTile(pos Vec2, pieceType HivePieceType) bool {
	return bool(C.game_place_tile(game.game, pos.q, pos.r, C.int32_t(pieceType)))
}

func (game *HiveGame) isOver() (bool, HiveColor) {
	switch C.game_completion_state(game.game) {
		case CompletionStatIncomplete:
			return false, 0
		case CompletionStatBlackWon:
			return true, ColorBlack
		case CompletionStatWhiteWon:
			return true, ColorWhite
		case CompletionStatDraw:
			// TODO handle this
			return false, 0
		default:
			panic("unreachable")
	}
}

