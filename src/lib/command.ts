import {
    ActionRowBuilder,
    AutocompleteInteraction,
    CommandInteraction,
    ContextMenuCommandBuilder,
    EmbedBuilder,
    InteractionReplyOptions,
    SlashCommandBuilder
} from "discord.js";
import CustomClient from "./client";

export interface InteractionCommand {
    data: SlashCommandBuilder | ContextMenuCommandBuilder;
    autocompleteOptions?: AutocompleteOptionGenerators;
    help: {
        subcommands: string[];
        description: string;
        category: string;
    };

    exec: (client: CustomClient, interaction: CommandInteraction) => Promise<CustomInteractionReplyOptions>;
}

export type AutocompleteOptionGenerators = {
    [key: string]: (
        filter: string,
        interaction: AutocompleteInteraction
    ) => { name: string; value: string; }[];
};

export interface CustomInteractionReplyOptions {
    content?: string;
    error?: string;
    embeds?: EmbedBuilder[];
    components?: ActionRowBuilder<any>[];
    files?: InteractionReplyOptions["files"];
    ephemeral?: boolean;
}

export function toReplyOptions(client: CustomClient, data: CustomInteractionReplyOptions): InteractionReplyOptions {
    const result: InteractionReplyOptions = {};

    if (data.content) {
        result.content = data.content;
    } else if (data.error) {
        result.embeds = [client.simpleError(data.error)];
    }

    if (data.embeds) result.embeds = data.embeds;
    if (data.components) result.components = data.components;
    if (data.files) result.files = data.files;
    if (data.ephemeral) result.ephemeral = true;

    return result;
}