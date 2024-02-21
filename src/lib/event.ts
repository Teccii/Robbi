import { ClientEvents, Events } from "discord.js";
import CustomClient from "./client";

export default interface Event {
    name: keyof ClientEvents;
    once: boolean;
    exec: (client: CustomClient, ...args: any) => Promise<any>;
}