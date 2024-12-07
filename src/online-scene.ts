import * as THREE from 'three';
import HiveScene from "./hive-scene";
import {HiveColor, HivePieceType} from "./hive-game";
import Hud from "./hud";
import {MouseState} from "./mouse-state";
import {LEFT_BUTTON} from "./constants";
import OnlineClient, {Move} from "./online-client";
import {GameplayScene} from "./gameplay-scene";
import OnlineOverlay from "./online-overlay";

export default class OnlineScene implements GameplayScene {
    private readonly overlay: OnlineOverlay;
    private readonly client: OnlineClient;
    private playerColor: HiveColor = HiveColor.Black;

    public static async create(): Promise<OnlineScene> {
        const hiveScene = await HiveScene.createWithBlankGame();
        const onlineScene = new OnlineScene(hiveScene, new Hud());
        await onlineScene.client.join();

        return onlineScene;
    }

    private constructor(private hiveScene: HiveScene, private hud: Hud) {
        this.client = new OnlineClient({
            connectHandler: this.onConnect.bind(this),
            receiveMoveHandler: this.onReceiveMove.bind(this),
            connectionCloseHandler: this.onOpponentDisconnect.bind(this),
            opponentReconnectHandler: this.onOpponentReconnect.bind(this),
        });

        this.overlay = new OnlineOverlay(this.client);
        this.overlay.show();
    }

    private onConnect(color: HiveColor): void {
        this.playerColor = color;
        this.updateHud();
        this.overlay.hide();
    }

    private onReceiveMove(move: Move): void {
        let success = false;

        switch (move.moveType) {
            case "PLACE":
                success = this.hiveScene.placePiece(move.pieceType, move.position);
                break;
            case "MOVE":
                success = this.hiveScene.movePiece(move.from, move.to);
                break;
        }

        if (!success) {
            throw new Error('client received an illegal move from the server; very bad');
        }

        this.updateHud();
    }

    private onOpponentDisconnect(): void {
    }

    private onOpponentReconnect(): void {
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
            pieceCounts[p] = this.hiveScene.game.getTilesRemaining(this.playerColor, p as HivePieceType);
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
        this.hud.onResize();
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
        this.client.close();
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