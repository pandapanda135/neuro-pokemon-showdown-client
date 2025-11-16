import type { Pokemon } from "../battle";
import type { Dex } from "../battle-dex";
import type { Move } from "../battle-dex-data";
import { PS, type RoomID } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";
import { printObj } from "./helpers/setup";

export class SelectMove extends NeuroAction<Dex.Move> {
	override Validation(data: ActionData): ActionResult<Move> {
		throw new Error("Method not implemented.");
	}
	override Execute(data: Move): Promise<void> {
		throw new Error("Method not implemented.");
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

export class SwapPokemon extends NeuroAction<Pokemon>{
	override Validation(data: ActionData): ActionResult<Pokemon> {
		throw new Error("Method not implemented.");
	}
	override Execute(data: Pokemon): Promise<void> {
		throw new Error("Method not implemented.");
	}
	constructor(){
		const schema: object = {type: 'object',properties: {pokemon:  {type: 'string',enum: SwapPokemon.getPossiblePokemon()}},required: ["pokemon"]}
		super("swap_pokemon","Change what pokemon is currently active.", schema)
	}

	static getPossiblePokemon(): string[]{
		if (PS === undefined || PS.rooms === undefined) return [];

		for (const roomID in PS.rooms) {
			console.log("room id: " + roomID);
			console.log("room" + PS.rooms[roomID]);
		}

		const room: BattleRoom = PS.rooms["battle"] as BattleRoom || null
		if (room === null || room.battle.myPokemon === null) return [];
		const pokemonNames: string[] = [];
		for (const pokemon of room.battle.myPokemon) {
			pokemonNames.push(pokemon.name)
		}
		return pokemonNames
	}
}