import { type ActionData,type ForceActions , ActionResult, NeuroAction, registerActions } from "./helpers/action-helpers";
import { config, delay, isOpen, printObj } from "./helpers/setup";
import { PS } from "../client-main";
import { type RoomID } from "../client-main"

class SelectFormat extends NeuroAction<string> {
	Validation(data: ActionData): ActionResult<string> {
		if (!getFormatNames().includes(data.params.format)){
			return new ActionResult(false,"You did not provide a valid format.")
		}

		return new ActionResult(true,"queuing for the format " + data.params.format,data.params.format)
	}
	async Execute(data: string): Promise<void> {
		console.log("this is execute data: " + data)
		let formatSelect: HTMLButtonElement = (document.getElementsByClassName("formatselect")[0] as HTMLButtonElement)
		if (!PS.popups.includes("formatdropdown" as RoomID)){
			console.log("clicking format select");
			formatSelect.click()
			await delay(1000)
		}

		for (const ele of document.getElementsByClassName("option")) {
			let element: HTMLButtonElement = ele as unknown as HTMLButtonElement
			if (element === undefined){
				continue;
			}
			console.log("element name:" + element.value)

			if (element.value === data){
				element.click()
				break;
			}
		}

		await delay(1000)
		let battleButton: HTMLButtonElement = (document.getElementsByClassName("mainmenu1 mainmenu big button")[0] as HTMLButtonElement)
		if (formatSelect.value === data){
			console.log("clicking battle button")
			battleButton.click()
		}
	}
	constructor(){
		const schema: object = {type: 'object',properties: {format:  {type: 'string',enum: getFormatNames()}},required: ["format"]}
		super("select_format","Select a format to play, this will change what pokemon and rules are applied.",schema);
	}
}

async function handleLoad(): Promise<void> {
	while (!isOpen()){
		await delay(1000);
	}

	if (config.USERNAME === "") return;

	if (PS.user.name !== config.USERNAME){
		console.log("logging in: " + PS.user.name);
		await logInFlow()
		await delay(1000)
	}

	if (!config.REGISTER_SELECT_FORMAT) return;
	let actions: NeuroAction<any>[] = [new SelectFormat()]
	let force: ForceActions = {query: "You need to select a format to play from these options", actionNames: ["select_format"]}
	registerActions(actions, force);
}

async function logInFlow() {
	console.log("start log in flow");
	var userbar: HTMLElement = (document.getElementsByClassName("userbar")[0] as HTMLElement)
	var loginButton: HTMLElement | undefined = undefined;

	while (loginButton === undefined) {
		for (const element of userbar.children) {
			if (!element.classList.contains("button") || element.tagName.toLowerCase() !== "a") continue;

			loginButton = element as HTMLElement
			break;
		}
		await delay(1000)
	}

	await delay(1000)
	if (loginButton === undefined){
		console.error("login button was undefined");
		return;
	}
	loginButton.click()
	console.log("tags name: " + loginButton.tagName + loginButton.parentElement?.className)
	await delay(1000)

	// login popup is called "login"
	// this is after the popup appears and we need to add username and password
	const buttonInputs: string[] = ['input[name=username]','input[name=password]']
	for (const input of buttonInputs) {
		const button = document.querySelector<HTMLInputElement>(input);
		if (button === null) return;

		await delay(500)
		// check panel-popups getUsername for why we use value
		if (input.includes("username")){
			button.value = config.USERNAME
		}
		else{
			button.value = config.PASSWORD
		}

		getLoginSubmitButton()
		await delay(500);
	}
}

function getLoginSubmitButton() {
	let submitButton: HTMLButtonElement | undefined = undefined;
	console.log("going through buttonbar");
	for (const element of document.getElementsByClassName("buttonbar")) {
		console.log("element in button-bar");
		for (const ele of element.children) {
			// stops issue with password button :)
			if (ele.children.length > 0){
				console.log("setting button");
				submitButton = ele as HTMLButtonElement
				break;
			}
		}
	}

	if (submitButton !== undefined){
		console.log("clicking on submit name: " + submitButton.children[0].textContent);
		submitButton.click()
	}
}

function getFormatNames(): string[]{
	let names:string[] = [];

	// idk why window is being so annoying and making me do this but I need to do this
	const formats = window.BattleFormats;
	const disallowedFormats: any = window.DisallowedBattleFormats;

	for (const key in formats) {
		let format: any = formats[key]
		if ((disallowedFormats !== undefined && disallowedFormats.includes(key)) || format.isTeambuilderFormat || format.partner || !format.searchShow || (!config.ALLOW_RATED_FORMATS && format.rated)){
			continue;
		}

		console.log("adding format: " + printObj(format));

		names.push(format.name);
	}

	return names;
}

handleLoad()