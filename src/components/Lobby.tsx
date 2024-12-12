import React from 'react';
import {Link} from "react-router";

const Lobby: React.FC = () => {
    return <div className="online-overlay-container">
        <Link to=".." className="hex-button back">Back</Link>
        <div className="hex-button-container">
            <Link to="create">Create PvP</Link>
            <Link to="join">Join PvP</Link>
        </div>
    </div>;
}

export default Lobby;