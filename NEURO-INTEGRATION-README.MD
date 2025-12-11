# Set-up

When using the integration the `testclient-beta.html` file in play.pokemonshowdown.com must be used.

Also a config file must be used, this should be present in the config folder in the root directory and should be called `neuro-config.js` the example file can be used to help set this up.

As a large amount of the assets and sounds not being distributed in the repo by default, you can use audio-scraper.py to download all of this automatically, The only needed dependency is [BeautifulSoup](https://pypi.org/project/beautifulsoup4/). This may take a few minutes as I'm too lazy to make it multi-threaded, this should only need to be ran once though.

# Examples

Here are a few example set-ups for the config.

## Recommended
This is the recommended setup for streams like chill streams where it is just Neuro / Evil, this does not allow for queuing and only allows for challenging as that was done in previous pokemon showdown streams.

```
	// This is needed as the test key method that would typically be used does not work in the new client.
	USERNAME: "{Username}",
	PASSWORD: "{Password}",
	// Defines SDK websocket URL
	NEURO_SERVER_URL: "ws://localhost:8000",

	// If you do not want Neuro to be able to queue for games on her own, this allows for you to disable it.
	REGISTER_SELECT_FORMAT: false,

	// This will allow neuro to forfeit, the action is called "ragequit" for the funny though.
	ALLOW_RAGE_QUIT: true,

	// This is the name displayed on the format button, formats that need a pre-built team, need a partner or are rated are not sent by default
	DISALLOWED_FORMATS: [],

	// Allows for Neuro to queue for rated formats, this mainly exists incase she is ran not ran on a private server as I assume that is against TOS without a bot account. Not sure though.
	// If this is true she can only queue for gen 9 unranked randon battle.
	ALLOW_RATED_FORMATS: true,

	// This will allow for Neuro to battle people who challenge her account from the main menu instead of only after a battle. This action will only register if atleast 5 people have sent challenges
	// If you want to prevent her from being able to enter standard queue then you must set REGISTER_SELECT_FORMAT to false.
	ALLOW_MAIN_MENU_CHALLENGER: true,

	// These two can be used for sending a challenge request to a player after logging in and when a battle ends.
	AUTOMATICALLY_CHALLENGE_PLAYER: "",
	CHALLENGE_PLAYER_FORMAT: "",

	// Automatically enable timer when a battle starts.
	ENABLE_TIMER: true,
```

## Specific user
You need to use these for only battling a specific user, this is for streams where Neuro only needs to battle a specific account e.g. Neuro vs Evil or a collab partner.
```
	// These two can be used for sending a challenge request to a player after logging in and when a battle ends.
	AUTOMATICALLY_CHALLENGE_PLAYER: "{otherPlayerUserName}",
	CHALLENGE_PLAYER_FORMAT: "",
```