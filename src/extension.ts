// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import DisposableManager from "./utils/DisposableManager";
import { WebviewPanel } from "./webviews/Webview";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const dm = new DisposableManager(context);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  dm.register("vscode-todo.helloWorld", () => {
    const helloPanel = new WebviewPanel("Hello World", context);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
