import * as THREE from 'three';
import { RADIUS, TILE_GAP } from "./tiles";

/**
 * See this article as an implementation guide, specifically the 'Axial' coordinates.
 *
 * https://www.redblobgames.com/grids/hexagons/
 */
export class HexGrid {
    private static readonly BASIS_Q = new THREE.Vector2(1, 0);
    private static readonly BASIS_R = new THREE.Vector2(1 / 2, -Math.sqrt(3) / 2);

    public static distance(a: HexVector, b: HexVector): number {
        const v = a.subtract(b);
        return Math.round((Math.abs(v.q) + Math.abs(v.q + v.r) + Math.abs(v.r)) / 2);
    }

    public constructor(private horizontalSpacing = 2 * RADIUS + TILE_GAP) {}

    public hexToEuclidean(vector: HexVector): THREE.Vector2 {
        const q = new THREE.Vector2().copy(HexGrid.BASIS_Q);
        const r = new THREE.Vector2().copy(HexGrid.BASIS_R);

        q.multiplyScalar(vector.q);
        r.multiplyScalar(vector.r);

        q.add(r);
        q.multiplyScalar(this.horizontalSpacing);

        return q;
    }

    /** Rounds to an integer hex coordinate */
    public euclideanToHex(vector: THREE.Vector2): HexVector {
        const toTransform = vector.clone();

        const basisInverse = new THREE.Matrix3(
            1, Math.sqrt(3) / 3, 0,
            0, -2 * Math.sqrt(3) / 3, 0,
            0, 0, 1
        );
        toTransform.multiplyScalar(1 / this.horizontalSpacing);
        toTransform.applyMatrix3(basisInverse);

        // implemented from https://www.redblobgames.com/grids/hexagons/#rounding

        const fractionalQ = toTransform.x;
        const fractionalR = toTransform.y;
        const fractionalS = -toTransform.x - toTransform.y;

        let q = Math.round(fractionalQ);
        let r = Math.round(fractionalR);
        let s = Math.round(fractionalS);

        const qDiff = Math.abs(q - fractionalQ);
        const rDiff = Math.abs(r - fractionalR);
        const sDiff = Math.abs(s - fractionalS);

        if (qDiff > rDiff && qDiff > sDiff) {
            q = -r - s;
        } else if (rDiff > sDiff) {
            r = -q-s;
        } else {
            s = -q-r;
        }

        return new HexVector(q, r);
    }
}

export class HexVector {
    private readonly _q: number;
    private readonly _r: number;

    public get q() {
        return this._q;
    }

    public get r() {
        return this._r;
    }

    public constructor(q: number, r: number) {
        if (!Number.isInteger(q) || !Number.isInteger(r)) {
            throw new Error('must have integral components when constructing a hex coordinate');
        }

        this._q = q;
        this._r = r;
    }

    public add(other: HexVector): HexVector {
        return new HexVector(this._q + other._q, this._r + other._r);
    }

    public subtract(other: HexVector): HexVector {
        return new HexVector(this._q - other._q, this._r - other._r);
    }

    /** The scalar must be an integer */
    public multiplyScalar(scalar: number): HexVector {
        if (!Number.isInteger(scalar)) {
            throw new RangeError('scalar must be an integer');
        }

        return new HexVector(scalar * this._q, scalar * this._r);
    }

    public toString(): string {
        return `HexVector [${this._q}, ${this._r}]`;
    }
}
