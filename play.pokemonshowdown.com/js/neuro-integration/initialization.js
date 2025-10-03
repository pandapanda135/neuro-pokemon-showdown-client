const Neuro = {
	client: null
};

const NEUROCLIENT = Object.create(Neuro);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function SetClient() {
	let client = window.NeuroIntegration.neuroClient;
	while (client.ws.readyState != client.ws.OPEN)
	{
		await delay(2000)
	}

	NEUROCLIENT.client = client
	window.NeuroIntegration.NEURO = NEUROCLIENT
}

SetClient()
