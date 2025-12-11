import { type ActionData,type ForceActions , ActionResult, NeuroAction, registerActions } from "./helpers/action-helpers";
import { config, delay, isOpen, secondsToMs, printObj } from "./helpers/setup";
import { PS } from "../client-main";
import { type RoomID } from "../client-main"
import { AcceptChallenge, challengers } from "./after-battle";

export class SelectFormat extends NeuroAction<string> {
	static actionName = "select_format"

	Validation(data: ActionData): ActionResult<string> {
		if (!getFormatNames().includes(data.params.format)){
			return new ActionResult(false,"You did not provide a valid format.")
		}

		return new ActionResult(true,"Queuing for the format " + data.params.format,data.params.format)
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
		super(SelectFormat.actionName,"Select a format to play, this will change what pokemon and rules are applied.",schema);
	}
}

async function handleLoad(): Promise<void> {
	while (!isOpen()){
		await delay(secondsToMs(1));
	}

	if (config.USERNAME === "" || config.PASSWORD === "") throw new Error("Either the username or password were not set in the config.");

	// use while in case log in fails for whatever reason
	while (PS.user.name !== config.USERNAME){
		console.log("logging in: " + PS.user.name);
		await logInFlow()
		await delay(secondsToMs(1))
	}

	let actions: NeuroAction<any>[] = [];
	let force: ForceActions = {query: "", actionNames: []};
	if (config.ALLOW_MAIN_MENU_CHALLENGER){
		// we don't register this action again so we wait for people to send challenges
		while (challengers.filter(challenge => !isValidFormat(challenge.format)).length < 5){
			await delay(secondsToMs(20));
		}
		actions.push(new AcceptChallenge());
		force.query += "You can accept a challenge for a battle from one of your viewers and try to beat them.\n"
	}
	if (config.REGISTER_SELECT_FORMAT) {
		actions.push(new SelectFormat());
		force.query += "You can select a format to play from these options.";
	}

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
		for (const ele of element.children) {
			// stops issue with password button :)
			if (ele.children.length > 0){
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

type Format = {
	id: string,
	name: string,
	team: string,
	// ui stuff
	section: string,
	column: number,
	searchShow: boolean,
	challengeShow: boolean
	// end ui
	rated: boolean,
	teamBuilderLevel: number | null,
	teamBuilderFormat: string,
	isTeambuilderFormat: boolean,
	effectFormat: string
}

export function getFormatNames(): string[]{
	let names:string[] = [];

	for (const key in window.BattleFormats) {
		if (!isValidFormat(key)) continue;

		names.push(formatKeyToName(key));
	}

	return names;
}

export function isValidFormat(key: string): boolean{
	const disallowedFormats: any = window.DisallowedBattleFormats;
	let format: Format = window.BattleFormats[key]
	if ((disallowedFormats !== undefined && disallowedFormats.includes(key)) || format.isTeambuilderFormat || !format.searchShow || (!config.ALLOW_RATED_FORMATS && format.rated)){
		return false;
	}

	return true;
}

export function formatKeyToName(key: string): string{
	return window.BattleFormats[key].name;
}

handleLoad()