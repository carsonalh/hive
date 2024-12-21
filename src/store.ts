import {GameplayScene} from "./gameplay-scene";
import OnlineScene from "./online-scene";
import LocalScene from "./local-scene";

export interface HiveGameStore {
    scene: GameplayScene | null;
}

const store: HiveGameStore = {
    scene: null,
}

export const getStore = (): HiveGameStore => store;

export const setOnlineScene = async () => {
    console.log('creating the OnlineScene')
    const scene = await OnlineScene.create();
    console.log('done creating the OnlineScene')
    store.scene = scene;
    return scene;
}

export const setLocalScene = async () => {
    const scene = await LocalScene.create();
    store.scene = scene;
    return scene;
};
