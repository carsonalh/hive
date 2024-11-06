export interface ErrorModalOptions {
    message?: string;
}

class ErrorModal {
    private readonly element: HTMLDivElement;

    constructor(options?: ErrorModalOptions) {
        this.element = document.createElement('div');
        this.element.style.display = 'none';
        this.element.style.position = 'absolute';
        this.element.style.maxWidth = '450px';
        this.element.style.backgroundColor = 'white';
        this.element.style.padding = '18px';
        this.element.style.left = '200px';
        this.element.style.top = '100px';

        const p = document.createElement('p');
        p.textContent = options?.message ?? 'Error';
        this.element.appendChild(p);

        const button = document.createElement('button');
        button.textContent = 'Ok';
        button.onclick = this.dismiss.bind(this);
        this.element.appendChild(button);

        document.querySelector('body')!.appendChild(this.element);
    }

    public show() {
        this.element.style.display = 'block';
    }

    public dismiss() {
        this.element.style.display = 'none';
    }
}

export default ErrorModal;
