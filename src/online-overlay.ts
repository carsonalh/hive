import OnlineClient from "./online-client";
import {LEFT_BUTTON} from "./constants";

enum OnlineOverlayState {
    Master,
    Create,
    Join,
}

export default class OnlineOverlay {
    private readonly container: HTMLElement;
    private isShown = false;
    private state: OnlineOverlayState;
    private states: Record<OnlineOverlayState, HTMLElement[]>;

    public constructor(private client: OnlineClient) {
        const container = document.createElement("div");
        container.classList.add('online-overlay-container');

        const createPvpButton = document.createElement("button");
        createPvpButton.textContent = 'Create PvP';

        const createPvpDisplay = document.createElement("div");
        const createPvpParagraph = document.createElement("p");
        createPvpParagraph.textContent = 'Give this code to another player to play a game with them...';

        const joinPvpButton = document.createElement("button");
        joinPvpButton.textContent = 'Join PvP';

        const joinSubmitButton = document.createElement("button");
        joinSubmitButton.textContent = 'Join';
        const joinBackButton = document.createElement('button');
        joinBackButton.textContent = 'Back';
        const joinHexButtonContainer = document.createElement('div');
        joinHexButtonContainer.classList.add('hex-button-container');
        joinHexButtonContainer.appendChild(joinSubmitButton);
        joinHexButtonContainer.appendChild(joinBackButton);

        const joinParagraph = document.createElement('p');
        joinParagraph.textContent = 'Enter a game\'s code to join...';
        const joinPvpInput = document.createElement("input");
        joinPvpInput.type = 'text';
        joinPvpInput.placeholder = 'Code';

        const createBackButton = document.createElement('button');
        createBackButton.textContent = 'Back';
        createBackButton.classList.add('hex-button');

        const joinContainer = document.createElement('main');
        joinContainer.classList.add('join');
        joinContainer.appendChild(joinPvpInput);
        joinContainer.appendChild(joinHexButtonContainer);

        const createContainer = document.createElement('main');
        createContainer.classList.add('create');
        createContainer.appendChild(createPvpParagraph);
        createContainer.appendChild(createPvpDisplay);
        createContainer.appendChild(createBackButton);

        const hostedGameContainer = document.createElement('div');
        hostedGameContainer.classList.add('hex-button-container', 'hosted-game-container');

        hostedGameContainer.appendChild(createPvpButton);
        hostedGameContainer.appendChild(joinPvpButton);

        this.states = {
            [OnlineOverlayState.Master]: [hostedGameContainer],
            [OnlineOverlayState.Create]: [createContainer],
            [OnlineOverlayState.Join]: [joinContainer],
        };

        createPvpButton.addEventListener('mousedown', async e => {
            if (e.button === LEFT_BUTTON) {
                createPvpDisplay.textContent = await client.createPvpGame();

                this.toState(OnlineOverlayState.Create);
            }
        });

        joinPvpInput.addEventListener('input', () => {
            joinPvpInput.value = joinPvpInput.value.toUpperCase();
        });

        joinPvpButton.addEventListener('mousedown', e => {
            if (e.button === LEFT_BUTTON) {
                this.toState(OnlineOverlayState.Join);
            }
        });

        joinSubmitButton.addEventListener('mousedown', e => {
            if (e.button === LEFT_BUTTON) {
                const input = joinPvpInput.value;

                try {
                    this.client.joinPvpGame(input);
                } catch (e) {
                    console.error(e);
                }

                this.toState(OnlineOverlayState.Master);
            }
        });

        joinBackButton.addEventListener('mousedown', e => {
            if (e.button === LEFT_BUTTON) {
                this.toState(OnlineOverlayState.Master);
            }
        });

        createBackButton.addEventListener('mousedown', e => {
            if (e.button === LEFT_BUTTON) {
                this.toState(OnlineOverlayState.Master);
            }
        });

        this.state = OnlineOverlayState.Master;
        for (const e of this.states[this.state]) {
            container.appendChild(e);
        }

        this.container = container;
    }

    private toState(state: OnlineOverlayState) {
        if (state === this.state) {
            return;
        }

        for (const e of this.states[this.state]) {
            this.container.removeChild(e);
        }

        for (const e of this.states[state]) {
            this.container.appendChild(e);
        }

        this.state = state;
    }

    public show(): void {
        if (!this.isShown) {
            document.body.appendChild(this.container);
        }

        this.isShown = true;
    }

    public hide(): void {
        if (this.isShown) {
            document.body.removeChild(this.container);
        }
    }
}