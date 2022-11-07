// to remove when @types/node gets updated
declare module 'node:test'{
    function before(fn: Function, options?: Object): void;
    function after(fn: Function, options?: Object): void;
    function afterEach(fs: Function, options?: Object): void;
}
