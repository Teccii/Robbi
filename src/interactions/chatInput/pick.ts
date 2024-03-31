import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";

function sampleWeighted(entries: { name: string, weight: number}[]): { name: string, weight: number } | null {
    let totalWeight = 0;

    for (const {weight} of entries) {
        totalWeight += weight;
    }

    if (totalWeight == 0) {
        return null;
    }

    let remaining = Math.floor(Math.random() * totalWeight);

    for (const entry of entries) {
        remaining -= entry.weight;

        if (remaining < 0) {
            return entry;
        }
    }
    
    return null;
}

const description = "Pick a single option from a list of weighted options.";

const pick: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setRequired(true)
                .setName("names")
                .setDescription("The names of the options, separated by comma.")    
        )
        .addStringOption(option =>
            option
                .setRequired(false)
                .setName("weights")
                .setDescription("The weights of the options, separated by comma. By default, every option has a weight of 1.")    
        )
        .setName("pick")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const _names = interaction.options.getString("names", true);
        const names = _names.split(",").map(s => s.trim());

        const _weights = interaction.options.getString("weights", false);
        let weights: number[] = []; 

        if (_weights !== null) {
            weights = _weights.split(",").map(s => Number(s.trim()));
        } else {
            weights = Array<number>(names.length).fill(1);
        }

        if (names.length !== weights.length) {
            return { error: "Names and weights arrays are not of equal length" };
        }

        let options: { name: string, weight: number }[] = [];

        for (let i = 0; i < names.length; i++) {
            options.push({
                name: names[i],
                weight: weights[i]
            });
        }

        const result = sampleWeighted(options);

        if (result === null) {
            return { error: "There was an error while trying to pick an option" };
        }

        await interaction.reply({
            embeds: [client.simpleEmbed({
                title: `Picking <a:loading:1223950217930477638>`,
                color: EmbedColor.Neutral,
            }).setFields(
                { name: "Option", value: names.join("\n"), inline: true },
                { name: "Weight", value: weights.join("\n"), inline: true }
            )]
        });

        setTimeout(async () => {
            await interaction.editReply({
                embeds: [client.simpleEmbed({
                    title: `We have a winner! :tada:`,
                    description: `\`\`\`Result: ${result.name}\`\`\``,
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

export default pick;