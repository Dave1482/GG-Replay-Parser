/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @returns {Replay}
*/
export function parse(data: Uint8Array): Replay;
/**
*/
export class Replay {
  free(): void;
/**
* @param {boolean} pretty
* @returns {string}
*/
  header_json(pretty: boolean): string;
/**
* @param {boolean} pretty
* @returns {Uint8Array}
*/
  full_json(pretty: boolean): Uint8Array;
/**
* @returns {string | undefined}
*/
  network_err(): string | undefined;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_replay_free: (a: number) => void;
  readonly replay_header_json: (a: number, b: number, c: number) => void;
  readonly replay_full_json: (a: number, b: number, c: number) => void;
  readonly replay_network_err: (a: number, b: number) => void;
  readonly parse: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
