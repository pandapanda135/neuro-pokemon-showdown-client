import type { Args, KWArgs } from "../battle-text-parser";
import { PS } from "../client-main";
import { sendContext } from "./helpers/action-helpers";

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