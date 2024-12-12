import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router";
import {useClientReadyContext, useClientRefContext} from "./OnlineContainer";

const PvpMenuCreate: React.FC = () => {
    const clientRef = useClientRefContext();
    const [id, setId] = useState<string | null>(null);
    const navigate = useNavigate();
    const clientReady = useClientReadyContext();

    useEffect(() => {
        if (!clientReady) return;

        const client = clientRef.current;
        let didConnect = false;

        (async () => {
            client.setHandlers({
                connectHandler: () => {
                    didConnect = true;
                    navigate("../play");
                }
            })
            const gameId = await client.createPvpGame();
            setId(gameId);
        })();

        return () => {
            if (!didConnect) {
                client.disconnect();
            }
        };
    }, [clientReady]);

    return <>
        <Link to="..">Back</Link>
        {id == null
            ? <p>Loading...</p>
            : <p>{id}</p>}
    </>;
}

export default PvpMenuCreate;