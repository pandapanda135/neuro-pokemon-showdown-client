import { PS } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";
import { formatKeyToName, isValidFormat } from "./main-menu-handling";
export const challengers:RecievedChallenger[] = [];

export type RecievedChallenger = {
	name: string;
	format: string;
}

export class AcceptChallenge extends NeuroAction<RecievedChallenger> {
	static actionName = "accept_challenge";

	override Validation(data: ActionData): ActionResult<RecievedChallenger> {
		var name: string = data.params.opponent;
		var format: string = data.params.format;

		if (name === undefined || format === undefined){
			return new ActionResult(false, "")
		}

		if (challengers.find(challenger => challenger.name === name && formatKeyToName(challenger.format) === format) === undefined){
			return new ActionResult(false, "You provided an invalid name and or format.")
		}

		return new ActionResult(true, "You have chosen to challenge " + name, {name: name, format: format})
	}
	override async Execute(data: RecievedChallenger): Promise<void> {
		PS.send("/challenge " + data.name + ", " + data.format)
	}

	constructor(){
		super(AcceptChallenge.actionName, "Accept a challenge request against an opponent.",
		{type: "object", properties: {opponent: {enum: challengers.map(challenge => challenge.name)},
		format: {enum: challengers.filter(challenge => !isValidFormat(challenge.format)).map(challenge => formatKeyToName(challenge.format))}},
		required: ['opponent', 'format']})
	}
}

/** We prefer challenges to this but I'm too lazy to delete */
export class Rematch extends NeuroAction{
	static actionName = "rematch"

	override Validation(data: ActionData): ActionResult<void> {
		return new ActionResult(true, "")
	}
	override async Execute(data: void): Promise<void> {
		throw new Error("Not implemented");

		// var room: BattleRoom = (PS.room as BattleRoom);
		// PS.send("/challenge " + room.battle.farSide.name + ", " + data.format)
	}
	constructor(){
		super(Rematch.actionName, "Ask your opponent for a rematch.", {type: "object"})
	}
}