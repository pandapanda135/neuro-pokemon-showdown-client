import type { Battle, Pokemon, ServerPokemon } from "../battle";
import type { BattleChoiceBuilder, BattleMoveRequest, BattleRequestActivePokemon, BattleSwitchRequest } from "../battle-choices";
import { PS } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";
import type { MoveTarget } from "../battle-dex-data";

export class SelectMove extends NeuroAction<string> {
	override Validation(data: ActionData): ActionResult<string> {
		var move:string = data.params["move"]

		if (!SelectMove.getActiveMoves(this.currentPokemon).includes(move)){
			return new ActionResult(false,"You provided a move that is not valid")
		}

		return new ActionResult(true,"You have selected the move " + move,move)
	}
	override async Execute(data: string): Promise<void> {
		var moveButtons: NodeListOf<HTMLButtonElement> = document.querySelectorAll<HTMLButtonElement>('.movebutton')

		console.log("amount of move buttons" + moveButtons.length);

		for (let i = 0; i < this.currentPokemon.moves.length; i++) {
			var move = this.currentPokemon.moves[i];
			if (move.name !== data) continue

			moveButtons[i].click()
			break;
		}
	}

	constructor(private currentPokemon: BattleRequestActivePokemon) {
		const schema: object = {type: 'object',properties: {move:  {type: 'string',enum: SelectMove.getActiveMoves(currentPokemon)}},required: ["move"]}
		super("select_move","Select a move to use",schema)
	}

	static getActiveMoves(current: BattleRequestActivePokemon): string[]{
		let moves: string[] | undefined = current.moves.map((move, i) =>{
			if (move.disabled) return "";

			console.log("adding move: " + move.name);
			return move.name;
		})

		if (moves == undefined) return [];
		return moves.filter(move => move.length !== 0);
	}
}

export class SwapPokemon extends NeuroAction<ServerPokemon>{
	override Validation(data: ActionData): ActionResult<ServerPokemon> {
		if (this.battle.myPokemon === null) return new ActionResult(false,"");
		let sentName: string = data.params.pokemon
		let pokemon: ServerPokemon | undefined = undefined;
		for (const p of this.battle.myPokemon) {
			if (p.name != data.params.pokemon) continue;

			pokemon = p
		}

		this.request.side.pokemon.map((serverPokemon, i) => {

			if (serverPokemon.name != sentName) return;

			if (!SwapPokemon.cantSwitchPokemon(serverPokemon,this.battle,this.choices,this.ignoreTrapping,i)) return;

			pokemon = serverPokemon;
		})

		if (pokemon === undefined) return new ActionResult(false, "The pokemon you specified could not be found as an active pokemon.")
		return new ActionResult(true, "Switching to " + pokemon.name, pokemon)
	}
	override async Execute(data: ServerPokemon): Promise<void> {
		if (this.battle.myPokemon === null) return;

		var switchButtons: HTMLCollection | undefined = document.querySelector<HTMLButtonElement>('.switchmenu')?.children
		if (switchButtons === undefined) return;

		for (let i = 0; i < this.battle.myPokemon.length; i++) {
			console.log(i + ": pokemon name: " + this.battle.myPokemon[i].name);

			if (this.battle.myPokemon[i] != data) continue;

			const element = switchButtons[i];
			const button = element as HTMLButtonElement
			button.click()
			break
		}
	}
	constructor(private battle: Battle,private request: BattleMoveRequest | BattleSwitchRequest, private choices: BattleChoiceBuilder, private ignoreTrapping: boolean | undefined){
		super("swap_pokemon","Change what pokemon is currently active.", {type: 'object',properties:
			{pokemon:  {type: 'string',enum: SwapPokemon.getPossiblePokemon(battle,request,choices,ignoreTrapping)}},required: ["pokemon"]})
	}

	static getPossiblePokemon(battle: Battle, request: BattleMoveRequest | BattleSwitchRequest, choices: BattleChoiceBuilder, ignoreTrapping: boolean | undefined): string[]{
		const pokemonNames: string[] = request.side.pokemon.map((serverPokemon, i) => {
			const cantSwitch:boolean = this.cantSwitchPokemon(serverPokemon,battle,choices,ignoreTrapping,i)

			return cantSwitch ? "" : serverPokemon.name
		})

		return pokemonNames.filter(name => name.length !== 0)
	}

	static cantSwitchPokemon(serverPokemon: ServerPokemon , battle: Battle, choices: BattleChoiceBuilder, ignoreTrapping: Boolean | undefined, i :number): boolean{
		const trapped = !ignoreTrapping && choices.currentMoveRequest()?.trapped;
		const isReviving = battle.myPokemon!.some(p => p.reviving);
		const numActive = choices.requestLength()

		let cantSwitch = trapped || i < numActive || choices.alreadySwitchingIn.includes(i + 1) || serverPokemon.fainted;
		if (isReviving) cantSwitch = !serverPokemon.fainted;
		return cantSwitch ?? false
	}
}

export class ActivateSpecial extends NeuroAction{
	override Validation(data: ActionData): ActionResult {
		if (this.GetElement() === null){
			return new ActionResult(false, "There was an issue activating your special ability.")
		}

		if (this.GetElement()?.checked){
			return new ActionResult(false, "Your special ability is already activated so you cannot activate it again.")
		}

		return new ActionResult(true, "You have actived the pokemon's special ability.")
	}
	override async Execute(): Promise<void> {
		this.GetElement()?.click()
	}
	constructor(private active: BattleRequestActivePokemon){
		super("activate_special","Activate special move",{type: 'object'})
	}

	private GetElement(): HTMLInputElement | null {
		var box: HTMLCollection | undefined = document.querySelector<HTMLButtonElement>('.megaevo-box')?.children
		if (box === undefined || box === null) return null;

		if (box.length === 0) return null;

		for (const element of box) {
			let button: HTMLInputElement | undefined | null = element as HTMLInputElement
			if (button === undefined || button === null) continue;

			return button
		}

		return null;
	}
}

export class SelectTarget extends NeuroAction<string>{
	override Validation(data: ActionData): ActionResult<string> {
		var name: string = data.params.target;

		if (!SelectTarget.GetValidPokemon(this.battle, this.choice).includes(name)){
			return new ActionResult(false, "You provided an invalid value")
		}

		return new ActionResult(true, "Attacking " + name, name)
	}
	override async Execute(data: string): Promise<void> {
		var buttons: HTMLCollection | undefined = document.querySelector<HTMLButtonElement>('.switchmenu')?.children;
		if (buttons == undefined) {
			console.error("Error with getting swapmenu buttons");
			return;
		}
		for (const ele of buttons) {
			let button: HTMLInputElement | undefined | null = ele as HTMLInputElement;
			if (button === undefined || button === null) continue;

			console.log("button text content: " + button.textContent + "  data: " + data);
			if (button.textContent !== data) continue;

			button.click();
			break;
		}
	}

	constructor(private battle: Battle, private choice: BattleChoiceBuilder){
		const schema = {type: 'object', properties: {target: {enum: SelectTarget.GetValidPokemon(battle, choice)}}, required: ['target']};
		super("select_target", "Select a target to use your last selected move on.", schema);
	}

	private static GetValidPokemon(battle: Battle, choice: BattleChoiceBuilder): string[] {
		// copied from panel-battle as I don't think there is a better way to do this without delaying until UI is displayed.
		var pokemonNames: string[] = []
		let moveTarget: MoveTarget | undefined = choice.currentMove()?.target;
		if ((moveTarget === 'adjacentAlly' || moveTarget === 'adjacentFoe') && battle.gameType === 'freeforall') {
			moveTarget = 'normal';
		}
		const userSlot: number = choice.index() + Math.floor(battle.mySide.n / 2) * battle.pokemonControlled;
		const userSlotCross: number = battle.farSide.active.length - 1 - userSlot;

		battle.farSide.active.map((pokemon, i) => {
			var disabled: boolean = this.CanUse(pokemon, i, userSlotCross, moveTarget);
			if (!disabled) return "";

			pokemonNames.push(pokemon?.name ?? "")
		}).reverse()

		battle.nearSide.active.map((pokemon, i) => {
			var disabled: boolean = this.CanUse(pokemon, i, userSlotCross, moveTarget);
			if (!disabled) return "";
			if (moveTarget !== 'adjacentAllyOrSelf' && userSlot === i) disabled = true;

			pokemonNames.push(pokemon?.name ?? "")
		})

		return pokemonNames.filter(name => name.length !== 0);
	}

	private static CanUse(pokemon: Pokemon | null, i: number, userSlotCross: number, moveTarget: MoveTarget | undefined): boolean{
		let disabled: boolean = false;
		if (moveTarget === 'adjacentAlly' || moveTarget === 'adjacentAllyOrSelf') {
			disabled = true;
		} else if (moveTarget === 'normal' || moveTarget === 'adjacentFoe') {
			if (Math.abs(userSlotCross - i) > 1) disabled = true;
		}

		if (pokemon?.fainted) return false;
		if (disabled || pokemon == null || pokemon?.name == undefined) return false;
		return disabled
	}
}

export class Forfeit extends NeuroAction{
	override Validation(data: ActionData): ActionResult<void> {
		return new ActionResult(true, "")
	}
	override async Execute(data: void): Promise<void> {
		PS.room.send("/forfeit")
	}

	constructor(){
		super("rage_quit","Rage quit this current battle.",{type: 'object'})
	}

}

export class SendChatMessage extends NeuroAction<string>{
	override Validation(data: ActionData): ActionResult<string> {
		if (typeof data.params.message !== "string"){
			return new ActionResult(false, "You must provide a valid string.")
		}
		var message: string = data.params.message
		// I think the max length in new client is actually shorter but I can't find it so this will do :(
		if (message === "") return new ActionResult(false, "You must provide a value to send.");
		if (message.length >= 80000) return new ActionResult(false, "The message you tried to send was too long.");

		return new ActionResult(true,"Sending " + message, message)
	}
	override async Execute(data: string): Promise<void> {
		this.room.send(data);
		// we don't reregister actions as actions are registered when the room is handled, this may change in the future.
	}

	constructor(private room: BattleRoom){
		const schema = {type: 'object',properties: {message:  {type: 'string'}},required: ["message"]}
		super("send_chat_message","Send a message in the chat",schema)
	}

}