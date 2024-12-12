import React, {useState} from 'react';
import {Link, useNavigate} from "react-router";
import {useClientRefContext} from "./OnlineContainer";

const PvpMenuJoin: React.FC = () => {
    const [id, setId] = useState<string>('');
    const clientRef = useClientRefContext();
    const navigate = useNavigate();

    const onSubmit = () => {
        const client = clientRef.current;
        client.joinPvpGame(id);
        navigate("../play");
    };

    return <>
        <Link to="..">Back</Link>
        <p>Enter the id of the game you would like to join</p>
        <input type='text' value={id} onChange={e => setId(e.target.value.toUpperCase())}></input>
        <button onPointerDown={onSubmit}>Join</button>
    </>;
}

export default PvpMenuJoin;
