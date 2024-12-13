import * as THREE from 'three';
import { RADIUS, TILE_GAP } from './constants';

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

    public hexToEuclidean(vector: HexVectorLike): THREE.Vector2 {
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
        }

        return new HexVector(q, r);
    }
}

export interface HexVectorLike {
    q: number;
    r: number;
}

export class HexVector implements HexVectorLike {
    private readonly _q: number;
    private readonly _r: number;

    private static readonly ADJACENT_VECTORS_AT_ORIGIN = [
        new HexVector(1, 0),
        new HexVector(0, 1),
        new HexVector(-1, 0),
        new HexVector(0, -1),
        new HexVector(1, -1),
        new HexVector(-1, 1),
    ];

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

    public adjacentVectors(): HexVector[] {
        return HexVector.ADJACENT_VECTORS_AT_ORIGIN.map(v => v.add(this));
    }

    public equals(other: HexVector): boolean {
        return this._q === other._q && this._r === other._r;
    }

    public json(): {q: number, r: number} {
        return {
            q: this._q,
            r: this._r
        }
    }

    public toString(): string {
        return `HexVector [${this._q}, ${this._r}]`;
    }
}

export class HexMatrix {
    public constructor(private a00: number, private a01: number,
                       private a10: number, private a11: number) {
    }

    public transform(v: HexVector): HexVector {
        return new HexVector(this.a00 * v.q + this.a01 * v.r,
                             this.a10 * v.q + this.a11 * v.r);
    }

    public power(n: number): HexMatrix {
        if (!Number.isInteger(n)) {
            throw new RangeError('power must be an integer');
        }

        if (n < 0) {
            throw new RangeError('power must be non-negative');
        }

        const result = new HexMatrix(1, 0, 0, 1);

        while (--n > 0) {
            result.leftMultiplyInPlace(this);
        }

        return result;
    }

    /**
     * This matrix (A) multiplied with the other (B).  The result is AB
     */
    public multiply(B: HexMatrix): HexMatrix {
        const cloned = B.clone();
        cloned.leftMultiplyInPlace(this);
        return cloned;
    }

    private clone(): HexMatrix {
        return new HexMatrix(this.a00, this.a01, this.a10, this.a11);
    }

    private leftMultiplyInPlace(other: HexMatrix): void {
        const a00 = other.a00 * this.a00 + other.a01 * this.a10;
        const a01 = other.a00 * this.a01 + other.a01 * this.a11;
        const a10 = other.a10 * this.a00 + other.a11 * this.a10;
        const a11 = other.a10 * this.a01 + other.a11 * this.a11;

        this.a00 = a00;
        this.a01 = a01;
        this.a10 = a10;
        this.a11 = a11;
    }
}
