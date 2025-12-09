import { PS } from "../client-main";
import { ActionResult, NeuroAction, type ActionData } from "./helpers/action-helpers";
export const challengers:RecievedChallenger[] = [];

export type RecievedChallenger = {
	name: string;
	format: string;
}

export class AcceptChallenge extends NeuroAction<RecievedChallenger> {
	override Validation(data: ActionData): ActionResult<RecievedChallenger> {
		var name: string = data.params.opponent;
		var format: string = data.params.format;

		if (name === undefined || format === undefined){
			return new ActionResult(false, "")
		}

		return new ActionResult(true, "You have chosen to challenge " + name, {name: name, format: format})
	}
	override async Execute(data: RecievedChallenger): Promise<void> {
		PS.send("/challenge " + data.name + ", " + data.format)
	}

	constructor(){
		super("accept_challenge", "Accept a challenge request against an opponent.",
		{type: "object", properties: {opponent: {enum: challengers.map(challenge => challenge.name)},
		format: {enum: challengers.map(challenge => challenge.format)}},
		required: ['opponent']})
	}
}

export class Rematch extends NeuroAction{
	override Validation(data: ActionData): ActionResult<void> {
		throw new Error("Method not implemented.");
	}
	override Execute(data: void): Promise<void> {
		throw new Error("Method not implemented.");
	}
	constructor(){
		super("rematch", "Ask your opponent for a rematch.", {type: "object"})
	}
}