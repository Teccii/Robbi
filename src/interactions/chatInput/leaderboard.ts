import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { LevelModel } from "models/Level";
import { xpToLevel } from "lib/xp";
import dayjs from "dayjs";

const max = 25;
const description = "Lists the server's leading members in XP.";

const leaderboard: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(option =>
            option
                .addIntegerOption(option =>
                    option
                        .setMinValue(1)
                        .setRequired(true)
                        .setName("first")
                        .setDescription("The first position.")
                )
                .addIntegerOption(option =>
                    option
                        .setMinValue(1)
                        .setRequired(true)
                        .setName("last")
                        .setDescription(`The last position. Can be no more than ${max} larger than the first position.`)
                )
                .setName("range")
                .setDescription("Retrieves the leaderboard between a range.")
        )
        .addSubcommand(option =>
            option
                .addIntegerOption(option =>
                    option
                        .setMinValue(1)
                        .setMaxValue(max)
                        .setRequired(false)
                        .setName("number")
                        .setDescription("The x in top x.")
                )
                .setName("top")
                .setDescription("Retrieves the top x users.")
        )
        .setName("leaderboard")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const guildLevels = (await LevelModel.find({ guildId: interaction.guild.id }))
            .map(v => ({ id: v.userId, xp: v.xp }))
            .sort((a, b) => b.xp - a.xp);

        const subcommand = interaction.options.getSubcommand();

        if (subcommand == "top") {
            const number = interaction.options.getInteger("number", false) ?? 10;
            const relevant = guildLevels.slice(0, number);
            const text = relevant.map((v, i) => `${i + 1}. ${userMention(v.id)} - ${v.xp} XP (Level ${xpToLevel(v.xp)})`).join("\n");

            return {
                embeds: [client.simpleEmbed({
                    title: `Leaderboard for ${interaction.guild.name}`,
                    description: text,
                    footer: dayjs().format("DD/MM/YYYY HH:mm"),
                    color: EmbedColor.Neutral,
                })]
            }

        } else if (subcommand == "range") {
            const first = interaction.options.getInteger("first", true);
            const last = interaction.options.getInteger("last", true);

            if (first > last || first + max < last) {
                return { error: `Invalid range`, ephemeral: true };
            } else {
                const relevant = guildLevels.slice(first - 1, last);
                const text = relevant.map((v, i) => `${first + i}. ${userMention(v.id)} - ${v.xp} XP (Level ${xpToLevel(v.xp)})`).join("\n");

                return {
                    embeds: [client.simpleEmbed({
                        title: `Leaderboard for ${interaction.guild.name}`,
                        description: text,
                        footer: dayjs().format("DD/MM/YYYY HH:mm"),
                        color: EmbedColor.Neutral,
                    })]
                }
            }
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["top", "range"],
        description,
        category: "Information"
    }
};

export default leaderboard;