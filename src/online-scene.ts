import * as THREE from 'three';
import HiveScene from "./hive-scene";
import {HiveColor, HivePieceType} from "./hive-game";
import Hud from "./hud";
import {MouseState} from "./mouse-state";
import {LEFT_BUTTON} from "./constants";
import OnlineClient, {Move} from "./online-client";
import {GameplayScene} from "./gameplay-scene";

export default class OnlineScene implements GameplayScene {
    private joiningModal: HTMLElement;
    private disconnectedModal: HTMLElement;
    private displayedModal: HTMLElement | null = null;
    private client: OnlineClient;
    private playerColor: HiveColor = HiveColor.Black;

    public static async create(): Promise<OnlineScene> {
        const hiveScene = await HiveScene.createWithBlankGame();
        const onlineScene = new OnlineScene(hiveScene, new Hud());

        onlineScene.displayedModal = onlineScene.joiningModal;
        document.body.appendChild(onlineScene.joiningModal);

        return onlineScene;
    }

    private constructor(private hiveScene: HiveScene, private hud: Hud) {
        this.client = new OnlineClient({
            connectHandler: this.onConnect.bind(this),
            receiveMoveHandler: this.onReceiveMove.bind(this),
            disconnectHandler: this.onOpponentDisconnect.bind(this)
        });

        this.client.joinAnonymousGame();

        {
            this.joiningModal = document.createElement('div');
            this.joiningModal.classList.add('online-modal', 'online-modal-joining');
            const p = document.createElement('p');
            p.textContent = 'Waiting for another player to join this game...';
            this.joiningModal.appendChild(p);
        }

        {
            this.disconnectedModal = document.createElement('div');
            this.disconnectedModal.classList.add('online-modal', 'online-modal-disconnected');

            const button = document.createElement('button');
            button.textContent = 'Ok';
            button.addEventListener('mousedown', () => {
                this.hideModal();
            });

            const p = document.createElement('p');
            p.textContent = 'Your opponent disconnected from the game';

            this.disconnectedModal.appendChild(p);
            this.disconnectedModal.appendChild(button);
        }

    }

    private onConnect(color: HiveColor): void {
        this.playerColor = color;
        this.hideModal();
        this.updateHud();
    }

    private onReceiveMove(move: Move): void {
        switch (move.moveType) {
            case "PLACE":
                this.hiveScene.placePiece(move.pieceType, move.position);
                break;
            case "MOVE":
                this.hiveScene.movePiece(move.from, move.to);
                break;
        }

        this.updateHud();
    }

    private onOpponentDisconnect(): void {
        this.hideModal();
        document.body.append(this.disconnectedModal);
        this.displayedModal = this.disconnectedModal;
    }

    private hideModal(): void {
        if (this.displayedModal != null)
            document.body.removeChild(this.displayedModal);
        this.displayedModal = null;
    }

    private updateHud(): void {
        const pieceCounts = {} as Record<HivePieceType, number>;

        const allPieces = [
            HivePieceType.QueenBee,
            HivePieceType.SoldierAnt,
            HivePieceType.Spider,
            HivePieceType.Grasshopper,
            HivePieceType.Beetle,
            HivePieceType.Ladybug,
            HivePieceType.Mosquito,
        ]

        for (const piece of allPieces) {
            const p = piece as HivePieceType;
            const count = this.hiveScene.game.getTilesRemaining(this.playerColor, p as HivePieceType);
            pieceCounts[p] = count;
        }

        this.hud.setPlayerToMove(this.hiveScene.game.colorToMove());
        this.hud.setPlayerColor(this.playerColor);

        this.hud.setPieceCounts(pieceCounts);
        this.hud.update();
    }

    public onMouseDown(e: MouseEvent, state: MouseState): void {
        if (e.button === LEFT_BUTTON) {
            if (this.hud.onMouseDown(e, state)) {
                this.hiveScene.onClickAway();
            } else {
                const hit = this.hiveScene.getClickedTile(e);
                const isOurTurn = this.playerColor === this.hiveScene.game.colorToMove();

                if (this.hud.selectedPieceType != null) {
                    if (isOurTurn && this.hiveScene.placePiece(this.hud.selectedPieceType, hit)) {
                        this.client.placePiece(this.hud.selectedPieceType, hit);
                        this.updateHud();
                    }
                } else if (this.hiveScene.selected != null) {
                    if (isOurTurn && this.hiveScene.movePiece(this.hiveScene.selected, hit)) {
                        this.client.movePiece(this.hiveScene.selected, hit);
                    }
                } else {
                    this.hiveScene.select(hit);
                }

                this.hud.onClickAway();
            }
        }
    }

    public onResize(): void {
        this.hiveScene.onResize();
    }

    public onWheel(e: WheelEvent): void {
        this.hiveScene.onWheel(e);
    }

    public update(deltaTimeMs: number, state: MouseState): void {
        this.hiveScene.update(deltaTimeMs, state);
    }

    public render(renderer: THREE.WebGLRenderer): void {
        renderer.clear();
        renderer.render(this.scene, this.camera);
        renderer.clearDepth();
        renderer.render(this.hud.scene, this.hud.camera);
    }

    public cleanup() {
        // TODO send disconnect message to the server
        this.hideModal();
        this.hud.clearDomElements();
    }

    public onMouseMove(e: MouseEvent, state: MouseState): void {
        this.hiveScene.onMouseMove(e, state);
    }

    public get scene(): THREE.Scene {
        return this.hiveScene.scene;
    }

    public get camera(): THREE.Camera {
        return this.hiveScene.camera;
    }
}