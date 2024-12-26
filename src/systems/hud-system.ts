import System from "./system";
import HiveGameComponent from "../components/hive-game-component";
import HudComponent from "../components/hud-component";
import {HiveColor, HivePieceType} from "../hive-game";
import {Matrix4, Raycaster, Vector2, Vector3, WebGLRenderer} from "three";
import {RendererComponent} from "./render-system";
import {rotateAboutVector, screenToNdc} from "../util";
import UserSelectionComponent from "../components/user-selection-component";
import PlayModeComponent, {PlayMode} from "../components/play-mode-component";

const NUM_TILES = 7;
const TILE_GAP_PX = 8;
const HORIZONTAL_PADDING_PX = 20;
const MOVE_INDICATOR_PADDING_TOP_PX = 30;
const MARKER_WIDTH_PX = 4;
const BUBBLE_RADIUS_PX = 15;

export default class HudSystem extends System {
    private positionPxToCamera = new Matrix4(
        2 / window.innerWidth, 0, 0, -1,
        0, -2 / window.innerWidth, 0, window.innerHeight / window.innerWidth,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
    private scalePxToCamera = new Matrix4(
        2 / window.innerWidth, 0, 0, 0,
        0, 2 / window.innerWidth, 0, 0,
        0, 0, 2 / window.innerWidth, 0,
        0, 0, 0, 1
    );

    private readonly raycaster = new Raycaster();

    private renderer: WebGLRenderer = null!;

    onCreate() {
        const hudComponent = this.registry.getEntitiesWithComponents(HudComponent)[0].getComponent(HudComponent);
        const {
            scene,
            camera,
            backgroundPlane,
            backgroundMeshes,
            marker,
            bubbleMeshes,
            bubbleElements,
            moveIndicator,
            whiteQueenBee,
            whiteSoldierAnt,
            whiteBeetle,
            whiteSpider,
            whiteGrasshopper,
            whiteLadybug,
            whiteMosquito,
            blackQueenBee,
            blackSoldierAnt,
            blackBeetle,
            blackSpider,
            blackGrasshopper,
            blackLadybug,
            blackMosquito,
        } = hudComponent;

        scene.add(whiteQueenBee);
        scene.add(whiteSoldierAnt);
        scene.add(whiteBeetle);
        scene.add(whiteSpider);
        scene.add(whiteGrasshopper);
        scene.add(whiteLadybug);
        scene.add(whiteMosquito);
        scene.add(blackQueenBee);
        scene.add(blackSoldierAnt);
        scene.add(blackBeetle);
        scene.add(blackSpider);
        scene.add(blackGrasshopper);
        scene.add(blackLadybug);
        scene.add(blackMosquito);

        for (const mesh of scene.children) {
            mesh.rotateY(1 / 12 * 2 * Math.PI);
        }

        scene.add(...backgroundMeshes);
        scene.add(...bubbleMeshes);

        scene.add(backgroundPlane);
        scene.add(marker);

        for (const element of bubbleElements) {
            document.body.appendChild(element);
        }

        document.body.appendChild(moveIndicator);

        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);

        const entities = this.registry.getEntitiesWithComponents(RendererComponent);

        if (entities.length !== 1) {
            throw new Error('There must only be one entity with a renderer component');
        }

        this.renderer = entities[0].getComponent(RendererComponent).renderer;
    }

    onResize() {
        const hudComponent = this.registry.getEntitiesWithComponents(HudComponent)[0].getComponent(HudComponent);
        const {camera} = hudComponent;

        camera.bottom = -(camera.top = window.innerHeight / window.innerWidth);
        camera.updateProjectionMatrix();

        this.positionPxToCamera = new Matrix4(
            2 / window.innerWidth, 0, 0, -1,
            0, -2 / window.innerWidth, 0, window.innerHeight / window.innerWidth,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
        this.scalePxToCamera = new Matrix4(
            2 / window.innerWidth, 0, 0, 0,
            0, 2 / window.innerWidth, 0, 0,
            0, 0, 2 / window.innerWidth, 0,
            0, 0, 0, 1
        );
    }

    onMouseDown(e: MouseEvent): boolean {
        const ndc = new Vector2();
        screenToNdc(new Vector2(e.clientX, e.clientY), ndc);

        const hudComponent = this.registry
            .getEntitiesWithComponents(HudComponent)[0]
            .getComponent(HudComponent);
        const {
            camera,
            backgroundPlane,
            whiteQueenBee,
            whiteSoldierAnt,
            whiteSpider,
            whiteGrasshopper,
            whiteBeetle,
            whiteLadybug,
            whiteMosquito,
            blackQueenBee,
            blackSoldierAnt,
            blackSpider,
            blackGrasshopper,
            blackBeetle,
            blackLadybug,
            blackMosquito,
        } = hudComponent;

        const whiteMeshes = [
            whiteQueenBee,
            whiteSoldierAnt,
            whiteSpider,
            whiteGrasshopper,
            whiteBeetle,
            whiteLadybug,
            whiteMosquito,
        ];
        const blackMeshes = [
            blackQueenBee,
            blackSoldierAnt,
            blackSpider,
            blackGrasshopper,
            blackBeetle,
            blackLadybug,
            blackMosquito,
        ];

        const {playerColor} = this.registry
            .getEntitiesWithComponents(HiveGameComponent)[0]
            .getComponent(HiveGameComponent);

        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        this.raycaster.setFromCamera(ndc, camera);
        const meshes = playerColor === HiveColor.Black ? blackMeshes : whiteMeshes;
        for (let i = 0; i < meshes.length; i++) {
            if (this.raycaster.intersectObject(meshes[i]).length > 0) {
                userSelection.pieceType = [
                    HivePieceType.QueenBee,
                    HivePieceType.SoldierAnt,
                    HivePieceType.Spider,
                    HivePieceType.Grasshopper,
                    HivePieceType.Beetle,
                    HivePieceType.Ladybug,
                    HivePieceType.Mosquito
                ][i] ?? null;
                return true;
            }
        }

        if (this.raycaster.intersectObject(backgroundPlane).length > 0) {
            userSelection.pieceType = null;
            return true;
        }

        return false;
    }

    onUpdate() {
        const {scene, camera} = this.registry
            .getEntitiesWithComponents(HudComponent)[0]
            .getComponent(HudComponent);

        this.updateMeshesAndElements();

        this.renderer.clearDepth();
        this.renderer.render(scene, camera);
    }

    private updateMeshesAndElements() {
        const mode = this.registry.getSingletonComponent(PlayModeComponent);
        const {game, playerColor: localColor} = this.registry.getSingletonComponent(HiveGameComponent);

        const playerColor = mode.playMode() === PlayMode.Local ? localColor : mode.client().color();

        const counts = [
            game.getTilesRemaining(playerColor, HivePieceType.QueenBee),
            game.getTilesRemaining(playerColor, HivePieceType.SoldierAnt),
            game.getTilesRemaining(playerColor, HivePieceType.Spider),
            game.getTilesRemaining(playerColor, HivePieceType.Grasshopper),
            game.getTilesRemaining(playerColor, HivePieceType.Beetle),
            game.getTilesRemaining(playerColor, HivePieceType.Ladybug),
            game.getTilesRemaining(playerColor, HivePieceType.Mosquito),
        ];

        const hudComponent = this.registry
            .getEntitiesWithComponents(HudComponent)[0]
            .getComponent(HudComponent);

        const {
            moveIndicator,
            marker,
            bubbleElements,
            backgroundMeshes,
            bubbleMeshes,
            whiteQueenBee,
            whiteSoldierAnt,
            whiteBeetle,
            whiteSpider,
            whiteGrasshopper,
            whiteLadybug,
            whiteMosquito,
            blackQueenBee,
            blackSoldierAnt,
            blackBeetle,
            blackSpider,
            blackGrasshopper,
            blackLadybug,
            blackMosquito,
            backgroundPlane
        } = hudComponent;

        const whiteMeshes = [
            whiteQueenBee,
            whiteSoldierAnt,
            whiteSpider,
            whiteGrasshopper,
            whiteBeetle,
            whiteLadybug,
            whiteMosquito,
        ];
        const blackMeshes = [
            blackQueenBee,
            blackSoldierAnt,
            blackSpider,
            blackGrasshopper,
            blackBeetle,
            blackLadybug,
            blackMosquito,
        ];

        const tileInnerDiameterPx = (window.innerHeight - TILE_GAP_PX * (NUM_TILES + 1)) / NUM_TILES;
        const tileOuterDiameterPx = tileInnerDiameterPx * 2 / Math.sqrt(3);

        // Place background plane, meshes, bubble meshes

        backgroundPlane.position.set(
            HORIZONTAL_PADDING_PX + tileOuterDiameterPx / 2,
            window.innerHeight / 2,
            0
        );
        backgroundPlane.position.applyMatrix4(this.positionPxToCamera);
        backgroundPlane.scale.set(
            2 * HORIZONTAL_PADDING_PX + tileOuterDiameterPx,
            window.innerHeight,
            1
        );
        backgroundPlane.scale.applyMatrix4(this.scalePxToCamera);

        const playerMeshes = playerColor === HiveColor.Black ? blackMeshes : whiteMeshes;

        for (let i = 0; i < playerMeshes.length; i++) {
            const position = new Vector3(
                HORIZONTAL_PADDING_PX + tileOuterDiameterPx / 2,
                TILE_GAP_PX + tileInnerDiameterPx / 2 + i * (TILE_GAP_PX + tileInnerDiameterPx),
                0
            );

            const bubblePositionPx = new Vector3(tileOuterDiameterPx / 2, 0, 0);
            rotateAboutVector(bubblePositionPx, new Vector3(0, 0, 1), -45 * Math.PI / 180);
            bubblePositionPx.add(position);

            bubbleMeshes[i].position.copy(bubblePositionPx);
            bubbleMeshes[i].position.applyMatrix4(this.positionPxToCamera).setZ(2);
            bubbleMeshes[i].scale.setScalar(BUBBLE_RADIUS_PX);
            bubbleMeshes[i].scale.applyMatrix4(this.scalePxToCamera);
            bubbleMeshes[i].visible = counts[i] >= 2;

            // Place and update text for bubble elements
            bubbleElements[i].textContent = counts[i] < 2 ? '' : `x${counts[i]}`;
            bubbleElements[i].style.position = 'absolute';
            bubbleElements[i].style.left = `${bubblePositionPx.x}px`;
            bubbleElements[i].style.top = `${bubblePositionPx.y}px`;

            const mesh = playerMeshes[i];
            mesh.visible = counts[i] >= 1;
            mesh.scale.setScalar(tileOuterDiameterPx / 2);
            mesh.scale.applyMatrix4(this.scalePxToCamera);
            mesh.position.copy(position).setZ(1);
            mesh.position.applyMatrix4(this.positionPxToCamera);

            backgroundMeshes[i].position.copy(position).setZ(0.5);
            backgroundMeshes[i].position.applyMatrix4(this.positionPxToCamera);
            backgroundMeshes[i].scale.setScalar(tileOuterDiameterPx / 2);
            backgroundMeshes[i].scale.applyMatrix4(this.scalePxToCamera);
        }

        // Move indicator
        moveIndicator.textContent = game.colorToMove() === HiveColor.Black
            ? 'Black to move'
            : 'White to move';
        moveIndicator.style.left = `${2 * HORIZONTAL_PADDING_PX + tileOuterDiameterPx}px`
        moveIndicator.style.top = `${MOVE_INDICATOR_PADDING_TOP_PX}px`

        const userSelection = this.registry.getSingletonComponent(UserSelectionComponent);

        // Place marker
        marker.visible = userSelection.pieceType != null;

        if (userSelection.pieceType != null) {
            marker.position.set(
                HORIZONTAL_PADDING_PX + tileOuterDiameterPx / 2,
                TILE_GAP_PX + tileInnerDiameterPx / 2 + (userSelection.pieceType as number) * (TILE_GAP_PX + tileInnerDiameterPx),
                0
            );
            marker.position.applyMatrix4(this.positionPxToCamera);

            marker.scale.setScalar((tileInnerDiameterPx / 2 + MARKER_WIDTH_PX) * 2 / Math.sqrt(3));
            marker.scale.applyMatrix4(this.scalePxToCamera);
        }

        // Set visibilities
        const opponentMeshes = playerColor === HiveColor.Black ? whiteMeshes : blackMeshes;
        for (const mesh of opponentMeshes) {
            mesh.visible = false;
        }
    }
}