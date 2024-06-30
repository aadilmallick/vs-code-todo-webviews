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
      vscode.Uri.joinPath(extensionUri, "src", "webviews", "assets"),
      vscode.Uri.joinPath(extensionUri, "dist", "scripts"),
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

type WebviewPanelOptions = {
  onDidDispose?: () => void;
  onMessageReceived?: (data: { command: string; payload: any }) => void;
};

export class WebviewPanel {
  private static panels = [] as Panel[];
  static extensionUri: vscode.Uri;
  private static assetsPath: vscode.Uri;
  private static scriptsPath: vscode.Uri;
  private static context: vscode.ExtensionContext;
  private static hasInitialized = false;
  private _panel?: vscode.WebviewPanel;

  public get panel() {
    return this._panel;
  }

  static init(context: vscode.ExtensionContext) {
    if (WebviewPanel.hasInitialized) {
      return;
    }
    WebviewPanel.context = context;
    WebviewPanel.extensionUri = context.extensionUri;
    WebviewPanel.assetsPath = vscode.Uri.joinPath(
      WebviewPanel.extensionUri,
      "src",
      "webviews",
      "assets"
    );
    WebviewPanel.scriptsPath = vscode.Uri.joinPath(
      WebviewPanel.extensionUri,
      "dist",
      "scripts"
    );
    WebviewPanel.hasInitialized = true;
  }

  static getPanel(webViewTitle: string) {
    return WebviewPanel.panels.find(
      (panel) => panel.webViewTitle === webViewTitle
    );
  }

  static panelExists(webViewTitle: string) {
    const titles = WebviewPanel.panels.map((panel) => panel.webViewTitle);
    return titles.includes(webViewTitle);
  }

  static killPanel(webViewTitle: string) {
    const panel = WebviewPanel.getPanel(webViewTitle);
    if (!panel) {
      return;
    }
    panel.panel.dispose();
  }

  static createPanel(
    webViewTitle: string,
    context: vscode.ExtensionContext,
    scriptName: string,
    options?: WebviewPanelOptions
  ) {
    WebviewPanel.init(context);

    // if panel aleady exists, reveal it
    if (WebviewPanel.panelExists(webViewTitle)) {
      const currentPanel = WebviewPanel.getPanel(webViewTitle);
      if (!currentPanel) {
        throw new Error("Panel not found");
      }
      currentPanel.panel.reveal();
      const panel = new WebviewPanel(webViewTitle, scriptName, options);
      panel.setPanel(currentPanel.panel);
      return panel;
    }

    const basePanel = new WebviewPanel(webViewTitle, scriptName, options);

    const panel = WebviewPanel.buildPanel(basePanel);
    basePanel.setPanel(panel);

    // add panel to existing panels
    return basePanel;
  }

  static buildPanel(basePanel: WebviewPanel) {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const panel = vscode.window.createWebviewPanel(
      formatString(basePanel.webViewTitle), // Identifies the type of the webview. Used internally
      basePanel.webViewTitle, // Title of the panel displayed to the user
      columnToShowIn || vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      getWebviewOptions(WebviewPanel.extensionUri) // Webview options. More on these later.
    );
    const scriptUri = WebviewPanel.getScriptUri(basePanel.scriptName, panel);
    panel.webview.html = WebviewPanel.getWebviewContent(panel, scriptUri);
    panel.onDidDispose(
      () => {
        basePanel.options?.onDidDispose && basePanel.options.onDidDispose();
        WebviewPanel.panels = WebviewPanel.panels.filter(
          (_panel) => _panel.webViewTitle !== basePanel.webViewTitle
        );
      },
      null,
      WebviewPanel.context.subscriptions
    );
    if (basePanel.options?.onMessageReceived) {
      panel.webview.onDidReceiveMessage(
        basePanel.options.onMessageReceived,
        null,
        WebviewPanel.context.subscriptions
      );
    }

    WebviewPanel.panels.push({ webViewTitle: basePanel.webViewTitle, panel });
    return panel;
  }

  static recreatePanel(basePanel: WebviewPanel) {
    WebviewPanel.killPanel(basePanel.webViewTitle);
    const panel = WebviewPanel.buildPanel(basePanel);
    basePanel.setPanel(panel);
    return basePanel;
  }

  private constructor(
    public webViewTitle: string,
    private scriptName: string,
    private options?: WebviewPanelOptions
  ) {}

  private setPanel(panel: vscode.WebviewPanel) {
    this._panel = panel;
  }

  onMessage(
    onMessageReceived: (data: { command: string; payload: any }) => void
  ) {
    if (!this.panel) {
      throw new Error("Panel not defined, in onMessage");
    }
    this.panel.webview.onDidReceiveMessage(
      onMessageReceived,
      null,
      WebviewPanel.context.subscriptions
    );
  }

  static onWebviewDestroyed(panel: vscode.WebviewPanel, cb?: () => void) {
    panel.onDidDispose(
      () => {
        WebviewPanel.panels = WebviewPanel.panels.filter(
          (_panel) => _panel.webViewTitle !== panel.title
        );
        cb && cb();
      },
      null,
      WebviewPanel.context.subscriptions
    );
  }

  static getAssetUri(assetPath: string, panel: vscode.WebviewPanel) {
    const path = vscode.Uri.joinPath(WebviewPanel.assetsPath, assetPath);
    return panel.webview.asWebviewUri(path);
  }

  static getScriptUri(scriptPath: string, panel: vscode.WebviewPanel) {
    const path = vscode.Uri.joinPath(WebviewPanel.scriptsPath, scriptPath);
    return panel.webview.asWebviewUri(path);
  }

  static getWebviewContent(panel: vscode.WebviewPanel, scriptPath: vscode.Uri) {
    const nonce = getNonce();
    const webview = panel.webview;
    const resetCSSLink = WebviewPanel.getAssetUri("reset.css", panel);
    const vscodeCSSLink = WebviewPanel.getAssetUri("vscode.css", panel);
    const stylesLink = WebviewPanel.getAssetUri("styles.css", panel);
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
        <link href="${resetCSSLink}" rel="stylesheet">
				<link href="${vscodeCSSLink}" rel="stylesheet">
				<link href="${stylesLink}" rel="stylesheet">

        <script nonce="${nonce}">
            const tsvscode = acquireVsCodeApi();
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptPath}" type="module"></script>
    </body>
    </html>`;
  }
}
