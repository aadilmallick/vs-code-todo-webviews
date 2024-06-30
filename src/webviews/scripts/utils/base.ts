export const $ = (selector: string): Element | null =>
  document.querySelector(selector);
export const $$ = (selector: string): NodeListOf<Element> =>
  document.querySelectorAll(selector);
export const selectWithThrow = (selector: string): Element => {
  const el = $(selector);
  if (!el) {
    tsvscode.postMessage({
      command: "webview:error",
      payload: {
        message: "`Element not found: ${selector}`",
      },
    });
    throw new Error(`Element not found: ${selector}`);
  }
  return el;
};
HTMLElement.prototype.$ = function (
  this: HTMLElement,
  selector: string
): Element | null {
  return this.querySelector(selector);
};

HTMLElement.prototype.$$ = function (
  this: HTMLElement,
  selector: string
): NodeListOf<Element> {
  return this.querySelectorAll(selector);
};

export function debounce(callback: Function, delay: number) {
  let timeoutId: ReturnType<Window["setTimeout"]>;
  // return a function that accepts any number of arguments
  return (...args: any[]) => {
    // clear timeout if function is called before delay time has passed
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
