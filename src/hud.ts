import {HiveColor, HivePieceType} from "./hive-game";
import * as THREE from "three";
import {
    BLACK_BEETLE,
    BLACK_GRASSHOPPER,
    BLACK_LADYBUG,
    BLACK_MOSQUITO,
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    BLACK_SPIDER,
    HEXAGON_SHAPE,
    WHITE_BEETLE,
    WHITE_GRASSHOPPER,
    WHITE_LADYBUG,
    WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT,
    WHITE_SPIDER
} from "./tiles";
import {MouseState} from "./mouse-state";
import {RADIUS} from "./constants";
import {ndcToScreen} from "./util";

const TILE_GAP_PX = 20;
const HORIZONTAL_PADDING_PX = 30;
const MOVE_INDICATOR_PADDING_TOP_PX = 30;
const MARKER_WIDTH_PX = 4;
const BUBBLE_RADIUS_PX = 15;

class Hud {
    private readonly _scene: THREE.Scene;
    private readonly _camera: THREE.OrthographicCamera;
    private readonly whiteMeshes: THREE.Mesh[];
    private readonly blackMeshes: THREE.Mesh[];
    private readonly pieceTypes: HivePieceType[];
    private readonly marker: THREE.Mesh;
    private readonly container: THREE.Mesh;
    private readonly moveIndicator: HTMLElement;
    private readonly bubbleElements: Record<HivePieceType, HTMLElement | null>;
    private selected: HivePieceType | null = null;

    private pieceCounts: Record<HivePieceType, number> = {
        [HivePieceType.QueenBee]: 0,
        [HivePieceType.SoldierAnt]: 0,
        [HivePieceType.Spider]: 0,
        [HivePieceType.Grasshopper]: 0,
        [HivePieceType.Beetle]: 0,
        [HivePieceType.Ladybug]: 0,
        [HivePieceType.Mosquito]: 0,
    };
    private playerColor: HiveColor = HiveColor.Black;
    private playerToMove: HiveColor = HiveColor.Black;
    private bubbleMeshes: Record<HivePieceType, THREE.Mesh | null>;

    public constructor() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);
        this._camera.position.z = 5;

        this.marker = new THREE.Mesh(
            new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()),
            new THREE.MeshBasicMaterial({color: 0x474545})
        );

        this.container = new THREE.Mesh(
            new THREE.PlaneGeometry(),
            new THREE.MeshBasicMaterial({color: 0x353232})
        );

        this.moveIndicator = document.createElement('div');
        this.moveIndicator.classList.add('hud-move-indicator');

        this.whiteMeshes = [
            WHITE_QUEEN_BEE.clone(),
            WHITE_SOLDIER_ANT.clone(),
            WHITE_SPIDER.clone(),
            WHITE_GRASSHOPPER.clone(),
            WHITE_BEETLE.clone(),
            WHITE_LADYBUG.clone(),
            WHITE_MOSQUITO.clone(),
        ];

        this.blackMeshes = [
            BLACK_QUEEN_BEE.clone(),
            BLACK_SOLDIER_ANT.clone(),
            BLACK_SPIDER.clone(),
            BLACK_GRASSHOPPER.clone(),
            BLACK_BEETLE.clone(),
            BLACK_LADYBUG.clone(),
            BLACK_MOSQUITO.clone(),
        ];

        for (const mesh of [this.whiteMeshes, this.blackMeshes].flat()) {
            mesh.rotateY((1 / 12) * 2 * Math.PI);
        }

        this.pieceTypes = [
            HivePieceType.QueenBee,
            HivePieceType.SoldierAnt,
            HivePieceType.Spider,
            HivePieceType.Grasshopper,
            HivePieceType.Beetle,
            HivePieceType.Ladybug,
            HivePieceType.Mosquito,
        ];

        this.bubbleElements = {
            [HivePieceType.QueenBee]: null,
            [HivePieceType.SoldierAnt]: null,
            [HivePieceType.Spider]: null,
            [HivePieceType.Grasshopper]: null,
            [HivePieceType.Beetle]: null,
            [HivePieceType.Ladybug]: null,
            [HivePieceType.Mosquito]: null,
        };

        this.bubbleMeshes = {
            [HivePieceType.QueenBee]: null,
            [HivePieceType.SoldierAnt]: null,
            [HivePieceType.Spider]: null,
            [HivePieceType.Grasshopper]: null,
            [HivePieceType.Beetle]: null,
            [HivePieceType.Ladybug]: null,
            [HivePieceType.Mosquito]: null,
        };

        this.onResize();
    }

    /**
     * Return true if the click hit something in the hud.
     */
    public onMouseDown(e: MouseEvent, _: MouseState): boolean {
        const raycaster = new THREE.Raycaster();
        const clickedNdc = new THREE.Vector2(
            2 * e.clientX / window.innerWidth - 1,
            -2 * e.clientY / window.innerHeight + 1,
        );
        raycaster.setFromCamera(clickedNdc, this._camera);

        let i = 0;
        for (const mesh of this.coloredMeshes()) {
            if (this.pieceCounts[this.pieceTypes[i]] === 0) {
                i++;
                continue;
            }

            const intersections = raycaster.intersectObject(mesh);

            if (intersections.length > 0) {
                if (i < this.pieceTypes.length) {
                    if (this.pieceTypes[i] === this.selectedPieceType) {
                        this.onClickAway();
                    } else {
                        this.selected = this.pieceTypes[i];
                        this.marker.position.copy(mesh.position);
                        mesh.position.z = 0;
                        this._scene.add(this.marker);
                    }

                    return true;
                }
            }

            i++;
        }

        {
            const intersections = raycaster.intersectObject(this.container);

            if (intersections.length > 0) {
                this.onClickAway();
                return true;
            }
        }

        return false;
    }

    public onClickAway(): void {
        if (this.selected != null) {
            this._scene.remove(this.marker);
            this.selected = null;
        }
    }

    public onResize() {
        this._camera.top = 5 * window.innerHeight / window.innerWidth;
        this._camera.bottom = -5 * window.innerHeight / window.innerWidth;
        this._camera.updateProjectionMatrix();
        this.placeMeshesAndPieceCounts();
        // this.marker.scale.setScalar(
        //     ((TILE_WIDTH_PX + 2 * TILE_GAP_PX) * 10 / window.innerWidth) / (2 * RADIUS)
        // );
    }

    public update() {
        this._scene.clear();
        this.placeMeshesAndPieceCounts();

        if (this.selected != null) {
            this._scene.add(this.marker);
        }
    }

    /**
     * Gets which piece type should be placed based on the HUD selection.
     */
    public get selectedPieceType(): HivePieceType | null {
        return this.selected;
    }

    public clearDomElements(): void {
        for (const e of Object.values(this.bubbleElements)) {
            if (e != null) {
                document.body.removeChild(e);
            }
        }
    }

    public setPieceCounts(counts: Record<HivePieceType, number>): void {
        this.pieceCounts = {...counts};
    }

    public setPlayerColor(color: HiveColor) {
        if (color !== this.playerColor) {
            this.playerColor = color;
            this._scene.clear();
            this.placeMeshesAndPieceCounts()
        }
    }

    public setPlayerToMove(color: HiveColor) {
        this.playerToMove = color;
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this._camera;
    }

    private coloredMeshes(): THREE.Mesh[] {
        switch (this.playerColor) {
            case HiveColor.Black:
                return this.blackMeshes;
            case HiveColor.White:
                return this.whiteMeshes;
            default:
                throw new Error('unreachable');
        }
    }

    private placeMeshesAndPieceCounts(): void {
        // Place tiles
        const tileHeight = 2 * RADIUS;
        const numSpaces = this.pieceTypes.length;
        const yUnit = new THREE.Vector3(0, 1, 0);
        yUnit.applyMatrix4(this._camera.projectionMatrixInverse)
        const worldToNdcYScale = yUnit.y;
        const xUnit = new THREE.Vector3(1, 0, 0);
        xUnit.applyMatrix4(this._camera.projectionMatrixInverse);
        const worldToNdcXScale = xUnit.x;
        const worldGap = TILE_GAP_PX / window.innerHeight * worldToNdcYScale;
        const gapSpace = worldGap * (numSpaces + 1);
        const tileSpace = this._camera.top - this._camera.bottom - gapSpace;
        const spacePerTile = tileSpace / numSpaces;

        const newRadius = spacePerTile / 2;
        const outerRadius = newRadius * 2 / Math.sqrt(3);

        const worldHorizontalPadding = HORIZONTAL_PADDING_PX / window.innerWidth * worldToNdcXScale;
        const x = this._camera.left + worldHorizontalPadding + outerRadius;
        const yStart = this._camera.top - (worldGap + newRadius);

        this.coloredMeshes().forEach((mesh, i) => {
            if (this.pieceCounts[this.pieceTypes[i]] > 0) {
                mesh.position.set(x, yStart - (spacePerTile + worldGap) * i, 0);
                mesh.scale.setScalar(spacePerTile / tileHeight);
                this._scene.add(mesh);
            } else {
                // render empty tile square to show something is missing
                const mesh = new THREE.Mesh(
                    new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()),
                    new THREE.MeshBasicMaterial({ color: 0x252323 })
                );
                mesh.position.set(x, yStart - (spacePerTile + worldGap) * i, 0);
                mesh.scale.setScalar(spacePerTile / tileHeight);
                this._scene.add(mesh);
            }
        });

        // Place bubble meshes and html elements
        for (let i = 0; i < this.pieceTypes.length; i++) {
            if (this.pieceCounts[this.pieceTypes[i]] > 1) {
                const cachedMesh = this.bubbleMeshes[this.pieceTypes[i]];
                const mesh = cachedMesh != null
                    ? cachedMesh
                    : new THREE.Mesh(
                        new THREE.ShapeGeometry(HEXAGON_SHAPE.clone()),
                        new THREE.MeshBasicMaterial({ color: 0xffffff })
                    );

                this.bubbleMeshes[this.pieceTypes[i]] = mesh;

                const tilePosition = new THREE.Vector2(x, yStart - (spacePerTile + worldGap) * i);
                const bubblePosition = tilePosition
                    .clone()
                    .add(new THREE.Vector2(outerRadius, 0))
                    .rotateAround(tilePosition, 45 * Math.PI / 180);

                const bubbleRadiusNdc = new THREE.Vector3(BUBBLE_RADIUS_PX * 2 / window.innerWidth, 0, 0);
                const bubbleRadiusWorld = bubbleRadiusNdc
                    .clone()
                    .applyMatrix4(this._camera.projectionMatrixInverse);

                mesh.scale.setScalar(bubbleRadiusWorld.x);
                mesh.position.set(bubblePosition.x, bubblePosition.y, 1);

                const bubblePosition3d = new THREE.Vector3(bubblePosition.x, bubblePosition.y, 0);
                bubblePosition3d.applyMatrix4(this._camera.projectionMatrix);
                const screenPosition = new THREE.Vector2();
                ndcToScreen(bubblePosition3d, screenPosition);

                if (this.bubbleElements[this.pieceTypes[i]] == null) {
                    const element = document.createElement('span');
                    element.classList.add('hud-bubble-text');
                    this.bubbleElements[this.pieceTypes[i]] = element;
                    document.body.appendChild(element);
                }

                this.bubbleElements[this.pieceTypes[i]]!.textContent = `x${this.pieceCounts[this.pieceTypes[i]]}`;
                this.bubbleElements[this.pieceTypes[i]]!.style.left = `${screenPosition.x}px`;
                this.bubbleElements[this.pieceTypes[i]]!.style.top = `${screenPosition.y}px`;

                this._scene.add(mesh);
            } else if (this.bubbleElements[this.pieceTypes[i]] != null) {
                document.body.removeChild(this.bubbleElements[this.pieceTypes[i]] as HTMLElement);
                this.bubbleElements[this.pieceTypes[i]] = null;
            }
        }

        // Place outer container
        const containerLeft = this._camera.left;
        const containerRight = this._camera.left + 2 * worldHorizontalPadding + 2 * outerRadius;
        const containerTop = this._camera.top;
        const containerBottom = this._camera.bottom;

        this.container.geometry = new THREE.PlaneGeometry(
                containerRight - containerLeft,
                containerTop - containerBottom,
        );
        this.container.position.set(
            (containerLeft + containerRight) / 2,
            (containerTop + containerBottom) / 2,
            -1
        );
        this._scene.add(this.container);

        // Place/update move indicator
        if (this.playerToMove === HiveColor.Black) {
            this.moveIndicator.textContent = 'Black to Move';
            if (this.moveIndicator.classList.contains('white')) {
                this.moveIndicator.classList.remove('white');
            }
            this.moveIndicator.classList.remove('black');
        } else {
            this.moveIndicator.textContent = 'White to Move';
            if (this.moveIndicator.classList.contains('black')) {
                this.moveIndicator.classList.remove('black');
            }
            this.moveIndicator.classList.remove('white');
        }

        const screen = new THREE.Vector2();
        const moveIndicatorXLoc = new THREE.Vector3(containerRight, 0, 0);
        moveIndicatorXLoc.applyMatrix4(this._camera.projectionMatrix);
        ndcToScreen(moveIndicatorXLoc, screen);
        this.moveIndicator.style.left = `${screen.x}px`;
        this.moveIndicator.style.top = `${MOVE_INDICATOR_PADDING_TOP_PX}px`;

        if (!document.body.contains(this.moveIndicator)) {
            document.body.appendChild(this.moveIndicator);
        }

        // Update the marker's position and scale
        const markerWidthNdc = new THREE.Vector2(MARKER_WIDTH_PX * 2 / window.innerWidth);
        const markerWorld = new THREE.Vector3(markerWidthNdc.x, markerWidthNdc.y, 0);
        markerWorld.applyMatrix4(this._camera.projectionMatrixInverse);
        const markerWidthWorld = markerWorld.x;
        this.marker.scale.setScalar((newRadius + markerWidthWorld) / RADIUS);
        const piece = this.selectedPieceType;
        if (piece != null) {
            const tilePosition = this.pieceTypes.indexOf(piece);
            if (tilePosition < 0) {
                throw new Error('somehow selected a piece type which is not a real piece type');
            }
            this.marker.position.copy(this.coloredMeshes()[tilePosition].position);
        }
    }
}

export default Hud;