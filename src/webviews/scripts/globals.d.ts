/// <reference lib="dom" />

declare const tsvscode: {
  getState: () => any;
  setState: (state: any) => void;
  postMessage: ({
    command,
    payload,
  }: {
    command: string;
    payload: any;
  }) => void;
};

interface HTMLElement {
  on(
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  off(
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  $(selector: string): Element | null;
  $$(selector: string): NodeListOf<Element>;
}

declare module "*.html" {
  const value: string;
  export default value;
}
