import React, {createContext, RefObject, useContext, useEffect, useRef} from "react";
import OnlineClient from "../online-client";
import {Route, Routes} from "react-router";
import Lobby from "./Lobby";
import PvpMenuCreate from "./PvpMenuCreate";
import PvpMenuJoin from "./PvpMenuJoin";
import GameplayOnline from "./GameplayOnline";

const ClientRefContext = createContext<RefObject<OnlineClient> | null>(null);
export const useClientRefContext = () => {
    const ctx = useContext(ClientRefContext);

    if (ctx == null) {
        throw new Error('context from useClientContext should never be null');
    }

    return ctx;
}

const OnlineContainer: React.FC = () => {
    const clientRef = useRef(new OnlineClient());

    useEffect(() => {
        const client = clientRef.current;
        const p = client.join();
        p.catch(console.error);

        return () => {
            p.then(() => client.close());
        };
    }, []);

    return <ClientRefContext.Provider value={clientRef}>
        <Routes>
            <Route index element={<Lobby/>}/>
            <Route path="create" element={<PvpMenuCreate/>}/>
            <Route path="join" element={<PvpMenuJoin/>}/>
            <Route path="play" element={<GameplayOnline/>}/>
        </Routes>
    </ClientRefContext.Provider>
};

export default OnlineContainer;
