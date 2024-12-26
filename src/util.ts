import {Matrix3, Vector2, Vector2Like, Vector3} from 'three'

/**
 * Rotates v about k.  Mutates v but not k.  Rotates anticlockwise if k is normal to a watch face,
 * viz. according to the right-hand rule.
 *
 * See https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula .
 *
 * @param v To be rotated about k and mutated.
 * @param k The axis of rotation.
 * @param angle The angle to rotate in radians
 */
export function rotateAboutVector(v: Vector3, k: Vector3, angle: number): void {
    const vTerm = v.clone().multiplyScalar(Math.cos(angle));
    const crossTerm = k.clone().cross(v).multiplyScalar(Math.sin(angle));
    const dotTerm = k.clone().multiplyScalar(
        k.dot(v) * (1 - Math.cos(angle))
    );

    vTerm.add(crossTerm).add(dotTerm);

    v.copy(vTerm);
}

/**
 * Converts ndc coordinates to screen coordinates.
 */
export function ndcToScreen(ndc: Vector2Like, screen: Vector2): void {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    screen.copy(ndc);
    screen.applyMatrix3(new Matrix3(
        ww / 2, 0, ww / 2,
        0, -wh / 2, wh / 2,
        0, 0, 1
    ));
}

/**
 * Converts screen coordinates to ndc coordinates.
 */
export function screenToNdc(screen: Vector2Like, ndc: Vector2): void {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    ndc.copy(screen);
    ndc.applyMatrix3(new Matrix3(
        2 / ww, 0, -1,
        0, -2 / wh, 1,
        0, 0, 1
    ));
}

export function eventNdcCoords(event: {clientX: number; clientY: number}): Vector2 {
    const result = new Vector2();
    const {clientX, clientY} = event;
    screenToNdc({x: clientX, y: clientY}, result);
    return result;
}

export type ConstructorOf<T> = new (...args: any[]) => T;
