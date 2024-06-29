import * as vscode from "vscode";

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [
      vscode.Uri.joinPath(extensionUri, "assets"),
      vscode.Uri.joinPath(extensionUri, "scripts"),
    ],
  };
}

function formatString(input: string): string {
  return input.toLowerCase().replace(/\s+/g, "-");
}

type Panel = {
  webViewTitle: string;
  panel: vscode.WebviewPanel;
};

export class WebviewPanel {
  private static panels = [] as Panel[];
  static extensionUri: vscode.Uri;
  private currentPanel: vscode.WebviewPanel;

  static getPanel(webViewTitle: string) {
    return WebviewPanel.panels.find(
      (panel) => panel.webViewTitle === webViewTitle
    );
  }

  static panelExists(webViewTitle: string) {
    const titles = WebviewPanel.panels.map((panel) => panel.webViewTitle);
    return titles.includes(webViewTitle);
  }

  /**
   *
   * @param webViewTitle the title of the webview
   * @param context the context
   * @returns
   */
  constructor(
    private webViewTitle: string,
    private context: vscode.ExtensionContext
  ) {
    WebviewPanel.extensionUri = context.extensionUri;

    // if panel aleady exists, reveal it
    if (WebviewPanel.panelExists(webViewTitle)) {
      const currentPanel = WebviewPanel.getPanel(webViewTitle);
      if (!currentPanel) {
        throw new Error("Panel not found");
      }
      currentPanel.panel.reveal();
      this.currentPanel = currentPanel.panel;
      return this;
    }

    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const panel = vscode.window.createWebviewPanel(
      formatString(webViewTitle), // Identifies the type of the webview. Used internally
      webViewTitle, // Title of the panel displayed to the user
      columnToShowIn || vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      getWebviewOptions(WebviewPanel.extensionUri) // Webview options. More on these later.
    );
    panel.webview.html = this.getWebviewContent(panel);
    this.currentPanel = panel;

    // add panel to existing panels
    WebviewPanel.panels.push({ webViewTitle, panel });

    this.onDisposePanel(panel, () => {
      vscode.window.showInformationMessage("Webview disposed");
      WebviewPanel.panels = WebviewPanel.panels.filter(
        (panel) => panel.webViewTitle !== webViewTitle
      );
    });
  }

  onDisposePanel(panel: vscode.WebviewPanel, cb: () => void) {
    panel.onDidDispose(cb, null, this.context.subscriptions);
  }

  getAssetUri(assetPath: string) {
    const path = vscode.Uri.joinPath(
      WebviewPanel.extensionUri,
      "assets",
      assetPath
    );
    return this.currentPanel.webview.asWebviewUri(path);
  }

  getScriptUri(scriptPath: string) {
    const path = vscode.Uri.joinPath(
      WebviewPanel.extensionUri,
      "scripts",
      scriptPath
    );
    return this.currentPanel.webview.asWebviewUri(path);
  }

  getWebviewContent(panel: vscode.WebviewPanel) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta
        http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src ${panel.webview.cspSource} https:; script-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource};"
        />
        <script>
            const vscode = acquireVsCodeApi();
            window.vscode = vscode;
        </script>
    </head>
    <body>
        <h1>hello world</h1>
    </body>
    </html>`;
  }
}
