import Component from "./components/component";
import {Entity} from "./entity";
import {ConstructorOf} from "./util";

export class EntityRegistry {
    private readonly entities: Entity[] = [];

    constructor() {
    }

    addEntity(components: Component[]): Entity {
        const entity = new Entity(...components)
        this.entities.push(entity);
        return entity;
    }

    removeEntity(...entities: Entity[]) {
        for (const e of entities) {
            const i = this.entities.indexOf(e);
            if (i < 0) {
                throw new Error('cannot remove entity which is not registered');
            }

            this.entities.splice(i, 1);
        }
    }

    getEntitiesWithComponents(...components: ConstructorOf<Component>[]): Entity[] {
        const entities: Entity[] = [];

        for (const e of this.entities) {
            let hasAllComponents = true;
            for (const c of components) {
                if (!e.hasComponent(c)) {
                    hasAllComponents = false;
                    break;
                }
            }
            if (hasAllComponents) {
                entities.push(e);
            }
        }

        return entities;
    }

    getComponents<T extends Component>(component: ConstructorOf<T>): T[] {
        const components: T[] = [];
        for (const e of this.entities) {
            if (e.hasComponent(component)) {
                components.push(e.getComponent(component));
            }
        }
        return components;
    }

    getSingletonComponent<T extends Component>(component: ConstructorOf<T>): T {
        const components: T[] = [];
        for (const e of this.entities) {
            if (e.hasComponent(component)) {
                components.push(e.getComponent(component));
            }
        }

        if (components.length !== 1) {
            throw new Error(`could not get singleton component (found ${components.length})`);
        }

        return components[0];
    }

    getSingletonEntity<T extends Component>(component: ConstructorOf<T>): Entity {
        const entities: Entity[] = [];
        for(const e of this.entities) {
            if (e.hasComponent(component)) {
                entities.push(e);
            }
        }

        if (entities.length !== 1) {
            throw new Error(`could not get singleton entity (found ${entities.length})`);
        }

        return entities[0];
    }
}

