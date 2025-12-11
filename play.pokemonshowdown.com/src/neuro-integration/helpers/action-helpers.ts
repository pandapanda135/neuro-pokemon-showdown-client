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

class HandlerWrapper {
	constructor(
		private actions: NeuroAction<any>[],
		public actionObjects: ActionObject[]
	){}

	Handler = (actionData: ActionData): void => {
		this.actions.forEach(async (action: NeuroAction<any>) => {
			if (action.Name !== actionData.name) return;

			const result:ActionResult<any> = action.Validation(actionData)
			// we need to unregister before sending the action result
			if (result.result){
				Client.unregisterActions(this.actionObjects.map((action) => action.name))
			}
			Client.sendActionResult(actionData.id, result.result, result.message)
			if (!result.result){
				return;
			}

			await action.Execute(result.returnType)
			Client.actionHandlers = Client.actionHandlers.filter(h => h !== this.Handler)
			currentHandlers = currentHandlers.filter(h => h !== this);
			return;
		})
	}
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

/** This stores all of the currently reigstered ActionHandlers from the neuro sdk, these handle running validation and execution when an action is ran. */
export let currentHandlers: HandlerWrapper[] = [];
/**
 * This handles registering and forcing actions using helper classes
 * @param actionTypes These are the actions you want to send to Neuro
 * @param forceActions If this is defined, the actions you send in actionNames will be forced. If no names are defined all actions will be forced.
 */
export function registerActions(actionTypes: NeuroAction<any>[], forceActions?: ForceActions): void {
	// this checks if ws is open
	if (!isOpen()) throw new Error("Tried to register actions when the client has not been connected yet.");

	let actions: ActionObject[] = [];
	actionTypes.forEach(action => {
		actions.push(toValidAction(action))
	});

	const handler = new HandlerWrapper(actionTypes, actions);

	// The Neuro API does not allow for replacing actions that are already registered
	if (currentHandlers.find(h => h.actionObjects.find(obj => actions.map(ac => ac.name).includes(obj.name)) !== undefined) !== undefined){
		throw new Error("Tried registering actions that are already registered." + actions.map(ac => ac.name).join("\n"));
	}
	console.log("adding handler to current handlers");
	currentHandlers.push(handler);

	Client.registerActions(actions);
	if (forceActions !== undefined){
		if (forceActions.actionNames.length == 0){
			forceActions.actionNames = actions.map(a => a.name)
		}
		let state: string = forceActions.state === undefined ? "" : forceActions.state;
		let ephemeral: boolean = forceActions.ephemeral === undefined ? false : forceActions.ephemeral

		Client.forceActions(forceActions.query, forceActions.actionNames, state, ephemeral)
	}

	Client.onAction(handler.Handler)
}

export function sendContext(message: string, silent?: boolean) {
	if (!isOpen()) throw new Error("Tried to send context when the client is not connected yet.")

	Client.sendContext(message,silent === undefined ? true : silent)
}