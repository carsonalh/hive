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
import {getStore, setLocalScene, setOnlineScene} from "./store";
import OnlineScene from "./online-scene";

export function renderOverlay() {
    createRoot(document.getElementById('react-overlay')!).render(<HiveOverlay/>);
}

function HiveOverlay() {
    return <BrowserRouter>
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
    </BrowserRouter>;
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
    useEffect(() => {
        void setLocalScene();
    }, []);

    return <Outlet/>;
}

const OnlineSceneLoadedContext = createContext({
    loaded: false, setLoaded: (_: boolean) => {
    }
});
const useOnlineSceneLoaded = () => {
    const {loaded} = useContext(OnlineSceneLoadedContext);
    return loaded;
};

function OnlineSceneLoader() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setOnlineScene().then(() => setLoaded(true));
    }, []);

    return <OnlineSceneLoadedContext.Provider value={{loaded, setLoaded}}>
        <Outlet/>
    </OnlineSceneLoadedContext.Provider>;
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
    const sceneLoaded = useOnlineSceneLoaded();
    const [gameId, setGameId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!sceneLoaded) return;

        const {scene} = getStore();
        if (!(scene instanceof OnlineScene)) {
            throw new Error('OnlineScene loaded but scene is not OnlineScene');
        }

        scene.client.addConnectHandler(() => {
            navigate('../play');
        });

        (async () => {
            const id = await scene.client.createPvpGame();
            setGameId(id);
        })();
    }, [sceneLoaded]);

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
    const sceneLoaded = useOnlineSceneLoaded();
    const [attemptedJoin, setAttemptedJoin] = useState(false);
    const navigate = useNavigate();

    const inputChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setJoinId(e.target.value.toUpperCase());
    }, []);

    useEffect(() => {
        if (!attemptedJoin || !sceneLoaded) return;

        const {scene} = getStore();
        if (!(scene instanceof OnlineScene)) {
            throw new Error('scene should have loaded into an OnlineScene');
        }

        scene.client.addConnectHandler(() => {
            navigate("../play");
        });

        scene.client.joinPvpGame(joinId);
    }, [attemptedJoin, sceneLoaded]);

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
