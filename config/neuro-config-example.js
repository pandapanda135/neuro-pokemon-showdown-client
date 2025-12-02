// This has to be changed to window.config
config = {
	// this is needed as the test key method in the old client doesn't work
	USERNAME: "NeuroSamaAI",
	PASSWORD: "What's my favourite number between one and ten? Twenty-four. It's my lucky number.",
	// Defines SDK websocket URL
	NEURO_SERVER_URL: "ws://localhost:8000",
	// this will allow neuro to forfeit, the action is called "ragequit" for the funny though.
	ALLOW_RAGE_QUIT: true,
	// This is the name displayed on the format button, formats that need a pre-built team, need a partner or are rated are not sent by default
	DISALLOWED_FORMATS: [],
	// allows for Neuro to queue for rated formats, this mainly exists incase she is ran not ran on a private server as I assume that is against TOS without a bot account. Not sure though :)
	// if this is true she can only queue for gen 9 unranked randon battle
	ALLOW_RATED_FORMATS: false,
    // If you do not want Neuro to be able to queue for games on her own, this allows for you to disable it.
	REGISTER_SELECT_FORMAT: true,
}