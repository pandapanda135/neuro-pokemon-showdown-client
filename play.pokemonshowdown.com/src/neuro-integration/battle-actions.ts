import type { Battle, Pokemon, ServerPokemon } from "../battle";
import type { Dex } from "../battle-dex";
import type { Move } from "../battle-dex-data";
import { PS, type RoomID } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { RoomsRoom } from "../panel-rooms";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";
import { printObj } from "./helpers/setup";

export class SelectMove extends NeuroAction<string> {
	override Validation(data: ActionData): ActionResult<string> {
		var move:string = data.params["move"]

		if (!SelectMove.getActiveMoves().includes(move)){
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

	constructor() {
		const schema: object = {type: 'object',properties: {move:  {type: 'string',enum: SelectMove.getActiveMoves()}},required: ["move"]}
		super("select_move","Select a move to use",schema)
	}

	static getActiveMoves(): string[]{
		console.log("running active moves");
		if (PS === undefined || PS.rooms === undefined) return [];

		for (const roomID in PS.rooms) {
			console.log("room id: " + roomID);
			if (!PS.rooms[roomID]) continue;
			console.log("room name: " + PS.rooms[roomID].id + "    type:" + PS.rooms[roomID].type);
			console.log("room" + printObj(PS.rooms[roomID]));
		}

		const room: BattleRoom = PS.rooms["battle"] as BattleRoom || null
		if (room === null || room.battle.myPokemon === null) return [];
		return room.battle.myPokemon[0].moves;
	}
}

export class SwapPokemon extends NeuroAction<ServerPokemon>{
	override Validation(data: ActionData): ActionResult<ServerPokemon> {
		if (this.room.battle.myPokemon === null) return new ActionResult(false,"");

		let pokemon: ServerPokemon | undefined = undefined;
		for (const p of this.room.battle.myPokemon) {
			if (p.name != data.params.pokemon) continue;

			pokemon = p
		}
		if (pokemon === undefined) return new ActionResult(false, "The pokemon you specified could not be found as an active pokemon.")
		return new ActionResult(true, "Switching to " + pokemon.name, pokemon)
	}
	override async Execute(data: ServerPokemon): Promise<void> {
		if (this.room.battle.myPokemon === null) return;

		var switchButtons: HTMLCollection | undefined = document.querySelector<HTMLButtonElement>('.switchmenu')?.children
		if (switchButtons === undefined) return;

		for (let i = 0; i < this.room.battle.myPokemon.length; i++) {
			if (this.room.battle.myPokemon[i] != data) continue;

			const element = switchButtons[i];
			const button = element as HTMLButtonElement
			button.click()
			break
		}
	}
	constructor(private room: BattleRoom){
		super("swap_pokemon","Change what pokemon is currently active.", {type: 'object',properties: {pokemon:  {type: 'string',enum: SwapPokemon.getPossiblePokemon(room)}},required: ["pokemon"]})
	}

	static getPossiblePokemon(room: BattleRoom): string[]{
		// if (PS === undefined || PS.rooms === undefined) return [];

		// for (const roomID in PS.rooms) {
		// 	console.log("room id: " + roomID);
		// 	console.log("room" + PS.rooms[roomID]);
		// }

		if (room === null || room.battle.myPokemon === null) return [];
		const pokemonNames: string[] = room.battle.myPokemon.map(pokemon => pokemon.name);
		return pokemonNames
	}
}