import Component from "./components/component";
import {ConstructorOf} from "./util";

export class Entity {
    private readonly components: Component[];

    constructor(...components: Component[]) {
        this.components = components;
    }

    getComponent<T extends Component>(type: ConstructorOf<T>): T {
        for (const c of this.components) {
            if (c instanceof type) {
                return c;
            }
        }

        throw new Error('cannot get a component which is not attached to the entity');
    }

    hasComponent<T extends Component>(type: ConstructorOf<T>): boolean {
        for (const c of this.components) {
            if (c instanceof type) {
                return true;
            }
        }

        return false;
    }
}