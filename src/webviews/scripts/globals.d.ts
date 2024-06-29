/// <reference lib="dom" />

declare interface Window {
  vscode: {
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
}
