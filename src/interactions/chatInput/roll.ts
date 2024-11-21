import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";

const description = "Roll an N-sided die.";

const roll: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addIntegerOption(option =>
            option
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
                .setName("sides")
                .setDescription("How many sides should the die have?")    
        )
        .setName("roll")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const sides = interaction.options.getInteger("sides", true);
        const roll = Math.floor(1 + Math.random() * sides);

        await interaction.reply({
            embeds: [client.simpleEmbed({
                title: `Rolling a D${sides}`,
                description: "<a:loading:1309211245588643850>",
                color: EmbedColor.Neutral,
            })]
        });

        setTimeout(async () => {
            await interaction.editReply({
                embeds: [client.simpleEmbed({
                    title: `Rolled a D${sides}! :tada:`,
                    description: `\`\`\`Result: ${roll}\`\`\``,
                    color: EmbedColor.Neutral
                })]
            });
        }, 2000);

        return {};
    },
    help: {
        subcommands: [],
        description,
        category: "Miscellaneous"
    }
};

export default roll;