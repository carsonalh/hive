import System from "./system";
import HiveGameComponent from "../components/hive-game-component";

export default class GameOverSystem extends System {
    private modal: HtmlDivElement;

    public constructor(registry: EntityRegistry) {
        super(registry);

        this.modal = document.createElement('div')!;
    }

    onUpdate(): void {
        const hiveGameComponent = this.registry.getSingletonComponent(HiveGameComponent);
        const {game} = hiveGameComponent;
        const over = game.isOver();
        const winner = game.winner();

        // if the game is over, show a modal to the user, the clicking of which brings them back to the homepage
    }
}
