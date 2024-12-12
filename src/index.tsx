import React from "react";
import ReactDOM from "react-dom/client";
import {App} from "./components/App";

const rootElement = document.getElementById("root");
if (rootElement == null) {
    throw new RangeError("Cannot start app without a root element");
}
const root = ReactDOM.createRoot(rootElement);

root.render(<App/>);
