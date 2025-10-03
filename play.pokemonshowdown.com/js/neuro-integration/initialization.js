const Neuro = {
	client: null
};

const NEUROCLIENT = Object.create(Neuro);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function SetClient() {
	let client = window.NeuroIntegration.neuroClient;
	while (client.ws.readyState != client.ws.OPEN)
	{
		await delay(1000)
	}

	NEUROCLIENT.client = client
	window.NeuroIntegration.NEURO = NEUROCLIENT
}

function toValidAction(action) {
	return {
        name: action.name,
        description: action.description,
        schema: action.schema,
    };
}

var previousActionNames = [];
function registerActionsObject(actionTable,availableActions,query,state,ephemeral = false) {
	let actions = [];

	actionTable.forEach(action => {
		if (availableActions.includes(action.name)){
			actions.push(toValidAction(action))
		}
	});

	NEUROCLIENT.client.registerActions(actions)
    NEUROCLIENT.client.forceActions(query, availableActions, state,ephemeral)

	NEUROCLIENT.client.onAction(actionData => {
		actionTable.forEach(action => {
			if (action.name == actionData.name){
				action.handler(actionData)
			}
		});

		return
	})

	previousActionNames = availableActions
	console.log("previous action: " + printObj(previousActionNames));
}

// wrapper for action result and unregister action
function handleActionResult(id,result,message) {
	console.log("previous action in handle: " + printObj(previousActionNames));
	if (result == true) NEUROCLIENT.client.unregisterActions(previousActionNames)
	NEUROCLIENT.client.sendActionResult(id,result,message)
}

// this is so for if previousActions could be incorrect
function handleRegisteredActionResult(registeredActions,id,result,message) {
	if (result == true) NEUROCLIENT.client.unregisterActions(registeredActions)
	NEUROCLIENT.client.sendActionResult(id,result,message)
}


SetClient()
