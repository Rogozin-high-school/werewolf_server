export function dict() {
    var di = {};
    for (let i = 0; i < arguments.length; i++) {
        di[arguments[i][0]] = arguments[i][1];
    }
    return di;
};

export function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

export function randomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function maxOf(arr, evaluator) {
    return arr.reduce((prev, current) => evaluator(prev) > evaluator(current) ? prev : current);
}