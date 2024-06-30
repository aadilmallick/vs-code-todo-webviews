import { selectWithThrow, $, $$, debounce } from "./utils/base";
import html from "./templates/firstWebview.html";
import { comments } from "vscode";
import ReactiveState from "./utils/ReactiveState";

console.log("Hello from myscript.ts");

type Message = {
  command: string;
  payload: any;
};

function postMessageWithPayload(message: Message) {
  tsvscode.postMessage(message);
}

function postMessage(command: string) {
  tsvscode.postMessage({ command, payload: null });
}

const root = selectWithThrow("#root");
root.innerHTML = html;

const listButton = selectWithThrow("#fetch-commands");
const commandsList = selectWithThrow("#commands-list");
let allCommands = [] as string[];

// const commandsProxy = new Proxy(
//   { commands: [] as string[] },
//   {
//     set(target, p, newValue, receiver) {
//       if (p === "commands") {
//         const commands = newValue as string[];
//         commandsList.innerHTML = "";
// commands.forEach((command) => {
//   const li = document.createElement("li");
//   li.textContent = command;
//   commandsList.appendChild(li);
// });
//       }
//       return Reflect.set(target, p, newValue, receiver);
//     },
//   }
// );
const commandsProxy = new ReactiveState(
  { commands: [] as string[] },
  (state) => {
    commandsList.innerHTML = "";
    state.commands.forEach((command) => {
      const li = document.createElement("li");
      li.textContent = command;
      commandsList.appendChild(li);
    });
  }
);
let searchInput: HTMLInputElement | undefined;

// const searchInputProxy = new Proxy(
//   {
//     searchInput,
//   },
//   {
//     set(target, p, newValue, receiver) {
//       if (p === "searchInput") {
//         const input = newValue as HTMLInputElement;
//         input.addEventListener("input", (e) => {
//           const currentSearch = (e.target as EventTarget & { value: string })
//             ?.value;
//           console.log(currentSearch);

//           if (currentSearch === "") {
//             commandsProxy.value = allCommands;
//             return;
//           }

//           const filteredCommands = allCommands.filter((command) =>
//             command.includes(currentSearch)
//           );
//           commandsProxy.value = filteredCommands;
//         });
//       }
//       return Reflect.set(target, p, newValue, receiver);
//     },
//   }
// );

const searchInputProxy = new ReactiveState({ searchInput }, (state) => {
  if (!state.searchInput) {
    return;
  }

  const debouncedSearch = debounce((e: Event) => {
    const currentSearch = (e.target as EventTarget & { value: string })?.value;
    console.log(currentSearch);

    if (currentSearch === "") {
      commandsProxy.value = allCommands;
      return;
    }

    const filteredCommands = allCommands.filter((command) =>
      command.includes(currentSearch)
    );
    commandsProxy.value = filteredCommands;
  }, 150);

  state.searchInput.addEventListener("input", debouncedSearch);
});

function createListeners() {
  listButton.addEventListener("click", () => {
    postMessage("frontend:fetch-commands");
  });

  window.addEventListener("message", (event) => {
    const { data }: { data: Message } = event;
    switch (data.command) {
      case "backend:commands-fetched":
        // 1. fetch commands
        const _commands = data.payload as string[];
        commandsProxy.value = _commands;
        allCommands = [..._commands];

        // 2. prepend input to search commands
        const content = `<div>
          <input id='search' type='text' placeholder='Search commands' />
        </div>`;
        // commandsList.before(content);
        commandsList.insertAdjacentHTML("beforebegin", content);

        // 3. add listener to input
        searchInput = selectWithThrow("#search") as HTMLInputElement;
        console.log(searchInput);
        searchInputProxy.value = searchInput;
    }
  });
}

createListeners();
