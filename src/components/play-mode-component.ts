import Component from "./component";
import OnlineClient from "../online-client";

export enum PlayMode {
    Local,
    Online,
}

export default class PlayModeComponent extends Component {
    private _client: OnlineClient | null = null;

    playMode(): PlayMode {
        return this._client == null ? PlayMode.Local : PlayMode.Online;
    }

    client(): OnlineClient {
        if (this._client == null) {
            throw new Error('cannot get online client from play mode component because the mode is local')
        }

        return this._client
    }

    setClient(client?: OnlineClient) {
        this._client = client ?? null;
    }
}