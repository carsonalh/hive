import React from "react";
import {BrowserRouter, Route, Routes} from "react-router";
import GameplayLocal from "./GameplayLocal";
import Home from "./Home";
import OnlineContainer from "./OnlineContainer";
import GoWasmLoader from "./GoWasmLoader";

export const App: React.FC = () => {
    return (
        <GoWasmLoader>
            <BrowserRouter>
                <Routes>
                    <Route index element={<Home/>}/>
                    <Route path="local" element={<GameplayLocal/>} />
                    <Route path="online/*" element={<OnlineContainer/>}/>
                </Routes>
            </BrowserRouter>
        </GoWasmLoader>
    );
}