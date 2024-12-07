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

export interface OnlineClientOptions {
    receiveMoveHandler?: (move: Move) => unknown;
    connectHandler?: (color: HiveColor) => unknown;
    connectionCloseHandler?: () => unknown;
    opponentDisconnectHandler?: () => unknown;
    opponentReconnectHandler?: () => unknown;
    gameCompletedHandler?: (won: boolean) => unknown;
}

export default class OnlineClient {
    private session: {
        token: string,
        game: {
            id: string,
            socket: WebSocket,
            color: HiveColor,
            nextMove: HiveColor,
        } | null,
    } | null = null;
    private readonly receiveMoveHandler: (move: Move) => unknown;
    private readonly connectHandler: (color: HiveColor) => unknown;
    private readonly connectionCloseHandler: () => unknown;
    private readonly opponentDisconnectHandler: () => unknown;
    private readonly opponentReconnectHandler: () => unknown;
    private readonly gameCompletedHandler: (won: boolean) => unknown;

    public constructor(options?: OnlineClientOptions) {
        this.receiveMoveHandler = options?.receiveMoveHandler ?? (() => {});
        this.connectHandler = options?.connectHandler ?? (() => {});
        this.connectionCloseHandler = options?.connectionCloseHandler ?? (() => {});
        this.opponentDisconnectHandler = options?.opponentDisconnectHandler ?? (() => {});
        this.opponentReconnectHandler = options?.opponentReconnectHandler ?? (() => {});
        this.gameCompletedHandler = options?.gameCompletedHandler ?? (() => {});
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
            nextMove: HiveColor.Black,
        };

        socket.addEventListener('open', () => {
            socket.send(JSON.stringify({
                event: 'AUTHENTICATE',
                token: this.session!.token,
            }));
        });

        socket.addEventListener('close', () => {
            this.connectionCloseHandler();
        });

        socket.addEventListener('message', event => {
            this.onMessage(event.data);
        });
    }

    public placePiece(pieceType: HivePieceType, position: HexVector) {
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

    public movePiece(from: HexVector, to: HexVector) {
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
                this.connectHandler(c);
                break;
            }
            case "PLAY_MOVE":
                switch (response.move.moveType) {
                    case "MOVE": {
                        const from = new HexVector(response.move.movement.from.q, response.move.movement.from.r);
                        const to = new HexVector(response.move.movement.to.q, response.move.movement.to.r);
                        this.receiveMoveHandler({
                            moveType: "MOVE",
                            from,
                            to,
                        });
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
                        this.receiveMoveHandler({
                            moveType: "PLACE",
                            pieceType,
                            position,
                        });
                        break;
                    }
                }
                break;
            case "REJECT_MOVE":
                throw new Error('Either the server is lying or we gave an illegal move');
            case "DISCONNECT":
                this.opponentDisconnectHandler();
                break;
            case "RECONNECT":
                this.opponentReconnectHandler();
                break;
            case "GAME_COMPLETED":
                this.gameCompletedHandler(response.complete.won);
                break;
        }
    }
}