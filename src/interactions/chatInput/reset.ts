import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";

const description = "Resets the bot's chat AI.";

const reset: InteractionCommand = {
    data: new SlashCommandBuilder()
        .setName("reset")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        client.restartChat();

        return {
            embeds: [client.simpleEmbed({
                description: `Successfully reset the chat AI`,
                color: EmbedColor.Success
            })]
        };
    },
    help: {
        subcommands: [],
        description,
        category: "Management"
    }
};

export default reset;