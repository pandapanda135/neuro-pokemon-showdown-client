// act can be found in updateControlsForPlayer in client-battle.js
// ?: should probably use updateMoveControls instead of updateControls for more control
let battleRoom;
let currentPokemon;
let switchables = [];

const printObj = (obj) => JSON.stringify(obj)

let sentEndActions = false;
async function registerBattleActions(clientBattle,curActive,possibleSwitch) {
	if (clientBattle != null) {battleRoom = clientBattle;}
	if (curActive != null) {currentPokemon = curActive;}
	if (possibleSwitch != null) {switchables = possibleSwitch;}

	while (NEUROCLIENT.client == undefined){
		await delay(2000)
	}
	if (sentEndActions) return;

	if (battleRoom == null || battleRoom == undefined){
		return;
	}
	// if timer inactive turn on
	if (!(battleRoom.battle.kickingInactive && battleRoom.request && !battleRoom.request.wait && !(battleRoom.choice && battleRoom.choice.waiting))){
		battleRoom.setTimer('on')
	}

	var availableActions = []
	let query = 'The battle has ended you should decide what to do now.'
    const state = 'You should decide what to do soon.'

	if ((curActive == null && possibleSwitch == null) && !sentEndActions){
		sentEndActions = true;
		availableActions = ["request_rematch","new_game"]
		registerActionsObject(battleActions,availableActions,query,state);
		return;
	}

	console.log("battle actions: " + printObj(battleActions[0]["schema"]["properties"]))
	console.log("choices " + printObj(clientBattle.choice) + "   current active: " + printObj(curActive))

	// this should be the action's name
	var canUseMove = false;

	// if pokemon dies or needs to be changed
	if (currentPokemon == null && switchables != null){
		query = "You need to switch pokemon from one of the options presented"
	}
	else{ // maybe change from else just incase
		query = 'It is time to decide what you will do, your current pokemon is ' + currentPokemon.name + " they have " + currentPokemon.hp
			+  " health out of the max " + currentPokemon.maxhp

		for (var i = 0; i < curActive.moves.length; i++) {
			if (curActive.moves[i].disabled){
				continue
			}
			else{
				canUseMove = true;
			}
		}
	}

	if (canUseMove){
		query = query + ". These are the moves this pokemon has"
		currentPokemon.moves.forEach(move => {
		query = query + "\n" + move.move + " pp: " + move.pp + " max pp: " + move.maxpp
		});

		availableActions.push("select_move")
	}

	if (switchables.length > 0 || trapped){
		query = query + ". These are they other pokemon you can switch to and their moves"
		switchables.forEach(pokemon => {
			let moveString = pokemon.moves.forEach(move => {
			" " + move.move + " pp: " + move.pp + " max pp: " + move.maxpp
			});
			query = query + "\n" + pokemon.name + " moves: " + moveString
		});

		availableActions.push("switch_pokemon")
	}

	if (window.AllowNeuroRageQuitMatch){
		availableActions.push("ragequit")
	}

	if (availableActions.length == 0){
		console.error("no battle actions available");
		return
	}

	registerActionsObject(battleActions,availableActions,query,state)
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
	name: 'new_game',
	description: 'Queue for a new game against a new opponent.',
	schema: {
		type: 'object'
	},
	handler: handlePostGame
},
{
	name: 'request_rematch',
	description: 'Request to rematch this opponent.',
	schema: {
		type: 'object'
	},
	handler: handlePostGame
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
		handleActionResult(actionData.id,false,actionData.params.move + " is not a valid move.")
		return;
	}

	handleActionResult(actionData.id,true,'Using ' + actionData.params.move)

	console.log("moves: " + printObj(currentPokemon.moves.map(move => move.move)));

	// game starts from 1
	let index = currentPokemon.moves.map(move => move.move).indexOf(actionData.params.move) + 1;
	console.log("index: " + index + "   param: " + actionData.params.move);
	let moveStr = "move " + index;
	battleRoom.sendDecision([moveStr]);
}

function handleSwitchPokemon(actionData) {
	if (!switchables.map(pokemon => pokemon.name).includes(actionData.params.pokemon)){
		handleActionResult(actionData.id,false,actionData.params.pokemon + " is not a valid pokemon.")
		return;
	}

	if (currentPokemon.trapped){
		handleActionResult(actionData.id,false,"You cannot switch pokemon as your current is trapped.")
		return;
	}

	handleActionResult(actionData.id,true,'Switching to ' + actionData.params.pokemon)

	console.log("pokemon: " + printObj(switchables.map(pokemon => pokemon.name)));

	// game starts from 1
	let index = switchables.map(pokemon => pokemon.name).indexOf(actionData.params.pokemon) + 1;
	console.log("index: " + index + "   param: " + actionData.params.pokemon);
	let moveStr = "switch " + index;
	battleRoom.sendDecision([moveStr]);
}

window.rematch = false;
async function handlePostGame(actionData) {
	if (!battleRoom.battle.ended){
		handleActionResult(actionData.id,false,"The battle has not ended yet.");
		return;
	}
	handleActionResult(actionData.id,true,"exiting current match")

	if (actionData.name == 'request_rematch'){
		window.rematch = true;
		battleRoom.closeAndRematch()
		battleRoom = null;
		sentEndActions = false;
		await delay(30000) // 30 sec

		// if has not accepted the rematch, (battleRoom should be set back if they accept) we can allow her to look for a new match
		if (battleRoom == null){
			battleRoom.send("/reject") // this should remove the last send challenge
			registerFormat()
		}

		return
	}
	else{
		window.rematch = false;
		battleRoom.closeAndMainMenu()
		battleRoom = null;
		sentEndActions = false;
	}
}

function handleForfeit(actionData) {
	handleActionResult(actionData.id,true,'Leaving this match')

	battleRoom.forfeit()
}

// this is called in client-battle
function finalizeForfeit(popup){
	popup.submit()
}