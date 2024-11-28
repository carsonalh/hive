export enum GameplayMode {
    None,
    Online,
    Local,
}

export default class NavigationOverlay {
    private activeElements: HTMLElement[] = [];

    private readonly mainMenuElements: HTMLElement[] = [];
    private readonly gameplayElements: HTMLElement[] = [];
    private gameplayMode: GameplayMode = GameplayMode.None;

    public constructor(private onGameplayModeChange?: (mode: GameplayMode) => unknown) {
        // create the main menu layout
        {
            const background = document.createElement('div');
            background.style.position = 'absolute';
            background.style.display = 'block';
            background.style.left = '0';
            background.style.top = '0';
            background.style.width = '100vw';
            background.style.height = '100vh';
            background.style.backgroundColor = 'red';
            background.style.zIndex = '1';

            const playOnlineButton = document.createElement('button');
            playOnlineButton.textContent = 'Play Online';
            playOnlineButton.style.marginTop = '100px';

            playOnlineButton.onclick = () => {
                this.toOnlineGameplayMode();
                this.transition(this.gameplayElements);
            };

            const playLocallyButton = document.createElement('button');
            playLocallyButton.textContent = 'Play Locally';
            playLocallyButton.style.marginTop = '200px';

            playLocallyButton.onclick = () => {
                this.toLocalGameplayMode();
                this.transition(this.gameplayElements);
            };

            for (const button of [playOnlineButton, playLocallyButton]) {
                button.style.zIndex = '2';
                button.style.position = 'absolute';
                button.style.marginLeft = '50vw';
                button.style.transform = 'translate(-50%, 0)';
            }

            background.appendChild(playOnlineButton);
            background.appendChild(playLocallyButton);

            this.mainMenuElements = [background];
        }

        // gameplay setup
        {
            const backToMainMenuButton = document.createElement('button');
            backToMainMenuButton.textContent = 'ExitGame';

            backToMainMenuButton.style.position = 'absolute';
            backToMainMenuButton.style.top = '100px';
            backToMainMenuButton.style.right = '100px';

            backToMainMenuButton.onclick = () => {
                this.transition(this.mainMenuElements);
            };

            this.gameplayElements.push(backToMainMenuButton);
        }

        this.transition(this.mainMenuElements);
    }

    private toLocalGameplayMode() {
        if (this.gameplayMode !== GameplayMode.Local) {
            this.onGameplayModeChange && this.onGameplayModeChange(GameplayMode.Local);
        }

        this.gameplayMode = GameplayMode.Local;
    }

    private toOnlineGameplayMode() {
        if (this.gameplayMode !== GameplayMode.Online) {
            this.onGameplayModeChange && this.onGameplayModeChange(GameplayMode.Online);
        }

        this.gameplayMode = GameplayMode.Online;
    }

    private transition(elements: HTMLElement[]) {
        this.clear();
        this.show(...elements);
    }

    private show(...elements: HTMLElement[]) {
        for (const e of elements) {
            document.body.appendChild(e);
        }

        this.activeElements.push(...elements);
    }

    private clear() {
        for (const e of this.activeElements) {
            document.body.removeChild(e);
        }

        this.activeElements = [];
    }
}