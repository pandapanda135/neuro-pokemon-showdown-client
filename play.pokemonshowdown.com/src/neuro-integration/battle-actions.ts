import type { Battle, ServerPokemon } from "../battle";
import type { BattleRequestActivePokemon } from "../battle-choices";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";

export class SelectMove extends NeuroAction<string> {
	override Validation(data: ActionData): ActionResult<string> {
		var move:string = data.params["move"]

		if (!SelectMove.getActiveMoves(this.currentPokemon).includes(move)){
			return new ActionResult(false,"You provided a move that is not valid")
		}

		return new ActionResult(true,"",move)
	}
	override async Execute(data: string): Promise<void> {
		var moveButtons: NodeListOf<HTMLButtonElement> = document.querySelectorAll<HTMLButtonElement>('.movebutton')

		for (const button of moveButtons) {
			if (button.value != data) continue;

			button.click()
			break
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
		let moves: string[] | undefined = current.moves.map(move => move.name);
		if (moves == undefined) return [];
		return moves;
	}
}

export class SwapPokemon extends NeuroAction<ServerPokemon>{
	override Validation(data: ActionData): ActionResult<ServerPokemon> {
		if (this.battle.myPokemon === null) return new ActionResult(false,"");

		let pokemon: ServerPokemon | undefined = undefined;
		for (const p of this.battle.myPokemon) {
			if (p.name != data.params.pokemon) continue;

			pokemon = p
		}
		if (pokemon === undefined) return new ActionResult(false, "The pokemon you specified could not be found as an active pokemon.")
		return new ActionResult(true, "Switching to " + pokemon.name, pokemon)
	}
	override async Execute(data: ServerPokemon): Promise<void> {
		if (this.battle.myPokemon === null) return;

		var switchButtons: HTMLCollection | undefined = document.querySelector<HTMLButtonElement>('.switchmenu')?.children
		if (switchButtons === undefined) return;

		for (let i = 0; i < this.battle.myPokemon.length; i++) {
			if (this.battle.myPokemon[i] != data) continue;

			const element = switchButtons[i];
			const button = element as HTMLButtonElement
			button.click()
			break
		}
	}
	constructor(private battle: Battle){
		super("swap_pokemon","Change what pokemon is currently active.", {type: 'object',properties: {pokemon:  {type: 'string',enum: SwapPokemon.getPossiblePokemon(battle)}},required: ["pokemon"]})
	}

	static getPossiblePokemon(battle: Battle): string[]{
		// if (PS === undefined || PS.rooms === undefined) return [];

		// for (const roomID in PS.rooms) {
		// 	console.log("room id: " + roomID);
		// 	console.log("room" + PS.rooms[roomID]);
		// }

		if (battle === null || battle.myPokemon === null) return [];
		const pokemonNames: string[] = battle.myPokemon.map(pokemon => pokemon.name);
		return pokemonNames
	}
}


export class ActivateSpecial extends NeuroAction{
	override Validation(data: ActionData): ActionResult {
		if (this.GetElement() === null){
			return new ActionResult(false, "There was an issue activating your special ability.")
		}

		return new ActionResult(true, "You have actived you special ability.")
	}
	override async Execute(): Promise<void> {
		this.GetElement()?.click()
	}
	constructor(){
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