import { error } from "jquery";
import type { Battle } from "../battle";
import type { BattleChoiceBuilder, BattleMoveRequest, BattleRequest, BattleRequestActivePokemon, BattleSwitchRequest } from "../battle-choices";
import type { Args, KWArgs } from "../battle-text-parser";
import { PS } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { ActivateSpecial, Forfeit, SelectMove, SelectTarget, SendChatMessage, SwapPokemon } from "./battle-actions";
import { NeuroAction, registerActions, sendContext, type ActionData, type ForceActions } from "./helpers/action-helpers";
import { config, delay } from "./helpers/setup";
import { AcceptChallenge, Rematch } from "./after-battle";

export function battleStart(args: Args, kw: KWArgs, preempt?: boolean) {
	console.log("battle start");
	PS.room.send("/timer on")
}

export function newTurn(args: Args, kw: KWArgs, preempt?: boolean) {
	
}

export function winsTie(args: Args, kw: KWArgs, preempt?: boolean){
	if (args[0] === 'tie'){
		sendContext("You and your opponent have tied this battle.", false)
		return;
	}

	if (args[1] === PS.user.name){
		sendContext("You won this battle!", false)
	}
	else{
		sendContext("You are a disappointment and you lost this battle.", false)
	}
}

export function prematureEnd(args: Args, kw: KWArgs, preempt?: boolean) {

}

export class BattleActionsHandler{
	constructor(private actions: NeuroAction<any>[] = []){
		this.actions = actions;
	}

	addSelectMove(active: BattleRequestActivePokemon): void{
		this.actions.push(new SelectMove(active))
	}

	addSwapPokemon(battle: Battle,request: BattleMoveRequest | BattleSwitchRequest , choices: BattleChoiceBuilder, ignoreTrapping: boolean | undefined): void{
		this.actions.push(new SwapPokemon(battle,request, choices, ignoreTrapping))
	}

	addSelectTarget(battle: Battle, choice: BattleChoiceBuilder){
		this.actions.push(new SelectTarget(battle, choice))
	}

	addChatMessage(room: BattleRoom){
		this.actions.push(new SendChatMessage(room))
	}

	addForfeit(){
		if (!config.ALLOW_RAGE_QUIT) return;
		this.actions.push(new Forfeit())
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
			this.actions.push(new ActivateSpecial(moveRequest))
		}
	}

	EndGameActions(): void{
		this.actions.push(new AcceptChallenge(), new Rematch())
	}

	// TODO: issue with registering actions when the rending update is in a place that doesn't matter e.g. a message being sent in chat.
	async registerBattleActions(): Promise<void>{
		// we delay in case actions take time to be added
		await delay(1000)
		if (this.actions.length === 0) return;

		// this doesn't work as javascript strict something or other idk.
		// const hasMatchingHandler = Client.actionHandlers.some(handler =>
		// 	handler.arguments.some((arg: ActionData) =>
		// 		this.actions.some(action => action.Name === arg.name)
		// 	)
		// );

		// if (!hasMatchingHandler) {
		// 	console.log("cancelled a register battle actions as there is a matching handler");
		// 	return;
		// }

		console.log("this actions length: " + this.actions.length);

		let force: ForceActions = {query: "", actionNames: []}
		registerActions(this.actions,force)
	}
}
