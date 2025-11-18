import { Client, isOpen } from "./setup";

export abstract class NeuroAction<T = void> {
	constructor(
		public Name: string,
		public Description: string,
        public Schema: object
	) {}

	abstract Validation(data: ActionData): ActionResult<T>;
	abstract Execute(data: T): Promise<void>;
}

export type ForceActions = {
	query: string;
	actionNames: string[];
	state?: string;
	ephemeral?: boolean;
}

export class ActionResult<T = void> {
	constructor(
		public result: boolean,
		public message: string,
		public returnType: T | null = null
	) {}
}

export type ActionData = {
	name: string;
	id: string;
	params: any;
}

interface ActionObject {
	name: string;
	description: string;
	schema: object;
}

function toValidAction(action: NeuroAction<any>): ActionObject {
	return {
		name: action.Name,
		description: action.Description,
		schema: action.Schema
	}
}

/**
 * This handles registering and forcing actions using helper classes
 * @param actionTypes These are the actions you want to send to Neuro
 * @param forceActions If this is defined, the actions you send in actionNames will be forced. If no names are defined all actions will be forced.
 */
export function registerActions(actionTypes: NeuroAction<any>[], forceActions?: ForceActions): void {
	// this checks if ws is open
	if (!isOpen()) return;

	let actions: ActionObject[] = [];

	actionTypes.forEach(action => {
		actions.push(toValidAction(action))
	});

	Client.registerActions(actions)
	if (forceActions !== undefined){
		if (forceActions.actionNames.length == 0){
			forceActions.actionNames = actions.map(a => a.name)
		}
		let state: string = forceActions.state === undefined ? "" : forceActions.state;
		let ephemeral: boolean = forceActions.ephemeral === undefined ? false : forceActions.ephemeral

		Client.forceActions(forceActions.query, forceActions.actionNames, state, ephemeral)
	}

	Client.onAction((actionData: ActionData) => {
		actionTypes.forEach(async (action: NeuroAction<any>) => {
			if (action.Name == actionData.name){
				let result:ActionResult<any> = action.Validation(actionData)
				Client.sendActionResult(actionData.id, result.result, result.message)
				if (!result.result){
					return;
				}
				Client.unregisterActions(actions.map((action) => action.name))

				await action.Execute(result.returnType)
			}
		});

		return
	})
}

export function sendContext(message: string, silent?: boolean) {
	Client.sendContext(message,silent === undefined ? true : silent)
}