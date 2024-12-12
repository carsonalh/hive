import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router";
import {useClientReadyContext, useClientRefContext} from "./OnlineContainer";

const PvpMenuJoin: React.FC = () => {
    const [id, setId] = useState<string>('');
    const clientRef = useClientRefContext();
    const navigate = useNavigate();
    const clientReady = useClientReadyContext();

    const [didSubmit, setDidSubmit] = useState(false)

    const onSubmit = () => {
        setDidSubmit(true);
    };

    useEffect(() => {
        if (!didSubmit || !clientReady) return;

        const client = clientRef.current;
        client.joinPvpGame(id);
        navigate("../play");
    }, [didSubmit, clientReady]);

    return <>
        <Link to="..">Back</Link>
        <p>Enter the id of the game you would like to join</p>
        <input type='text' value={id} onChange={e => setId(e.target.value.toUpperCase())}></input>
        <button onPointerDown={onSubmit}>Join</button>
    </>;
}

export default PvpMenuJoin;
