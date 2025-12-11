import type { NeuroClient } from "../../../../node_modules/neuro-game-sdk/dist/index";

export let Client: NeuroClient

export const config = (window as any).config;

export function printObj(obj: object, includeDecycle: boolean = false): string{
	try {
		return JSON.stringify(includeDecycle ? decycle(obj) : obj)
	} catch (error) {
		console.error(error);
		return "Error parsing object";
	}
}

// stolen from stackoverflow
// https://stackoverflow.com/questions/9382167/serializing-object-that-contains-cyclic-object-value
function decycle(obj: object, stack: any[] = []): any {
    if (!obj || typeof obj !== 'object')
        return obj;

    if (stack.includes(obj))
        return null;

    let s = stack.concat([obj]);

    return Array.isArray(obj)
        ? obj.map(x => decycle(x, s))
		: Object.entries(obj)
			.map(([k, v]) => [k, decycle(v, s)]);
}

export function isOpen(): boolean {
	return Client.ws.readyState !== 0;
}

export async function delay(ms:number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve,ms))
}

export function secondsToMs(ms: number){
	return ms * 1000;
}