import Component from "./component";

export enum SelectableState {
    Unselected,
    Hovered,
    Selected,
}

export default class SelectableComponent extends Component {
    state = SelectableState.Unselected
}