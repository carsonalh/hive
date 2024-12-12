import React from 'react';
import {Link} from "react-router";

const Lobby: React.FC = () => {
    return <>
        <Link to="..">Back</Link>
        <Link to="create">Create PvP</Link>
        <Link to="join">Join PvP</Link>
    </>;
}

export default Lobby;