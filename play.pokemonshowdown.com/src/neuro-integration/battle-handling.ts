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
	const turnNumber: number = Number.parseInt(args[1]);
	console.log("new turn args: " + args.toString());
	let str = "This is happened during turn " + (turnNumber - 1).toString() + ":\n" + TurnStrings.map(str => str.trim()).join("\n");
	if (turnNumber == 1){
		str = "A new battle just started, this is what has happened in the set-up:\n" + TurnStrings.map(str => str.trim()).join("\n");
	}
	sendContext(str)
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
		if (BattleActionsHandler.CanUseSpecial(moveRequest, choices)){
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

	async endGameActions(): Promise<void>{
		this.actions.push(new AcceptChallenge())
	}

	async registerBattleActions(battle: Battle,request: BattleRequest | undefined = undefined , choices: BattleChoiceBuilder | undefined = undefined): Promise<void>{
		// we delay in case actions take time to be added
		await delay(1000)
		if (this.actions.length === 0) return;

		console.log("this actions length: " + this.actions.length);

		let force: ForceActions = {query: "", state: "", actionNames: []}
		let sentEndGameState: boolean = false;

		const currentIndex: number| undefined = choices?.index();
		var currentPokemon: ServerPokemon | undefined;
		if (currentIndex != undefined){
			currentPokemon = request?.side?.pokemon[currentIndex]
		}
		for (const action of this.actions) {
			console.log("going through action: " + action.Name + "   typeof: " + typeof action);
			var battleRequest: BattleRequestActivePokemon | null | undefined = choices?.currentMoveRequest();
			switch (action.Name) {
				case SelectMove.actionName:
					console.log("adding select move");
					if (request == undefined || choices == undefined || battleRequest == null) break;
					force.state += `These are the moves your ${currentPokemon?.name} has available:\n- ${SelectMove.getActiveMoves(battleRequest).join("\n- ")}\n`;
					break;
				case SwapPokemon.actionName:
					console.log(`adding swap pokemon: request: ${request}   choices: ${choices}   battle request ${battleRequest}`);
					if (request == undefined || choices == undefined || battle.myPokemon == null) break;

					var validPokemon = `${battle.myPokemon.map(pokemon => {
						if (pokemon.active) return "";

						const ability: Ability = battle.dex.abilities.get(pokemon.ability!)
						const item: Item = battle.dex.items.get(pokemon.item)
						const moves: string[] = pokemon.moves.map(move => battle.dex.moves.get(move).name)
						return `\n# Name: ${pokemon.name}\n## Stats:\n- Health: ${pokemon.hp}\n- Max Health: ${pokemon.maxhp}\n- Ability: ${ability.name}\n- Item: ${item.name}\n## Moves:\n- ${moves.join("\n- ")}`;
					}).filter(move => move.length !== 0)}\n`;

					if (currentPokemon?.fainted) {
						force.state += "Your main pokemon died, so you will need to change your pokemon before the next turn happens. These are your available options and what has happened in this turn:" + validPokemon + "\nThis is what has happened this turn\n" + TurnStrings.map(str => str.trim()).join("\n");
						force.ephemeral = true;
						break;
					}
					console.log("myside pokemon amount: " + battle.mySide.pokemon.length);
					force.state += `These are the pokemon you can switch to and their moves and abilities:${validPokemon}`
					break;
				case SelectTarget.actionName:
					if (choices == undefined) break;
					var moveTarget = choices.currentMove()?.target;
					if ((moveTarget === 'adjacentAlly' || moveTarget === 'adjacentFoe') && battle.gameType === 'freeforall') {
						moveTarget = 'normal';
					}
					var userSlot = choices.index() + Math.floor(battle.mySide.n / 2) * battle.pokemonControlled;
					var userSlotCross = battle.farSide.active.length - 1 - userSlot;

					var targets: string[] = battle.farSide.active.map((pokemon, i) => {
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
				case ActivateSpecial.actionName:
					if (battleRequest == null || choices == undefined) break;
					force.state += `This pokemon can ${BattleActionsHandler.SpecialString(battleRequest, choices)}\n`;
					break;
				case Forfeit.actionName:
					force.state += "";
					break;
				case SendChatMessage.actionName:
					force.state += "";
					break;
				case Rematch.actionName || AcceptChallenge.actionName:
					if (sentEndGameState) break;
					sentEndGameState = true;
					force.state += "The match has ended and now you must decide who you want to fight now.";
					break;
				default:
					break;
			}
		}

		force.ephemeral = true;
		console.log("force state: " + force.state);
		registerActions(this.actions,force)
	}

	static CanUseSpecial(moveRequest: BattleRequestActivePokemon, choices: BattleChoiceBuilder): boolean {
		const canDynamax: boolean | undefined = moveRequest.canDynamax && !choices.alreadyMax;
		const canMegaEvo: boolean | undefined = moveRequest.canMegaEvo && !choices.alreadyMega;
		const canMegaEvoX: boolean | undefined = moveRequest.canMegaEvoX && !choices.alreadyMega;
		const canMegaEvoY: boolean | undefined = moveRequest.canMegaEvoY && !choices.alreadyMega;
		const canZMove: boolean | undefined = moveRequest.zMoves && !choices.alreadyZ;
		const canUltraBurst: boolean | undefined = moveRequest.canUltraBurst;
		const canTerastallize: string | undefined = moveRequest.canTerastallize;

		return canDynamax || canMegaEvo || canMegaEvoX || canMegaEvoY || canZMove || canUltraBurst || canTerastallize != undefined && canTerastallize?.length > 0;
	}

	/**
	 * Get the string that applies to the current pokemon's special.
	 * @returns This will either return a string for the special or an empty string.
	 */
	static SpecialString(moveRequest: BattleRequestActivePokemon, choices: BattleChoiceBuilder): string{
		var str: string = "";

		const canDynamax: boolean | undefined = moveRequest.canDynamax && !choices.alreadyMax;
		const canMegaEvo: boolean | undefined = moveRequest.canMegaEvo && !choices.alreadyMega;
		const canMegaEvoX: boolean | undefined = moveRequest.canMegaEvoX && !choices.alreadyMega;
		const canMegaEvoY: boolean | undefined = moveRequest.canMegaEvoY && !choices.alreadyMega;
		const canZMove: boolean | undefined = moveRequest.zMoves && !choices.alreadyZ;
		const canUltraBurst: boolean | undefined = moveRequest.canUltraBurst;
		const canTerastallize: string | undefined = moveRequest.canTerastallize;

		if (canDynamax){
			str = moveRequest.gigantamax ? "Gigantamax" : "Dynamax";
		}
		else if(canMegaEvo || canMegaEvoX || canMegaEvoY){
			str = "Mega Evolve";
		}
		else if(canZMove){
			str = "Z Move";
		}
		else if(canUltraBurst){
			str = "Ultra Burst";
		}
		else if(canTerastallize){
			str = "Terastallize";
		}
		return str;
	}
}
