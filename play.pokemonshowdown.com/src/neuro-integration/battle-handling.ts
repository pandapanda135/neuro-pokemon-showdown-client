import type { BattleRequest } from "../battle-choices";
import type { Args, KWArgs } from "../battle-text-parser";
import { PS } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { SelectMove, SwapPokemon } from "./battle-actions";
import { NeuroAction, registerActions, sendContext, type ForceActions } from "./helpers/action-helpers";

export const target = new EventTarget();

export function battleStart(args: Args, kw: KWArgs, preempt?: boolean) {
	
}

export function newTurn(args: Args, kw: KWArgs, preempt?: boolean) {
	
}

export function winsTie(args: Args, kw: KWArgs, preempt?: boolean){
	if (args[0] == 'tie'){
		sendContext("You and your opponent have tied this battle.")
		return;
	}

	if (args[1] == PS.user.name){
		sendContext("You won this battle!")
	}
	else{
		sendContext("You are a disappointment and you lost this battle.")
	}
}

export function prematureEnd(args: Args, kw: KWArgs, preempt?: boolean) {
	
}

export class BattleActionsHandler{
	private actions: NeuroAction<any>[] = []
	constructor(){}

	addSelectMove(room: BattleRoom): void{
		this.actions.push(new SelectMove())
	}

	addSwapPokemon(room: BattleRoom): void{
		this.actions.push(new SwapPokemon(room))
	}

	registerActionsRequest(request: BattleRequest): void{
		let force: ForceActions = {query: "", actionNames: []}
		registerActions(this.actions,force)

		return
	}
}
