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

        const createPvpButton = document.createElement("button");
        createPvpButton.textContent = 'Create PvP';
        const createPvpDisplay = document.createElement("div");

        const joinSubmitButton = document.createElement("button");
        joinSubmitButton.textContent = 'Submit';
        const joinPvpButton = document.createElement("button");
        joinPvpButton.textContent = 'Join PvP';
        const joinPvpInput = document.createElement("input");
        joinPvpInput.type = 'text';

        const backButton = document.createElement('button');
        backButton.textContent = 'Back';

        this.states = {
            [OnlineOverlayState.Master]: [createPvpButton, joinPvpButton],
            [OnlineOverlayState.Create]: [backButton, createPvpDisplay],
            [OnlineOverlayState.Join]: [backButton, joinPvpInput, joinSubmitButton],
        };

        createPvpButton.addEventListener('mousedown', async e => {
            if (e.button === LEFT_BUTTON) {
                createPvpDisplay.textContent = await client.createPvpGame();

                this.toState(OnlineOverlayState.Create);
            }
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

        backButton.addEventListener('mousedown', e => {
            if (e.button === LEFT_BUTTON) {
                console.log('clicked the back button')
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