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
    disconnectHandler?: () => unknown;
}

export default class OnlineClient {
    private session: {
        token: string,
        color: HiveColor,
        socket: WebSocket,
        nextMove: HiveColor,
    } | null = null;
    private readonly receiveMoveHandler: (move: Move) => unknown;
    private readonly connectHandler: (color: HiveColor) => unknown;
    private readonly disconnectHandler: () => unknown;

    public constructor(private host: string, options?: OnlineClientOptions) {
        this.receiveMoveHandler = options?.receiveMoveHandler ?? (() => {});
        this.connectHandler = options?.connectHandler ?? (() => {});
        this.disconnectHandler = options?.disconnectHandler ?? (() => {});
    }

    public async joinAnonymousGame(): Promise<void> {
        const join = await fetch(`http://${this.host}/join`);
        const data = await join.json();
        const token: string = data.token;

        const socket = new WebSocket(`ws://${this.host}/play`);

        socket.addEventListener('open', () => {
            socket.send(JSON.stringify({
                event: 'AUTHENTICATE',
                token,
            }));

            this.session = {
                token,
                socket,
                color: HiveColor.Black,
                nextMove: HiveColor.Black,
            };
        });

        socket.addEventListener('close', () => {
            this.disconnectHandler();
        });

        socket.addEventListener('message', event => {
            this.onMessage(event.data);
        });
    }

    public placePiece(pieceType: HivePieceType, position: HexVector) {
        const pieceTypeMap = HiveGame.internalPieceTypeMap();

        this.session?.socket.send(JSON.stringify({
            event: "PLAY_MOVE",
            move: {
                moveType: "PLACE",
                placement: {
                    pieceType: pieceTypeMap[pieceType],
                    position: position.json(),
                },
            },
        }));
    }

    public movePiece(from: HexVector, to: HexVector) {
        this.session?.socket.send(JSON.stringify({
            event: "PLAY_MOVE",
            move: {
                moveType: "MOVE",
                movement: {
                    from: from.json(),
                    to: to.json(),
                },
            },
        }));
    }

    private onMessage(message: string) {
        console.log('received message from server');
        if (this.session == null) {
            throw new Error('invalid state, cannot receive a message while no session is open');
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
                this.session.color = c;
                this.connectHandler(c);
                break;
            }
            case "PLAY_MOVE":
                switch (response.move.moveType) {
                    case "MOVE": {
                        console.log('dispatching movement from server');
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
                        console.log('dispatching placement from server');
                        const pieceType: HivePieceType = response.move.placement.pieceType;
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
            case "GAME_COMPLETED":
                // TODO we should have already figured that the game is completed out, but we have it confirmed on the server side now
                break;
        }
    }
}