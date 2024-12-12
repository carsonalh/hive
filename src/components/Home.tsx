import React from "react";
import {Link} from "react-router";

const Home: React.FC = () => {
    return <div className="App">
        <h1>HiveGame.io</h1>
        <div className="hex-button-container">
            <Link to='local'>Play Local</Link>
            <Link to='online'>Play Online</Link>
        </div>
    </div>;
};

export default Home;
