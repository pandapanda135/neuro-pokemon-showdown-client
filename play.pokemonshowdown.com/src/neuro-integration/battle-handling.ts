import type { Battle } from "../battle";
import type { BattleChoiceBuilder, BattleRequest, BattleRequestActivePokemon } from "../battle-choices";
import type { Args, KWArgs } from "../battle-text-parser";
import { PS } from "../client-main";
import { ActivateSpecial, SelectMove, SwapPokemon } from "./battle-actions";
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

	addSelectMove(active: BattleRequestActivePokemon): void{
		this.actions.push(new SelectMove(active))
	}

	addSwapPokemon(battle: Battle): void{
		this.actions.push(new SwapPokemon(battle))
	}

	activateSpecial(moveRequest: BattleRequestActivePokemon, choices: BattleChoiceBuilder): void{
		const canDynamax = moveRequest.canDynamax && !choices.alreadyMax;
		const canMegaEvo = moveRequest.canMegaEvo && !choices.alreadyMega;
		const canMegaEvoX = moveRequest.canMegaEvoX && !choices.alreadyMega;
		const canMegaEvoY = moveRequest.canMegaEvoY && !choices.alreadyMega;
		const canZMove = moveRequest.zMoves && !choices.alreadyZ;
		const canUltraBurst = moveRequest.canUltraBurst;
		const canTerastallize = moveRequest.canTerastallize;

		if ((canDynamax || canMegaEvo || canMegaEvoX || canMegaEvoY || canZMove || canUltraBurst || canTerastallize)){
			this.actions.push(new ActivateSpecial())
		}
	}

	registerActionsRequest(request: BattleRequest): void{
		let force: ForceActions = {query: "", actionNames: []}
		registerActions(this.actions,force)
	}
}
