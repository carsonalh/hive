import React, {
    ChangeEvent,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react';
import {createRoot} from "react-dom/client";
import {BrowserRouter, Link, Outlet, Route, Routes, useNavigate} from "react-router";
import Game from "./game";
import {getGame} from "./game-store";
import {LocalMoveManager, OnlineMoveManager} from "./move-manager";
import OnlineClient from "./online-client";

export function renderOverlay() {
    createRoot(document.getElementById('react-overlay')!).render(<HiveOverlay/>);
}

const GameContext = createContext<Game>(null!);
const useGame = () => useContext(GameContext);

function HiveOverlay() {
    const [game] = useState(() => getGame());

    return <GameContext.Provider value={game}>
        <BrowserRouter>
            <Routes>
                <Route index element={<HomePage/>}/>
                <Route path='local' element={<LocalSceneLoader/>}/>
                <Route path='online' element={<OnlineSceneLoader/>}>
                    <Route index element={<OnlineMaster/>}/>
                    <Route path='create' element={<OnlineCreate/>}/>
                    <Route path='join' element={<OnlineJoin/>}/>
                    <Route path='play' element={null}/>
                </Route>
            </Routes>
        </BrowserRouter>
    </GameContext.Provider>;
}

function HomePage() {
    return <div className="navigation-overlay">
        <h1>HiveGame.io
            <div className="background-hexagon"></div>
            <div className="background-hexagon"></div>
            <div className="background-hexagon"></div>
        </h1>
        <div className="hex-button-container">
            <Link to='online'>Play Online</Link>
            <Link to='local'>Local PvP</Link>
        </div>
    </div>;
}

function LocalSceneLoader() {
    const game = useGame();

    useEffect(() => {
        game.setMoveManager(new LocalMoveManager());
    }, []);

    return <Outlet/>;
}

const OnlineClientContext = createContext<OnlineClient>(null!);
const useOnlineClient = () => useContext(OnlineClientContext);

function OnlineSceneLoader() {
    const [client] = useState(() => new OnlineClient());

    useEffect(() => {
        void client.join();
    }, []);

    return <OnlineClientContext.Provider value={client}>
        <Outlet/>
    </OnlineClientContext.Provider>;
}

function OnlineMaster() {
    return <div className="online-overlay-container">
        <div className="hex-button-container hosted-game-container">
            <Link to='create'>Create PvP</Link>
            <Link to='join'>Join PvP</Link>
        </div>
    </div>;
}

function OnlineCreate() {
    const [gameId, setGameId] = useState<string | null>(null);
    const navigate = useNavigate();
    const client = useOnlineClient();

    useEffect(() => {
        let shouldNavigate = true;

        client.createPvpGame().then(id => setGameId(id));
        client.addConnectHandler(() => {
            if (shouldNavigate) {
                getGame().setMoveManager(new OnlineMoveManager(client));
                navigate('../play');
            }
        });

        return () => {
            shouldNavigate = false;
        };
    }, []);

    return <div className="online-overlay-container">
        <main className="create">
            {
                gameId == null
                    ? <p>Loading...</p>
                    : <>
                        <p>Give this code to another player to play with them...</p>
                        <div>{gameId}</div>
                    </>
            }
            <Link to='..' className='hex-button'>Back</Link>
        </main>
    </div>;
}

function OnlineJoin() {
    const [joinId, setJoinId] = useState('');
    const [attemptedJoin, setAttemptedJoin] = useState(false);
    const navigate = useNavigate();
    const client = useOnlineClient();

    const inputChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setJoinId(e.target.value.toUpperCase());
    }, []);

    useEffect(() => {
        if (!attemptedJoin) return;

        client.joinPvpGame(joinId);
        client.addConnectHandler(() => {
            getGame().setMoveManager(new OnlineMoveManager(client));
            navigate('../play');
        });

        setAttemptedJoin(false);
    }, [attemptedJoin]);

    return <div className="online-overlay-container">
        <main className="join">
            <input type="text" placeholder="Code" value={joinId} onChange={inputChangeHandler}/>
            <div className="hex-button-container">
                <Link to='.' onClick={() => setAttemptedJoin(true)}>Join</Link>
                <Link to='..'>Back</Link>
            </div>
        </main>
    </div>;
}
