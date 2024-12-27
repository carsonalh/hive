import {SERVER_HOSTNAME, WEBSOCKET_HOSTNAME} from 'configuration';
import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import {HexVector} from "./hex-grid";

export type Move = {
    moveType: "PLACE",
    position: HexVector,
    pieceType: HivePieceType,
} | {
    moveType: "MOVE",
    from: HexVector,
    to: HexVector,
};

export default class OnlineClient {
    private session: {
        token: string,
        game: {
            id: string,
            socket: WebSocket,
            color: HiveColor,
            /** Used as a buffer for if a receive picks up the client late. */
            lastReceivedMove?: Move,
        } | null,
    } | null = null;
    private readonly receiveMoveHandlers: ((move: Move) => unknown)[] = [];
    private readonly connectHandlers: ((color: HiveColor) => unknown)[] = [];
    private readonly connectionCloseHandlers: (() => unknown)[] = [];
    private readonly opponentDisconnectHandlers: (() => unknown)[] = [];
    private readonly opponentReconnectHandlers: (() => unknown)[] = [];
    private readonly gameCompletedHandlers: ((won: boolean) => unknown)[] = [];

    public constructor() {
    }

    public addReceiveMoveHandler(handler: (move: Move) => unknown): void {
        this.receiveMoveHandlers.push(handler)

        if (this.session?.game?.lastReceivedMove != null) {
            handler(this.session?.game?.lastReceivedMove);
        }
    }

    public addConnectHandler(handler: (color: HiveColor) => unknown): void {
        this.connectHandlers.push(handler)
    }

    public addConnectionCloseHandler(handler: () => unknown): void {
        this.connectionCloseHandlers.push(handler)
    }

    public addOpponentDisconnectHandler(handler: () => unknown): void {
        this.opponentDisconnectHandlers.push(handler)
    }

    public addOpponentReconnectHandler(handler: () => unknown): void {
        this.opponentReconnectHandlers.push(handler)
    }

    public addGameCompletedHandler(handler: (won: boolean) => unknown): void {
        this.gameCompletedHandlers.push(handler)
    }

    public async join(): Promise<void> {
        const response = await fetch(`${SERVER_HOSTNAME}/join`);
        const json = await response.json();
        this.session = {
            token: json.token,
            game: null,
        };
    }

    /**
     * Returns the id of the created game.
     */
    public async createPvpGame(): Promise<string> {
        if (this.session == null) {
            throw new Error('cannot create a pvp game before a session has been initialised')
        }

        const response = await fetch(`${SERVER_HOSTNAME}/hosted-game/new`, {
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${this.session.token}`
            },
        });
        if (response.status !== 200) {
            throw new Error(`got status ${response.status} from the server trying to create a new hosted game`)
        }
        const json = await response.json();
        const id = json.id as string;

        this.joinPvpGame(id);

        return id;
    }

    /**
     * Join a pvp game.
     * @param id The id of the game to join
     */
    public joinPvpGame(id: string): void {
        if (this.session == null) {
            throw new Error('cannot join a pvp game without having authenticated first');
        }

        const socket = new WebSocket(`${WEBSOCKET_HOSTNAME}/hosted-game/play?id=${id}`);

        this.session.game = {
            id,
            socket,
            color: HiveColor.Black,
        };

        socket.addEventListener('open', () => {
            socket.send(JSON.stringify({
                event: 'AUTHENTICATE',
                token: this.session!.token,
            }));
        });

        socket.addEventListener('close', () => {
            for (const handler of this.connectionCloseHandlers) {
                handler();
            }
        });

        socket.addEventListener('message', event => {
            this.onMessage(event.data);
        });
    }

    public placeTile(pieceType: HivePieceType, position: HexVector) {
        const pieceTypeMap = HiveGame.internalPieceTypeMap();

        const game = this.session?.game;
        if (game == null) {
            throw new Error('cannot place a piece when no current game is active');
        }

        game.socket.send(JSON.stringify({
            event: "PLAY_MOVE",
            move: {
                moveType: "PLACE",
                placement: {
                    pieceType: pieceTypeMap[pieceType],
                    position: position.json(),
                },
            },
        }))
    }

    public moveTile(from: HexVector, to: HexVector) {
        const game = this.session?.game;
        if (game == null) {
            throw new Error('cannot place a piece when no current game is active');
        }

        game.socket.send(JSON.stringify({
            event: "PLAY_MOVE",
            move: {
                moveType: "MOVE",
                movement: {
                    from: from.json(),
                    to: to.json(),
                },
            },
        }))
    }

    public close(): void {
        this.session?.game?.socket.close();
    }

    color(): HiveColor {
        let color: HiveColor | undefined
        if ((color = this.session?.game?.color) == null) {
            throw new Error('cannot access color while there is no active game');
        }

        return color;
    }

    hasActiveGame(): boolean {
        return this.session?.game != null;
    }

    private onMessage(message: string) {
        if (this.session == null || this.session.game == null) {
            throw new Error('invalid state, cannot receive a message while no session/game is open');
        }

        let response: any;

        try {
            response = JSON.parse(message)
        } catch (e) {
            throw new Error('received invalid json response from server');
        }

        // TODO validate the response object properly

        if (typeof response.event !== 'string') {
            throw new Error('received invalid json shape from server');
        }

        switch (response.event) {
            case "CONNECT": {
                const c: HiveColor = response.connect.color;
                this.session.game.color = c;
                for (const handler of this.connectHandlers) {
                    handler(c);
                }
                break;
            }
            case "PLAY_MOVE":
                switch (response.move.moveType) {
                    case "MOVE": {
                        const from = new HexVector(response.move.movement.from.q, response.move.movement.from.r);
                        const to = new HexVector(response.move.movement.to.q, response.move.movement.to.r);
                        const move = {
                            moveType: "MOVE",
                            from,
                            to,
                        } as const;
                        for (const handler of this.receiveMoveHandlers) {
                            handler(move);
                        }
                        this.session.game.lastReceivedMove = move;
                        break;
                    }
                    case "PLACE": {
                        const internalPieceType: number = response.move.placement.pieceType;
                        let pieceType: HivePieceType | null = null;
                        for (const [key, value] of Object.entries(HiveGame.internalPieceTypeMap())) {
                            if (internalPieceType === value) {
                                pieceType = Number(key);
                                break;
                            }
                        }
                        if (pieceType == null) {
                            throw new Error('did not recognise piece type sent from server');
                        }
                        const position = new HexVector(response.move.placement.position.q, response.move.placement.position.r);
                        const move = {
                            moveType: "PLACE",
                            pieceType,
                            position,
                        } as const;
                        for (const handler of this.receiveMoveHandlers) {
                            handler(move);
                        }
                        this.session.game.lastReceivedMove = move;
                        break;
                    }
                }
                break;
            case "REJECT_MOVE":
                throw new Error('Either the server is lying or we gave an illegal move');
            case "DISCONNECT":
                for (const handler of this.opponentDisconnectHandlers) {
                    handler();
                }
                break;
            case "RECONNECT":
                for (const handler of this.opponentReconnectHandlers) {
                    handler();
                }
                break;
            case "GAME_COMPLETED":
                for (const handler of this.gameCompletedHandlers) {
                    handler(response.complete.won);
                }
                break;
        }
    }
}