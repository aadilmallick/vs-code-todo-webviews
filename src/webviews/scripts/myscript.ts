console.log("Hello from myscript.ts");

window.vscode.postMessage({
  command: "webview:loaded",
  payload: {
    message: "Hello from myscript.ts",
  },
});
