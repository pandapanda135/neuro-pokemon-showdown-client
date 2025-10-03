var mainMenuRoom;
var formatPopup

function setMainMenu(menu) {
	mainMenuRoom = menu;
}

function setFormat(menu) {
	formatPopup = menu;
}

function searchNewGame() {
	mainMenuRoom.search(null,document.getElementsByName('search'))
}

function registerFormat(){
	var availableActions = [];
	availableActions.push("select_format")

	const query = 'You can now select a format to play.';
    const state = 'These are formats.'

	registerActionsObject(menuActions,availableActions,query,state)
}

var menuActions = [{
	name: 'select_format',
	description: 'Select the format you want to play in',
	schema: {
		type: 'object',
		properties: {
			get format() {
				let names = [];

				for (const key in window.BattleFormats) {
					let format = window.BattleFormats[key]
					if (window.DisallowedBattleFormats.includes(key) || format.isTeambuilderFormat || format.partner){
						continue;
					}

					console.log("adding format: " + printObj(format));

					names.push(format.name);
				}
				return {
				type: 'string',
				enum: names
				};
			}
		},
		required: ['format'],
	},
	handler: handleFormat,
}]

function handleFormat(actionData) {
	let format;
	let realKey;
	for (const key in window.BattleFormats) {
		if (window.BattleFormats[key].name == actionData.params.format) {
			realKey = key
			format = window.BattleFormats[key]
		}
	}

	if (format == undefined || realKey == undefined){
		handleActionResult(actionData.id,false,"The format you gave was not valid.");
		return;
	}

	console.log("action id: " + printObj(actionData));

	handleActionResult(actionData.id,true,"selecting " + format.name)

	mainMenuRoom.format(format,document.getElementsByName('format'))
	formatPopup.selectFormat(realKey)
	searchNewGame()
}

async function onStartRegister() {
	while (NEUROCLIENT.client == null || window.BattleFormats === undefined){
		await delay(1000)
	}

	registerFormat()
}

onStartRegister()