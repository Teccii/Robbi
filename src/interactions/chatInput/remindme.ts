import { ChatInputCommandInteraction, ModalBuilder, SlashCommandBuilder, TextInputStyle } from "discord.js";
import { InteractionCommand } from "lib/command";
import { Question, toActionRows } from "lib/modal";

export const remindmeId = "remindme";
export const remindmeQuestions = [
    new Question(
        "reason",
        "What do you want to be reminded about?",
        TextInputStyle.Paragraph,
        true
    ),
];

const description = "Sets a reminder to be activated in the future.";

const ping: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setAutocomplete(true)
                .setRequired(true)
                .setName("length")
                .setDescription("When should you be reminded?")    
        )
        .setName("remindme")
        .setDescription(description),
    autocompleteOptions: {
        length: (filter) => [
            { name: "1m", value: "1m" },
            { name: "1h", value: "1h" },
            { name: "1d", value: "1d" },
            { name: "1w", value: "1w" },
            { name: "1M", value: "1M" },
            { name: "1y", value: "1y" },
        ].filter(option => option.value.startsWith(filter))
    },
    exec: async (_client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const modal = new ModalBuilder()
            .setCustomId(`${remindmeId}-${interaction.options.getString("length", true)}`)
            .setTitle("Remind Me")
            .setComponents(toActionRows(remindmeQuestions));

        await interaction.showModal(modal);

        return {};
    },
    help: {
        subcommands: [],
        description,
        category: "Miscellaneous"
    }
};

export default ping;