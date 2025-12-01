import type { Battle, ServerPokemon } from "../battle";
import type { BattleChoiceBuilder, BattleMoveRequest, BattleRequestActivePokemon, BattleSwitchRequest } from "../battle-choices";
import { PS } from "../client-main";
import { BattleActionsHandler } from "./battle-handling";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";

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
		// console.log("running active moves");
		// if (PS === undefined || PS.rooms === undefined) return [];

		// for (const roomID in PS.rooms) {
		// 	console.log("room id: " + roomID);
		// 	if (!PS.rooms[roomID]) continue;
		// 	console.log("room name: " + PS.rooms[roomID].id + "    type:" + PS.rooms[roomID].type);
		// 	console.log("room" + printObj(PS.rooms[roomID]));
		// }

		// const room: BattleRoom = PS.rooms["battle"] as BattleRoom || null
		let moves: string[] | undefined = current.moves.map((move, i) =>{
			if (move.disabled) return "";
			// if (current.maxMoves === undefined) return "";
			// console.log("max move amount: " + current.maxMoves.length);
			// console.error("adding: " + current.maxMoves[i].name);

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

		// let handler: BattleActionsHandler = new BattleActionsHandler()
		// handler.addSelectMove(this.active)
		// handler.registerBattleActions()
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