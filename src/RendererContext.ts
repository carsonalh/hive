import {PCFSoftShadowMap, WebGLRenderer} from "three";
import {createContext} from "react";

const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

export const RendererContext = createContext(renderer);
