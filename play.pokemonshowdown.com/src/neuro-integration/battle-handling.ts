import type { Battle, ServerPokemon } from "../battle";
import type { BattleChoiceBuilder, BattleMoveRequest, BattleRequest, BattleRequestActivePokemon, BattleSwitchRequest } from "../battle-choices";
import type { Args, KWArgs } from "../battle-text-parser";
import { PS } from "../client-main";
import type { BattleRoom } from "../panel-battle";
import { ActivateSpecial, Forfeit, SelectMove, SelectTarget, SendChatMessage, SwapPokemon } from "./battle-actions";
import { NeuroAction, registerActions, sendContext, type ForceActions } from "./helpers/action-helpers";
import { config, delay } from "./helpers/setup";
import { AcceptChallenge, Rematch } from "./after-battle";
import type { Ability, Item, Move } from "../battle-dex-data";

enum States {
	Main_Menu,
	Select_Move,
	Select_Target,
	Post_Move,
	End_Game,
}

export let TurnStrings: string[] = [];

export function battleStart(args: Args, kw: KWArgs, preempt?: boolean) {
	console.log("battle start");
	sendContext("At the end of each turn, you will be sent what happened in that turn. Each action in that turn will be separated by a new line carriage.")
	if (!config.ENABLE_TIMER) return;
	PS.room.send("/timer on")
}

export function newTurn(args: Args, kw: KWArgs, preempt?: boolean) {
	console.log("new turn args: " + args.toString());
	sendContext("This is happened during turn: " + args[1] + TurnStrings.map(str => str.trim()).join("\n"))
	TurnStrings = [];
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
	constructor(private actions: NeuroAction<any>[] = [], private currentState:States = States.Select_Move){
		this.actions = actions;
		this.currentState = currentState;
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

	addChatMessage(room: BattleRoom){
		this.actions.push(new SendChatMessage(room))
	}

	addForfeit(){
		if (!config.ALLOW_RAGE_QUIT) return;
		this.actions.push(new Forfeit())
	}

	endGameActions(): void{
		this.actions.push(new AcceptChallenge(), new Rematch())
	}

	// TODO: issue with registering actions when the rending update is in a place that doesn't matter e.g. a message being sent in chat.
	async registerBattleActions(battle: Battle,request: BattleRequest | undefined = undefined , choices: BattleChoiceBuilder | undefined = undefined): Promise<void>{
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

		let force: ForceActions = {query: "", state: "", actionNames: []}

		let endGameState: boolean = false;

		const currentIndex: number| undefined = choices?.index();
		const currentPokemon: ServerPokemon | undefined = request?.side?.pokemon[currentIndex!];
		for (const action of this.actions) {
			console.log("going through action: " + action.Name + "   typeof: " + typeof action);
			switch (action.Name) {
				case "select_move":
					console.log("adding select move");
					const battleRequest: BattleRequestActivePokemon | null | undefined = choices?.currentMoveRequest();
					if (request == undefined || choices == undefined || battleRequest == null) break;
					force.state += `These are the moves your ${currentPokemon?.name} has available:\n-${SelectMove.getActiveMoves(battleRequest).join("\n- ")}\n`;
					break;
				case "swap_pokemon":
					console.log("adding swap pokemon");
					if (request == undefined || choices == undefined || battleRequest == null || battle.myPokemon == null) break;

					console.log("myside pokemon amount: " + battle.mySide.pokemon.length);
					force.state += `These are the pokemon you can switch to and their moves and abilities:${battle.myPokemon.map(pokemon => {
						if (pokemon.name === currentPokemon?.name) return "";

						// TODO: these also aren't correct should probably look at UI
						const ability: Ability = battle.dex.abilities.get(pokemon.ability!)
						const item: Item = battle.dex.items.get(pokemon.item)
						const moves: string[] = pokemon.moves.map(move => battle.dex.moves.get(move).name)
						return `\n# Name: ${pokemon.name}\n## Ability: ${ability.name}\n## Item: ${item.name}\n## Moves: \n- ${moves.join("\n- ")}`;
					}).filter(move => move.length !== 0)}\n`;
					break;
				case "select_target":
					if (choices == undefined) break;
					let moveTarget = choices.currentMove()?.target;
					if ((moveTarget === 'adjacentAlly' || moveTarget === 'adjacentFoe') && battle.gameType === 'freeforall') {
						moveTarget = 'normal';
					}
					const userSlot = choices.index() + Math.floor(battle.mySide.n / 2) * battle.pokemonControlled;
					const userSlotCross = battle.farSide.active.length - 1 - userSlot;

					const targets: string[] = battle.farSide.active.map((pokemon, i) => {
						if (pokemon == null) return "";
						if (moveTarget === 'adjacentAlly' || moveTarget === 'adjacentAllyOrSelf') {
							return "";
						} else if (moveTarget === 'normal' || moveTarget === 'adjacentFoe') {
							if (Math.abs(userSlotCross - i) > 1) return "";
						}

						if (pokemon.fainted) return "";
						return pokemon.name;
					}).reverse().filter(str => str?.length !== 0);
					force.state += `These are the pokemon that you can target:\n-${targets.join("\n-")}`;
					break;
				case "activate_special":
					force.state += "";
					break;
				case "forfeit":
					force.state += "";
					break;
				case "send_chat_message":
					force.state += "";
					break;
				case "rematch":
					if (endGameState) break;
					endGameState = true;
					force.state += "The match has ended and now you must decide who you want to fight now.";
					break;
				default:
					break;
			}
		}

		console.log("force state: " + force.state);
		
		registerActions(this.actions,force)
	}
}
