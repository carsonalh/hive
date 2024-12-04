import HiveScene from "./hive-scene";
import Hud from "./hud";
import {MouseState} from "./mouse-state";
import {LEFT_BUTTON} from "./constants";
import {GameplayScene} from "./gameplay-scene";
import {WebGLRenderer} from "three";
import {HivePieceType} from "./hive-game";

export default class LocalScene implements GameplayScene {
    public static async create(): Promise<LocalScene> {
        const hiveScene = await HiveScene.createWithBlankGame();
        return new LocalScene(hiveScene, new Hud());
    }

    private constructor(private hiveScene: HiveScene, private hud: Hud) {
        this.updateHud();
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
            const count = this.hiveScene.game.getTilesRemaining(this.hiveScene.game.colorToMove(), p as HivePieceType);
            pieceCounts[p] = count;
        }

        const toMove = this.hiveScene.game.colorToMove();
        this.hud.setPlayerColor(toMove);
        this.hud.setPlayerToMove(toMove);

        this.hud.setPieceCounts(pieceCounts);
        this.hud.update();
    }

    public onMouseDown(e: MouseEvent, state: MouseState) {
        if (e.button === LEFT_BUTTON) {
            if (this.hud.onMouseDown(e, state)) {
                this.hiveScene.onClickAway();
                this.updateHud();
            } else {
                const hex = this.hiveScene.getClickedTile(e);
                let success = false;

                if (this.hiveScene.selected != null) {
                    success = this.hiveScene.movePiece(this.hiveScene.selected, hex);
                } else if (this.hud.selectedPieceType != null) {
                    success = this.hiveScene.placePiece(this.hud.selectedPieceType, hex);
                } else {
                    this.hiveScene.select(hex);
                }

                this.hud.onClickAway();

                if (success) {
                    this.updateHud();
                }
            }
        }
    }

    public render(renderer: WebGLRenderer) {
        renderer.clear();
        renderer.render(this.hiveScene.scene, this.hiveScene.camera);
        renderer.clearDepth();
        renderer.render(this.hud.scene, this.hud.camera);
    }

    public onResize(): void {
        this.hud.onResize();
        this.hiveScene.onResize();
    }

    public onWheel(e: WheelEvent): void {
        this.hiveScene.onWheel(e);
    }

    public onMouseMove(e: MouseEvent, mouseStateTracker: MouseState): void {
        this.hiveScene.onMouseMove(e, mouseStateTracker);
    }

    public update(deltaTimeMs: number, mouseStateTracker: MouseState): void {
        this.hiveScene.update(deltaTimeMs, mouseStateTracker);
    }

    public cleanup() {
        this.hud.clearDomElements();
    }
}