import type { NeuroClient } from "../../../../node_modules/neuro-game-sdk/dist/index";

export let Client: NeuroClient

export const printObj = (obj: object) => JSON.stringify(obj)

export function isOpen(): boolean {
	return Client.ws.readyState !== 0;
}

export async function delay(ms:number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve,ms))
}