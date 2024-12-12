import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router";
import {useClientRefContext} from "./OnlineContainer";

const PvpMenuCreate: React.FC = () => {
    const clientRef = useClientRefContext();
    const [id, setId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const client = clientRef.current;
        let didConnect = false;

        (async () => {
            const gameId = await client.createPvpGame();
            setId(gameId);
            client.setHandlers({
                connectHandler: () => {
                    didConnect = true;
                    navigate("../play");
                }
            })
            client.joinPvpGame(gameId);
        })();

        return () => {
            if (!didConnect) {
                client.disconnect();
            }
        };
    }, []);

    return <>
        <Link to="..">Back</Link>
        {id == null
            ? <p>Loading...</p>
            : <p>{id}</p>}
    </>;
}

export default PvpMenuCreate;