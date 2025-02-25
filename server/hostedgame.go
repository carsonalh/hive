package main

import (
	"github.com/gorilla/websocket"
	"sync"
	"time"
)

type HostedGameState struct {
	// Mapping of the game id string to a *HostedGame
	games sync.Map
}

type HostedGame struct {
	whitePlayer           uint64
	whiteConn             *websocket.Conn
	blackPlayer           uint64
	blackConn             *websocket.Conn
	whiteLastDisconnected *time.Time
	blackLastDisconnected *time.Time
	disconnectMutex       sync.Mutex
	onDisconnect          chan HiveColor
	shutdown              chan struct{}
	hiveGame              *HiveGame
	condition             *sync.Cond
}

func NewHostedGame() *HostedGame {
	return &HostedGame{
		hiveGame:     createHiveGame(),
		condition:    sync.NewCond(&sync.Mutex{}),
		onDisconnect: make(chan HiveColor, 1),
		shutdown:     make(chan struct{}, 1),
	}
}

// RecordMove returns true if the move was legal
func (hg *HostedGame) RecordMove(move *HiveMove) bool {
	var success = false

	switch move.MoveType {
	case MoveTypeMovement:
		success = hg.hiveGame.moveTile(move.Movement.From, move.Movement.To)
	case MoveTypePlacement:
		success = hg.hiveGame.placeTile(move.Placement.Position, move.Placement.PieceType)
	}

	return success
}

func (hg *HostedGame) IsOver() (bool, HiveColor) {
	return hg.hiveGame.isOver()
}

