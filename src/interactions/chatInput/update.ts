import { ChatInputCommandInteraction, ModalBuilder, SlashCommandBuilder, TextInputStyle } from "discord.js";
import { InteractionCommand } from "lib/command";
import { Question, toActionRows } from "lib/modal";

export const updateId = "update";
export const updateQuestions = [new Question("content", "Content", TextInputStyle.Paragraph, true)];
export const updateEmbedQuestions = [
    new Question("title", "Title", TextInputStyle.Short, true),
    new Question("description", "Description", TextInputStyle.Paragraph, true)
];

const description = "Sends a new post into all guilds with a defined bot channel. Developer only.";

const update: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addBooleanOption(option =>
            option
                .setRequired(true)
                .setName("embed")
                .setDescription("Whether to use an embed or not.")
        )
        .setName("update")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }
        
        if (client.permLevel(interaction.member) < 10) {
            return { error: "Insufficient permissions", ephemeral: true };
        }

        const embed = interaction.options.getBoolean("embed", true);
        const questions = embed ? updateEmbedQuestions : updateQuestions; 

        let modal = new ModalBuilder()
            .setCustomId(`${updateId}-${embed}`)
            .setTitle("Update")
            .setComponents(toActionRows(questions));

        await interaction.showModal(modal);

        return {};
    },
    help: {
        subcommands: [],
        description,
        category: "Management"
    }
};

export default update;