
// this is an example of the config to be used in neuro-config.js . The config variable should be changed to window.config in neuro-config.js
config = {
	// #region Setup
	// This is needed as the test key method that would typically be used does not work in the new client.
	USERNAME: "NeuroSamaAI",
	PASSWORD: "What's my favourite number between one and ten? Twenty-four. It's my lucky number.",
	// Defines SDK websocket URL
	NEURO_SERVER_URL: "ws://localhost:8000",
	// #endregion

	// #region MainMenu
	// If you do not want Neuro to be able to queue for games on her own, this allows for you to disable it.
	REGISTER_SELECT_FORMAT: true,

	// This will allow neuro to forfeit, the action is called "ragequit" for the funny though.
	ALLOW_RAGE_QUIT: true,

	// This is the name displayed on the format button, formats that need a pre-built team, need a partner or are rated are not sent by default
	DISALLOWED_FORMATS: [],

	// Allows for Neuro to queue for rated formats, this mainly exists incase she is ran not ran on a private server as I assume that is against TOS without a bot account. Not sure though :)
	// If this is true she can only queue for gen 9 unranked randon battle.
	ALLOW_RATED_FORMATS: false,

	// This will allow for Neuro to battle people who challenge her account from the main menu instead of only after a battle. This action will only register if atleast 5 people have sent challenges
	// If you want to prevent her from being able to enter standard queue then you must set REGISTER_SELECT_FORMAT to false.
	ALLOW_MAIN_MENU_CHALLENGER: true,

	// These two can be used for sending a challenge request to a player after logging in and when a battle ends. You can use the name that appears in the dropdown UI for the format.
	AUTOMATICALLY_CHALLENGE_PLAYER: "",
	CHALLENGE_PLAYER_FORMAT: "",
	// #endregion

	// #region Battle
	// Automatically enable timer when a battle starts.
	ENABLE_TIMER: true,
	// #endregion
}