import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router";
import {useClientReadyContext, useClientRefContext} from "./OnlineContainer";

const PvpMenuJoin: React.FC = () => {
    const [id, setId] = useState<string>('');
    const clientRef = useClientRefContext();
    const navigate = useNavigate();
    const clientReady = useClientReadyContext();

    const [didSubmit, setDidSubmit] = useState(false)
    const [joinError, setJoinError] = useState(false);

    const onSubmit = () => {
        setDidSubmit(true);
    };

    useEffect(() => {
        if (!didSubmit || !clientReady) return;

        const client = clientRef.current;
        client
            .joinPvpGame(id)
            .then(() => navigate("../play"))
            .catch(() => {
                setDidSubmit(false);
                setJoinError(true);
            });
    }, [didSubmit, clientReady]);

    return <div className="online-overlay-container">
        <main className="join">
            <p>Enter the id of the game you would like to join</p>
            <input type='text' value={id} onChange={e => setId(e.target.value.toUpperCase())}></input>
            <button className="hex-button" onPointerDown={onSubmit}>Join</button>
            {joinError
                ? <p>Error joining game with that id</p>
                : null}
        </main>
        <Link to=".." className="hex-button back">Back</Link>
    </div>;
}

export default PvpMenuJoin;
