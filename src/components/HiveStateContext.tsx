import {HiveColor, HivePieceType, HiveState} from "../hive-game";
import {createContext, useContext, useEffect, useState} from "react";
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

export const useHiveGame = (ready: boolean): {
    state: HiveState,
    placeTile: (pieceType: HivePieceType, position: HexVectorLike) => void,
    moveTile: (from: HexVectorLike, to: HexVectorLike) => void,
    lastMoveSucceeded: boolean,
} => {
    const [state, setState] = useState<[HiveState, lastMoveSuccess: boolean]>([{
        blackReserve: {
            QUEEN_BEE: 1,
            SOLDIER_ANT: 2,
            GRASSHOPPER: 3,
            SPIDER: 2,
            BEETLE: 2,
            LADYBUG: 1,
            MOSQUITO: 1,
        },
        whiteReserve: {
            QUEEN_BEE: 1,
            SOLDIER_ANT: 2,
            GRASSHOPPER: 3,
            SPIDER: 2,
            BEETLE: 2,
            LADYBUG: 1,
            MOSQUITO: 1,
        },
        tiles: [],
        colorToMove: HiveColor.Black,
        move: 1,
    }, true]);

    useEffect(() => {
        if (!ready) return;

        setState([hive.createHiveGame(), true]);
    }, [ready]);

    return {
        state: state[0],
        placeTile: (pieceType, position) => {
            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            setState(prev => {
                return hive.placeTile(prev[0], pieceType, position);
            });
        },
        moveTile: (from, to) => {
            if (!ready) {
                throw new Error('useHiveGame(): cannot mutate state before ready');
            }

            setState(prev => {
                return hive.moveTile(prev[0], from, to);
            });
        },
        lastMoveSucceeded: state[1],
    };
}
