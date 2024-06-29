import * as vscode from "vscode";

export default class DisposableManager {
  private disposables: vscode.Disposable[] = [];

  constructor(private context: vscode.ExtensionContext) {}

  register(commandIdentifier: string, cb: () => void | Promise<void>) {
    const disposable = vscode.commands.registerCommand(commandIdentifier, cb);
    this.disposables.push(disposable);
    this.context.subscriptions.push(disposable);
  }
}
