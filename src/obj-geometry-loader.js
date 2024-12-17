import {BufferGeometry, Group, Loader, LoadingManager, Mesh} from "three";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";

/**
 * Works when only one mesh is given in the obj file.
 */
export default class ObjGeometryLoader extends Loader {
    constructor(manager) {
        super(manager);
        this.objLoader = new OBJLoader();
    }

    load(url, onLoad, onProgress, onError) {
        this.objLoader.load(url, (data) => {
            let found = false;

            data.traverse((o) => {
                if (!found && o.isMesh) {
                    o.geometry.rotateX(Math.PI / 2);
                    onLoad(o.geometry.clone());
                    found = true;
                }
            });
        }, onProgress, onError);
    }

    parse() {
    }
}
