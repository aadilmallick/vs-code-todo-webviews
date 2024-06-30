export default class ReactiveState<T extends Record<keyof T, V>, V> {
  private proxy: Record<keyof T, V>;
  private key: keyof T;
  private _value: V;

  get value() {
    return this.proxy[this.key];
  }

  set value(newValue: V) {
    this.proxy[this.key] = newValue;
  }

  constructor(state: T, onSet: (state: T) => void) {
    const singleProperty = Object.keys(state)[0] as keyof T;
    this.key = singleProperty;
    this._value = state[singleProperty];
    const proxy = new Proxy(state, {
      set(target, p, newValue, receiver) {
        if (p === singleProperty) {
          // @ts-ignore
          target[p] = newValue as V;
          onSet(target);
        }
        return Reflect.set(target, p, newValue, receiver);
      },
    });
    this.proxy = proxy;
  }
}
