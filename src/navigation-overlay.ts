import {LEFT_BUTTON} from "./constants";

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
            const mainMenu = document.createElement('div');
            mainMenu.classList.add('navigation-overlay');

            const title = document.createElement('h1');
            title.textContent = 'HiveGame.io';

            const backgroundHexagon1 = document.createElement('div');
            backgroundHexagon1.classList.add('background-hexagon');
            const backgroundHexagon2 = document.createElement('div');
            backgroundHexagon2.classList.add('background-hexagon');
            const backgroundHexagon3 = document.createElement('div');
            backgroundHexagon3.classList.add('background-hexagon');

            title.appendChild(backgroundHexagon1);
            title.appendChild(backgroundHexagon2);
            title.appendChild(backgroundHexagon3);

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('hex-button-container');

            const playOnlineButton = document.createElement('button');
            playOnlineButton.textContent = 'Play Online';

            playOnlineButton.addEventListener('mousedown', e => {
                if (e.button === LEFT_BUTTON) {
                    this.toOnlineGameplayMode();
                    this.transition(this.gameplayElements);
                }
            });

            const playLocallyButton = document.createElement('button');
            playLocallyButton.textContent = 'Local PvP';

            playLocallyButton.addEventListener('mousedown', e => {
                if (e.button === LEFT_BUTTON) {
                    this.toLocalGameplayMode();
                    this.transition(this.gameplayElements);
                }
            });

            buttonContainer.appendChild(playOnlineButton);
            buttonContainer.appendChild(playLocallyButton);

            mainMenu.appendChild(title);
            mainMenu.appendChild(buttonContainer);

            this.mainMenuElements = [mainMenu];
        }

        // gameplay setup
        {
            const backToMainMenuButton = document.createElement('button');
            backToMainMenuButton.classList.add('hex-button', 'navigation-button-back');
            backToMainMenuButton.textContent = 'Exit Game';

            backToMainMenuButton.addEventListener('mousedown', e => {
                if (e.button === LEFT_BUTTON) {
                    this.transition(this.mainMenuElements);
                }
            })

            this.gameplayElements = [backToMainMenuButton];
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