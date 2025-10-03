// act can be found in updateControlsForPlayer in client-battle.js
// ?: should probably use updateMoveControls instead of updateControls for more control
let battleRoom;
let currentPokemon;
let switchables = [];

const printObj = (obj) => JSON.stringify(obj)

async function registerBattleActions(clientBattle,curActive,possibleSwitch) {
	battleRoom = clientBattle
	currentPokemon = curActive;
	switchables = possibleSwitch
	while (NEUROCLIENT.client == undefined){
		await delay(2000)
	}

	console.log("battle actions: " + printObj(battleActions[0]["schema"]["properties"]))
	console.log("choices " + printObj(clientBattle.choice) + "   current active: " + printObj(curActive))

	// this should be the action's name
	var availableActions = [];
	var canUseMove = false;

	for (var i = 0; i < curActive.moves.length; i++) {
		if (curActive.moves[i].disabled){
			continue
		}
		else{
			canUseMove = true;
		}
	}

	if (canUseMove){
		availableActions.push("select_move")
	}

	if (switchables.length > 0 || trapped){
		availableActions.push("switch_pokemon")
	}

	if (window.AllowNeuroRageQuitMatch){
		availableActions.push("ragequit")
	}

	if (availableActions.length == 0){
		console.error("no battle actions available");
		return
	}

	let actions = [];

	battleActions.forEach(action => {
		if (availableActions.includes(action.name)){
			actions.push(toValidAction(action))
		}
	});

	NEUROCLIENT.client.registerActions(actions)

    const query = 'It is time to decide what ' + currentPokemon.name + " will do."
    const state = 'You should decide what to do soon.'
    NEUROCLIENT.client.forceActions(query, availableActions, state)

	NEUROCLIENT.client.onAction(actionData => {
		battleActions.forEach(action => {
			if (action.name == actionData.name){
				action.handler(actionData)
			}
		});

		return
	})
}

function toValidAction(action) {
	return {
        name: action.name,
        description: action.description,
        schema: action.schema,
    };
}

var battleActions = [{
	name: 'select_move',
	description: 'Select a move to use',
	schema: {
		type: 'object',
		properties: {
			get move() {
				if (currentPokemon == undefined){
					return {}
				}

				return {
				type: 'string',
				enum: currentPokemon.moves
					.filter(m => ( m.pp > 0 || m.pp == '&ndash;') && !m.disabled) // I think the second pp means infinite, no 100% sure though
					.map(m => m.move)
				};
			}
			// move: { type: 'string', enum: currentPokemon.moves
			// 	.filter(move => move.pp > 0)
			// 	.map(move => move.move)
			// },
		},
		required: ['move'],
	},
	handler: handleSelectMove,
},
{
	name: 'switch_pokemon',
	description: 'Change the currently selected pokemon',
	schema: {
		type: 'object',
		properties: {
			get pokemon() {
				if (switchables == undefined){
					return {}
				}

				return {
				type: 'string',
				enum: switchables.filter(pokemon => !pokemon.fainted).map(pokemon => pokemon.name)
				};
			}
			// pokemon: { type: 'string', enum: switchables.map(pokemon => pokemon.name)},
		},
		required: ['pokemon']
	},
	handler: handleSwitchPokemon,
},
{
	name: 'ragequit',
	description: 'This will forfeit this match, you should only do this when you really want to.',
	schema: {
		type: 'object'
	},
	handler: handleForfeit,
}]

function handleSelectMove(actionData)
{
	if (!currentPokemon.moves.map(move => move.move).includes(actionData.params.move)){
		window.NeuroIntegration.NEURO.client.sendActionResult(
          actionData.id,false,actionData.params.move + " is not a valid move."
        )
	}

	window.NeuroIntegration.NEURO.client.sendActionResult(
          actionData.id,true,'Using ' + actionData.params.move
        )

	console.log("moves: " + printObj(currentPokemon.moves.map(move => move.move)));

	// game starts from 1
	let index = currentPokemon.moves.map(move => move.move).indexOf(actionData.params.move) + 1;
	console.log("index: " + index + "   param: " + actionData.params.move);
	let moveStr = "move " + index;
	battleRoom.sendDecision([moveStr]);
	return
}

function handleSwitchPokemon(actionData) {
	if (!switchables.map(pokemon => pokemon.name).includes(actionData.params.pokemon)){
		window.NeuroIntegration.NEURO.client.sendActionResult(
          actionData.id,false,actionData.params.pokemon + " is not a valid pokemon."
        )
	}

	if (currentPokemon.trapped){
		window.NeuroIntegration.NEURO.client.sendActionResult(
          actionData.id,false,"You cannot switch pokemon as your current is trapped."
        )
	}

	window.NeuroIntegration.NEURO.client.sendActionResult(
          actionData.id,true,'Switching to ' + actionData.params.pokemon
        )

	console.log("pokemon: " + printObj(switchables.map(pokemon => pokemon.name)));

	// game starts from 1
	let index = switchables.map(pokemon => pokemon.name).indexOf(actionData.params.pokemon) + 1;
	console.log("index: " + index + "   param: " + actionData.params.pokemon);
	let moveStr = "switch " + index;
	battleRoom.sendDecision([moveStr]);
	return
}

function handleForfeit(actionData) {
	window.NeuroIntegration.NEURO.client.sendActionResult(
          actionData.id,true,'Leaving this match'
        )

	battleRoom.forfeit()
}

// this is called in client-battle
function finalizeForfeit(popup){
	popup.submit()
}

console.log("battle actions: " + printObj(battleActions[0]["schema"]["properties"]))
