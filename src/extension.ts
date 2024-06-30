// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import DisposableManager from "./utils/DisposableManager";
import { WebviewPanel } from "./webviews/Webview";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const dm = new DisposableManager(context);

  let helloPanel: WebviewPanel | undefined;

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  dm.register("vscode-todo.helloWorld", () => {
    helloPanel = WebviewPanel.createPanel(
      "Hello World",
      context,
      "myscript.js"
    );
    helloPanel.onMessage(async (data) => {
      console.log(data);
      switch (data.command) {
        case "webview:loaded":
          vscode.window.showInformationMessage(data.payload.message);
          break;
        case "webview:error":
          vscode.window.showErrorMessage(data.payload.message);
          break;
        case "frontend:fetch-commands":
          vscode.window.showInformationMessage("Fetching commands...");
          const commands = await vscode.commands.getCommands(true);
          const relevantCommands = commands.filter(
            (command) =>
              command.startsWith("workbench") || command.startsWith("editor")
          );
          // console.log(relevantCommands);
          helloPanel?.panel?.webview?.postMessage({
            command: "backend:commands-fetched",
            payload: relevantCommands,
          });
          break;
      }
    });
  });

  dm.register("vscode-todo.refresh-webview", () => {
    if (helloPanel) {
      helloPanel = WebviewPanel.recreatePanel(helloPanel);
      vscode.commands.executeCommand(
        "workbench.action.webview.openDeveloperTools"
      );
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
