import {MouseState} from "./types";
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

// const hudElements = [
//     document.createElement('p'),
//     document.createElement('p'),
//     document.createElement('p'),
//     document.createElement('p'),
//     document.createElement('p'),
//     document.createElement('p'),
//     document.createElement('p'),
// ];

// function updateHudTiles() {
//     for (const [tile, _] of hudTiles) {
//         hudScene.remove(tile);
//     }
//
//     switch (game.colorToMove()) {
//         case HiveColor.Black:
//             hudTiles[0][0] = BLACK_QUEEN_BEE.clone();
//             hudTiles[1][0] = BLACK_SOLDIER_ANT.clone();
//             hudTiles[2][0] = BLACK_SPIDER.clone();
//             hudTiles[3][0] = BLACK_GRASSHOPPER.clone();
//             hudTiles[4][0] = BLACK_BEETLE.clone();
//             hudTiles[5][0] = BLACK_LADYBUG.clone();
//             hudTiles[6][0] = BLACK_MOSQUITO.clone();
//             break;
//         case HiveColor.White:
//             hudTiles[0][0] = WHITE_QUEEN_BEE.clone();
//             hudTiles[1][0] = WHITE_SOLDIER_ANT.clone();
//             hudTiles[2][0] = WHITE_SPIDER.clone();
//             hudTiles[3][0] = WHITE_GRASSHOPPER.clone();
//             hudTiles[4][0] = WHITE_BEETLE.clone();
//             hudTiles[5][0] = WHITE_LADYBUG.clone();
//             hudTiles[6][0] = WHITE_MOSQUITO.clone();
//             break;
//     }
//
//     if (!appended) {
//         const body = document.querySelector('body')!
//         body.style.position = 'relative';
//         renderer.domElement.style.position = 'absolute';
//         renderer.domElement.style.zIndex = '-1';
//         for (const element of hudElements) {
//             body.appendChild(element);
//         }
//     }
//
//     for (let i = 0; i < hudTiles.length; i++) {
//         hudElements[i].style.position = 'absolute';
//
//         const x = -5 + 10 / 7 * i + (10 / 7) / 2;
//         const y = hudCamera.top - 1;
//
//         const positionNDC = new THREE.Vector3(x, y, 0);
//         positionNDC.applyMatrix4(hudCamera.projectionMatrix);
//         const windowX = (positionNDC.x / 2 + 1 / 2) * window.innerWidth;
//         const windowY = (-positionNDC.y / 2 + 1 / 2) * window.innerHeight;
//
//         const offsetX = -5;
//         const offsetY = -10;
//         hudElements[i].style.left = `${windowX + offsetX}px`;
//         hudElements[i].style.top = `${windowY + offsetY}px`;
//
//         hudElements[i].textContent = String(game.getTilesRemaining(game.colorToMove(), hudTiles[i][1]));
//
//         const tile = hudTiles[i][0];
//         tile.position.set(x, y, 0)
//         hudScene.add(tile);
//     }
// }

class HUD {
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
        this.pieceCountElements.forEach(e => document.body.appendChild(e));

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
        // console.log(clickedWorld)
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

            const offsetX = -5;
            const offsetY = -10;
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