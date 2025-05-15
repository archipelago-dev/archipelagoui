export interface IController {
    initialize(): Promise<void>;
    destroy(): Promise<void>;
}
