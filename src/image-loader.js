import {Color, DefaultLoadingManager, Loader, Texture, TextureLoader} from "three";

// TODO make this typescript but turn off transpilation of classes to functions
class ImageLoader extends Loader {
    constructor() {
        super(DefaultLoadingManager);
    }

    load(url, onLoad, onProgress, onError) {
        const image = document.createElement('img');
        image.src = url;

        if (onProgress != null) {
            image.addEventListener('progress', onProgress);
        }

        if (onError != null) {
            image.addEventListener('error', onError);
        }

        image.addEventListener('load', () => {
            onLoad(image);
        });
    }

    parse() {}
}


export default ImageLoader;
