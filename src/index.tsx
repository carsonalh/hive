import React from "react";
import ReactDOM from "react-dom/client";
import {createBrowserRouter, RouterProvider} from "react-router";
import {App} from "./components/App";
import GameplayLocal from "./components/GameplayLocal";
import GameplayOnline from "./components/GameplayOnline";

const rootElement = document.getElementById("root");
if (rootElement == null) {
    throw new RangeError("Cannot start app without a root element");
}
const root = ReactDOM.createRoot(rootElement);

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />
    },
    {
        path: 'local',
        element: <GameplayLocal />
    },
    {
        path: 'online',
        element: <GameplayOnline />
    }
]);

root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
