import { ConnectionStatus, FormType } from "../enums";
import { HotkeyData, Settings, VtsAction, VtuberSettings } from "../types";
import "./style.scss";

if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", addEvents);
} else {
    // `DOMContentLoaded` has already fired
    addEvents();
}

function addEvents() {
    document.querySelector("#intifaceForm").addEventListener("submit", (event: SubmitEvent) => {
        event.preventDefault();
        if (event.submitter.classList.contains("disconnectButton")) {

        } else {
            let host = document.querySelector<HTMLInputElement>("#intifaceHost").value;
            let port = document.querySelector<HTMLInputElement>("#intifacePort").value;
            submitIntifaceConnection(host as string, parseInt(port as string));
        }
    });
    
    document.querySelector("#vtuberForm").addEventListener("submit", (event: SubmitEvent) => {
        event.preventDefault();
        if (event.submitter.classList.contains("disconnectButton")) {
            submitVtuberDisconnect();
        } else {
            let protocol = document.querySelector<HTMLSelectElement>("#vtuberProtocol").value;
            let host = document.querySelector<HTMLInputElement>("#vtuberHost").value;
            let port = document.querySelector<HTMLInputElement>("#vtuberPort").value;
            submitVtuberConnection(protocol as string, host as string, parseInt(port as string));
        }
    });

    document.querySelector("#vtuberProtocol").addEventListener("input", (event: InputEvent) => {
        let element = event.target as HTMLSelectElement;
        let protocol = element.value;
        let portField = document.querySelector<HTMLInputElement>("#vtuberPort");
        switch (protocol.toLowerCase()) {
            case "vtubestudio":
                portField.value = "8001";
                break;
            case "vnyan":
                portField.value = "8000";
                break;
            case "warudo":
                portField.value = "19190";
                break;
            default:
                console.error("Unexpected vtuber protocol: %s", protocol);
                break;
        }
    });

    document.querySelector("#vtsActionForm").addEventListener("submit", (event: SubmitEvent) => {
        event.preventDefault();
        
        let minElement = document.querySelector(".rangeMin") as HTMLInputElement;
        let maxElement = document.querySelector(".rangeMax") as HTMLInputElement;
        let dataElement = document.querySelector("#hotkeyList") as HTMLSelectElement;

        let action: VtsAction = {
            actionType: "hotkeyTrigger",
            actionData: { hotkeyID: dataElement.value },
            vibrateRange: {
                min: parseInt(minElement.value),
                max: parseInt(maxElement.value)
            }
        }

        window.electronAPI.vtsActionSubmit(action);
    });
    
    window.electronAPI.onUpdateSettings((data: Settings) => {
        populateDefaults(data);
    });

    window.electronAPI.onUpdateStatus((category: FormType, state: ConnectionStatus, message: string) => {
        displayStatus(category, state, message);
    });

    window.electronAPI.onUpdateHotkeyList((data: HotkeyData[]) => {
        let selectElement = document.createElement("select");
        selectElement.id = "hotkeyList";
        data.forEach(hotkey => {
            let hotkeyOption: HTMLOptionElement = document.createElement("option");
            hotkeyOption.appendChild(document.createTextNode(`${hotkey.type}: ${hotkey.name}`));
            hotkeyOption.value = hotkey.hotkeyID;
            selectElement.appendChild(hotkeyOption);
        });
        //document.getElementsByClassName("vtuber")[0].appendChild(selectElement);
        document.getElementById("vtsActionForm").appendChild(selectElement);
    });
}

function populateDefaults(settings: Settings) {
    document.querySelector<HTMLInputElement>("#intifaceHost").value = settings.intiface.host;
    document.querySelector<HTMLInputElement>("#intifacePort").value = settings.intiface.port.toString();
    document.querySelector<HTMLInputElement>("#vtuberHost").value = settings.vtuber.host;
    document.querySelector<HTMLInputElement>("#vtuberPort").value = settings.vtuber.port.toString();
    // TODO: add behavior for feeding in protocol selection here
}

function displayStatus(category: FormType, state: ConnectionStatus, message: string) {
    //console.log("update %s connection status, state %s, message %s", category, state, message);
    let targetForm: HTMLFormElement = document.querySelector("#" + category + "Form");
    let targetElement: HTMLElement = document.querySelector("#" + category + "Form .status");
    targetElement.innerText = message;

    targetForm.classList.remove("error", "disconnected", "connected", "connecting");
    targetElement.parentElement.classList.remove("error", "disconnected", "connected", "connecting");

    switch (state) {
        case ConnectionStatus.Connected:
            targetElement.parentElement.classList.add("connected");
            targetForm.classList.add("connected");
            break;
        case ConnectionStatus.Error:
            targetElement.parentElement.classList.add("error");
            targetForm.classList.add("error");
            break;
        case ConnectionStatus.Connecting:
            targetElement.parentElement.classList.add("connecting");
            targetForm.classList.add("connecting");
            break;
        case ConnectionStatus.Disconnected:
        case ConnectionStatus.NotConnected:
            targetElement.parentElement.classList.add("disconnected");
            targetForm.classList.add("disconnected");
            break;
        default:
            //targetElement.classList.remove("connected");
            //targetElement.classList.remove("error");
            //targetForm.classList.remove("connected");
            //targetForm.classList.remove("error");
            console.error("displayStatus called with unexpected state: ", state);
            break;
    }
}

function submitIntifaceConnection(host: string, port: number) {
    // TODO: revisit this when adding Intiface controls to the UI
    return null;
}

function submitVtuberConnection(protocol: string, host: string, port: number) {
    let settings: VtuberSettings = {
        protocol: protocol,
        host: host,
        port: port
    };
    window.electronAPI.vtuberConnect(settings);
}

function submitVtuberDisconnect() {
    window.electronAPI.vtuberDisconnect();
}