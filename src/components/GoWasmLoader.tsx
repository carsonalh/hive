import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";

declare const Go: any;

const GoWasmLoaderContext = createContext(false);
export const useGoWasmLoaded = () => useContext(GoWasmLoaderContext);

const GoWasmLoader: React.FC<{ children?: ReactNode }> = (props) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const go = new Go();
            const response = await fetch('/main.wasm');
            const buffer = await response.arrayBuffer();
            const {instance} = await WebAssembly.instantiate(buffer, go.importObject);
            go.run(instance);
            setLoaded(true);
        })();
    }, []);

    return <GoWasmLoaderContext.Provider value={loaded}>
        {props.children}
    </GoWasmLoaderContext.Provider>;
};

export default GoWasmLoader;
