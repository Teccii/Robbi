import { ISettings } from "models/Settings";

declare module "discord.js" {
    export interface Base {
        settings: ISettings
    }
}