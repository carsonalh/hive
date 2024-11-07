import {HiveColor, HiveGame, HivePieceType} from "./hive-game";
import * as THREE from "three";
import {
    BLACK_BEETLE,
    BLACK_GRASSHOPPER,
    BLACK_LADYBUG,
    BLACK_MOSQUITO,
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    BLACK_SPIDER,
    WHITE_BEETLE,
    WHITE_GRASSHOPPER,
    WHITE_LADYBUG,
    WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT,
    WHITE_SPIDER
} from "./tiles";
import {MouseState} from "./mouse-state";

export interface ReserveTileSelector {
    selectedPieceTypeForPlacement(): HivePieceType | null;
}

class HUD implements ReserveTileSelector {
    private readonly _scene: THREE.Scene;
    private readonly _camera: THREE.OrthographicCamera;
    private readonly game: HiveGame;
    private readonly whiteMeshes: THREE.Mesh[];
    private readonly blackMeshes: THREE.Mesh[];
    private readonly pieceTypes: HivePieceType[];
    private readonly pieceCountElements: HTMLParagraphElement[];
    private readonly square: THREE.Mesh;
    private selected: HivePieceType | null;

    private lastColorToMove: HiveColor;
    private lastMove: number;

    public constructor(game: HiveGame) {
        this.game = game;
        this._scene = new THREE.Scene();
        this._camera = new THREE.OrthographicCamera(-5, 5, 5 * window.innerHeight / window.innerWidth, -5 * window.innerHeight / window.innerWidth);
        this._camera.position.z = 5;
        this.selected = null;

        this.lastColorToMove = game.colorToMove();
        this.lastMove = game.moveNumber();

        const shape = new THREE.Shape();
        shape.moveTo(0, -1);
        shape.lineTo(0, 1);
        shape.lineTo(10 / 7, 1);
        shape.lineTo(10 / 7, -1);
        shape.closePath()
        this.square = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({color: new THREE.Color(0xff0000)}));

        this.pieceCountElements = new Array(7).fill(0).map(_ => document.createElement('p'));
        this.pieceCountElements.forEach(e => {
            // So the styling offsets are relative to the centre of the element
            e.style.transform = 'translate(-50%, -50%)';
            e.style.display = 'block';
            document.body.appendChild(e)
        });

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

        this.pieceTypes = [
            HivePieceType.QueenBee,
            HivePieceType.SoldierAnt,
            HivePieceType.Spider,
            HivePieceType.Grasshopper,
            HivePieceType.Beetle,
            HivePieceType.Ladybug,
            HivePieceType.Mosquito,
        ];

        this.placeMeshesAndPieceCounts(this.coloredMeshes());
    }

    /**
     * Return true if the click hit something in the hud.
     */
    public onClick(e: MouseEvent, _: MouseState): boolean {
        const raycaster = new THREE.Raycaster();
        const clicked = new THREE.Vector2(
            2 * e.clientX / window.innerWidth - 1,
            -2 * e.clientY / window.innerHeight + 1,
        );
        const gameSurface = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        raycaster.setFromCamera(clicked, this._camera);
        const clickedWorld = new THREE.Vector3();
        raycaster.ray.intersectPlane(gameSurface, clickedWorld);
        if (clickedWorld.y > this._camera.top - 2) {
            const tileIndex = Math.floor((clickedWorld.x + 5) * 7 / 10)
            this.selected = this.pieceTypes[tileIndex] ?? null;
            this.square.position.set(-5 + 10 / 7 * tileIndex, this._camera.top - 1, -1)
            this._scene.add(this.square);
            return true;
        } else {
            return false;
        }
    }

    public onClickAway(): void {
        this._scene.remove(this.square);
        this.selected = null;
    }

    public onResize() {
        this._camera.top = 5 * window.innerHeight / window.innerWidth;
        this._camera.bottom = -5 * window.innerHeight / window.innerWidth;
        this._camera.updateProjectionMatrix();
        for (const tile of this.coloredMeshes()) {
            tile.position.y = this._camera.top - 1;
        }
    }

    public onUpdate() {
        let changed = false;

        if (this.lastColorToMove !== this.game.colorToMove()) {
            this.lastColorToMove = this.game.colorToMove();
            changed = true;
        }

        if (this.lastMove !== this.game.moveNumber()) {
            this.lastMove = this.game.moveNumber();
            changed = true;
        }

        if (changed) {
            this._scene.clear();
            this.placeMeshesAndPieceCounts(this.coloredMeshes())
        }
    }

    /**
     * Gets which piece type should be placed based on the HUD selection.
     */
    public selectedPieceTypeForPlacement(): HivePieceType | null {
        return this.selected;
    }

    public get scene(): THREE.Scene {
        return this._scene;
    }

    public get camera(): THREE.Camera {
        return this._camera;
    }

    private coloredMeshes(): THREE.Mesh[] {
        return this.game.colorToMove() === HiveColor.Black
            ? this.blackMeshes
            : this.whiteMeshes;
    }

    private placeMeshesAndPieceCounts(meshes: THREE.Mesh[]): void {
        for (let i = 0; i < meshes.length; i++) {
            this.pieceCountElements[i].style.position = 'absolute';

            const x = -5 + 10 / 7 * i + (10 / 7) / 2;
            const y = this._camera.top - 1;

            const positionNDC = new THREE.Vector3(x, y, 0);
            positionNDC.applyMatrix4(this._camera.projectionMatrix);
            const windowX = (positionNDC.x / 2 + 1 / 2) * window.innerWidth;
            const windowY = (-positionNDC.y / 2 + 1 / 2) * window.innerHeight;

            const offsetX = 0//-5;
            const offsetY = 0//-10;
            this.pieceCountElements[i].style.left = `${windowX + offsetX}px`;
            this.pieceCountElements[i].style.top = `${windowY + offsetY}px`;

            this.pieceCountElements[i].textContent = String(
                this.game.getTilesRemaining(this.game.colorToMove(), this.pieceTypes[i])
            );

            const tile = meshes[i];
            tile.position.set(x, y, 0)
            this._scene.add(tile);
        }
    }
}

export default HUD;