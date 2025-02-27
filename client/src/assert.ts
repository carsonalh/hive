class AssertionFailedError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'AssertionFailedError'
        Object.setPrototypeOf(this, AssertionFailedError.prototype)
    }
}

export function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new AssertionFailedError(message);
    }
}

