import * as THREE from 'three';
import Gameplay, {Move} from "./gameplay";
import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import {ExternalGameInfo, PlayerColor} from "./hud";
import {MouseState} from "./mouse-state";
import {HexVector} from "./hex-grid";

export default class OnlineGameplay {
    private loadingModal: HTMLElement;
    private joiningModal: HTMLElement;
    private displayedModal: HTMLElement | null = null;
    private externalGameInfo: ExternalGameInfo | null = null;
    private session: {
        token: string,
        color: HiveColor,
        socket: WebSocket,
        nextMove: HiveColor,
    } | null = null;

    public static async create(game: HiveGame, externalGameInfo: ExternalGameInfo): Promise<OnlineGameplay> {
        const gameplay = await Gameplay.create(game, externalGameInfo);
        const onlineGameplay = new OnlineGameplay(game, gameplay);
        gameplay.moveConsumer = {
            consume: move => {
                onlineGameplay.onMakeMove(move);
            }
        };
        onlineGameplay.externalGameInfo = externalGameInfo;

        onlineGameplay.displayedModal = onlineGameplay.loadingModal;
        document.body.appendChild(onlineGameplay.loadingModal);

        fetch('http://localhost:8080/join')
            .then(async response => {
                const data = await response.json();
                const token: string = data.token;

                const socket = new WebSocket('ws://localhost:8080/play');

                socket.addEventListener('open', () => {
                    socket.send(JSON.stringify({
                        event: 'AUTHENTICATE',
                        token,
                    }));

                    onlineGameplay.session = {
                        token,
                        socket,
                        color: HiveColor.Black,
                        nextMove: HiveColor.Black,
                    };

                    onlineGameplay.hideModal();
                });

                socket.addEventListener('message', event => {
                    onlineGameplay.onReceiveMessage(event.data);
                });
            })
            .catch(console.error);

        return onlineGameplay;
    }

    private constructor(private _game: HiveGame, private gameplay: Gameplay) {
        this.loadingModal = document.createElement('div');
        this.loadingModal.classList.add('modal-loading');

        this.joiningModal = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = 'Waiting for another player to join this game...';
        this.joiningModal.appendChild(p);

        const paragraph = document.createElement('p');
        paragraph.textContent = 'Loading';

        this.loadingModal.appendChild(paragraph);
    }

    private hideModal(): void {
        if (this.displayedModal != null)
            document.body.removeChild(this.displayedModal);
        this.displayedModal = null;
    }

    private onReceiveMessage(message: string): void {
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
            case "CONNECT":
                const c: HiveColor = response.connect.color;
                this.session.color = c;

                let pc: PlayerColor;

                if (c == HiveColor.Black) {
                    pc = PlayerColor.Black
                } else {
                    pc = PlayerColor.White
                }

                this.externalGameInfo!.setPlayerColor(pc);

                break;
            case "PLAY_MOVE":
                switch (response.move.moveType) {
                    case "MOVEMENT": {
                        const from = new HexVector(response.move.movement.from.q, response.move.movement.from.r);
                        const to = new HexVector(response.move.movement.to.q, response.move.movement.to.r);
                        this.gameplay.tryMovePiece(from, to);
                        break;
                    }
                    case "PLACEMENT": {
                        const pieceType: HivePieceType = response.move.placement.pieceType;
                        const position = new HexVector(response.move.placement.from.q, response.move.placement.from.r);
                        this.gameplay.tryPlacePiece(pieceType, position);
                        break;
                    }
                }
                break;
            case "REJECT_MOVE":
                // TODO this is cause for error: the server rejected our move (which we should not have sent)
                break;
            case "GAME_COMPLETED":
                // TODO we should have already figured that the game is completed out, but we have it confirmed on the server side now
                break;
        }
    }

    private onMakeMove(move: Move): void {
        if (this.session == null) {
            throw new Error('Cannot make a move without an active session');
        }

        this.session.socket.send(JSON.stringify({
            event: "PLAY_MOVE",
            move,
        }));
    }

    public onClick(e: MouseEvent, state: MouseState): void {
        this.gameplay.onClick(e, state);
    }

    public onResize(): void {
        this.gameplay.onResize();
    }

    public onWheel(e: WheelEvent): void {
        this.gameplay.onWheel(e);
    }

    public onUpdate(deltaTimeMs: number, state: MouseState): void {
        this.gameplay.onUpdate(deltaTimeMs, state);
    }

    public onClickAway(): void {
        this.gameplay.onClickAway();
    }

    public onMouseMove(e: MouseEvent, state: MouseState): void {
        this.gameplay.onMouseMove(e, state);
    }

    public get scene(): THREE.Scene {
        return this.gameplay.scene;
    }

    public get camera(): THREE.Camera {
        return this.gameplay.camera;
    }
}