import Component from "./component";
import {
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
    OrthographicCamera,
    PlaneGeometry,
    Scene,
    ShapeGeometry
} from "three";
import {
    BLACK_BEETLE,
    BLACK_GRASSHOPPER,
    BLACK_LADYBUG,
    BLACK_MOSQUITO,
    BLACK_QUEEN_BEE,
    BLACK_SOLDIER_ANT,
    BLACK_SPIDER, HEXAGON_SHAPE,
    WHITE_BEETLE,
    WHITE_GRASSHOPPER,
    WHITE_LADYBUG,
    WHITE_MOSQUITO,
    WHITE_QUEEN_BEE,
    WHITE_SOLDIER_ANT,
    WHITE_SPIDER
} from "./tiles";
import {HivePieceType} from "./hive-game";

export default class HudComponent extends Component {
    selectedPieceType: HivePieceType | null = null;
    scene = new Scene();
    camera = new OrthographicCamera(-1, 1, window.innerHeight / window.innerWidth, -window.innerHeight / window.innerWidth);
    backgroundPlane = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
        color: 0x353232,
        side: DoubleSide,
    }));
    moveIndicator: HTMLDivElement;
    bubbleElements = Array.from({length: 7}, () => {
        const el = document.createElement('span');
        el.classList.add('hud-bubble-text');
        return el;
    });
    bubbleMeshes = Array.from({length: 7}, () => new Mesh(
        new ShapeGeometry(HEXAGON_SHAPE.clone()),
        new MeshBasicMaterial({color: 0xffffff})
    ));
    marker = new Mesh(
        new ShapeGeometry(HEXAGON_SHAPE.clone()),
        new MeshBasicMaterial({color: 0x474545})
    );
    whiteQueenBee = WHITE_QUEEN_BEE.clone();
    whiteSoldierAnt = WHITE_SOLDIER_ANT.clone();
    whiteBeetle = WHITE_BEETLE.clone();
    whiteSpider = WHITE_SPIDER.clone();
    whiteGrasshopper = WHITE_GRASSHOPPER.clone();
    whiteLadybug = WHITE_LADYBUG.clone();
    whiteMosquito = WHITE_MOSQUITO.clone();
    blackQueenBee = BLACK_QUEEN_BEE.clone();
    blackSoldierAnt = BLACK_SOLDIER_ANT.clone();
    blackBeetle = BLACK_BEETLE.clone();
    blackSpider = BLACK_SPIDER.clone();
    blackGrasshopper = BLACK_GRASSHOPPER.clone();
    blackLadybug = BLACK_LADYBUG.clone();
    blackMosquito = BLACK_MOSQUITO.clone();

    constructor() {
        super();

        this.moveIndicator = document.createElement('div');
        this.moveIndicator.classList.add('hud-move-indicator');
    }
}