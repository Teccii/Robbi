import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";

const description = "Makes the bot send a message.";

const say: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setRequired(true)
                .setName("message")
                .setDescription("The message to send.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("say")
        .setDescription(description),
    exec: async (_client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const message = interaction.options.getString("message", true);

        return { content: message };
    },
    help: {
        subcommands: [],
        description,
        category: "Miscellaneous"
    }
};

export default say;