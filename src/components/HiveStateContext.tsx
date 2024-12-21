import {HivePieceType, HiveState} from "../hive-game";
import {createContext, useContext} from "react";
import {HexVectorLike} from "../hex-grid";

export interface HiveStoreContext {
    state: HiveState;
    placeTile(pieceType: HivePieceType, position: HexVectorLike): void;
    moveTile(from: HexVectorLike, to: HexVectorLike): void;
    lastMoveSucceeded: boolean;
}

export const HiveStateContext = createContext<HiveStoreContext | null>(null);
export const useHiveStateContext = (): HiveStoreContext => {
    const value = useContext(HiveStateContext);

    if (value == null) {
        throw new Error('the provider of the hive state context failed to provide a value');
    }

    return value;
}