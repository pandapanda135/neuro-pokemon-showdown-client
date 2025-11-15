import { ActionData, ActionResult, ForceActions, NeuroAction, registerActions } from "./helpers/action-helpers";
import { delay, isOpen } from "./helpers/setup";

class TestAction extends NeuroAction {
	Validation(data: ActionData): ActionResult<void> {
		console.log("this is validation log")
		return new ActionResult(data.id,true,"This is a test success message", undefined)
	}
	Execute(_data: void): void {
		console.log("This is the execute log")
	}

}
class SelectFormat extends NeuroAction<string> {
	Validation(data: ActionData): ActionResult<string> {
		throw new Error("Method not implemented.");
	}
	Execute(data: string): void {
		throw new Error("Method not implemented.");
	}
	constructor(description: string, schema: object){
		super("select_format",description,schema);
	}
}

async function registerTest(): Promise<void> {
	while (!isOpen()){
		await delay(1000);
	}

	console.log("registering actions")
	let actions: NeuroAction[] = [new TestAction("test_name", "test description", {type: 'object',properties: {},required: []})]
	let format: SelectFormat = new SelectFormat("This is the description", {})
	registerActions(actions)
}

registerTest()