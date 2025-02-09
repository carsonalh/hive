import System from "./system";
import MeshBankComponent from "../components/mesh-bank-component";
import {createTile} from "../tiles";
import {HiveColor, HivePieceType} from "../hive-game";
import {Mesh} from "three";

export default class MeshBankLoadSystem extends System {
    onCreate() {
        const meshBankComponent = this.registry.getSingletonComponent(MeshBankComponent);

        createTile(HiveColor.Black, HivePieceType.QueenBee).then(mesh => (meshBankComponent.blackQueenBee = mesh));
        createTile(HiveColor.Black, HivePieceType.SoldierAnt).then(mesh => (meshBankComponent.blackSoldierAnt = mesh));
        createTile(HiveColor.Black, HivePieceType.Spider).then(mesh => (meshBankComponent.blackSpider = mesh));
        createTile(HiveColor.Black, HivePieceType.Grasshopper).then(mesh => (meshBankComponent.blackGrasshopper = mesh));
        createTile(HiveColor.Black, HivePieceType.Beetle).then(mesh => (meshBankComponent.blackBeetle = mesh));
        createTile(HiveColor.Black, HivePieceType.Ladybug).then(mesh => (meshBankComponent.blackLadybug = mesh));
        createTile(HiveColor.Black, HivePieceType.Mosquito).then(mesh => (meshBankComponent.blackMosquito = mesh));
        createTile(HiveColor.White, HivePieceType.QueenBee).then(mesh => (meshBankComponent.whiteQueenBee = mesh));
        createTile(HiveColor.White, HivePieceType.SoldierAnt).then(mesh => (meshBankComponent.whiteSoldierAnt = mesh));
        createTile(HiveColor.White, HivePieceType.Spider).then(mesh => (meshBankComponent.whiteSpider = mesh));
        createTile(HiveColor.White, HivePieceType.Grasshopper).then(mesh => (meshBankComponent.whiteGrasshopper = mesh));
        createTile(HiveColor.White, HivePieceType.Beetle).then(mesh => (meshBankComponent.whiteBeetle = mesh));
        createTile(HiveColor.White, HivePieceType.Ladybug).then(mesh => (meshBankComponent.whiteLadybug = mesh));
        createTile(HiveColor.White, HivePieceType.Mosquito).then(mesh => (meshBankComponent.whiteMosquito = mesh));
    }
}