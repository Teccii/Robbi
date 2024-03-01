import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { LevelModel } from "models/Level";
import { levelToXp, xpToLevel } from "lib/xp";

const description = "Lists information about your level.";

const ping: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setRequired(false)
                .setName("user")
                .setDescription("The user whose rank to get")
        )
        .setName("rank")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const user = interaction.options.getUser("user", false) ?? interaction.user;

        const userLevel = await LevelModel.findOne({
            guildId: interaction.guild.id,
            userId: user.id,
        });

        if (userLevel) {
            const guildLevels = (await LevelModel.find({
                guildId: interaction.guild.id
            })).map(v => ({ id: v.userId, xp: v.xp })).sort((a, b) => b.xp - a.xp);

            const userRank = guildLevels.findIndex(v => v.id == user.id) + 1;
            const level = xpToLevel(userLevel.xp);

            return {
                embeds: [client.simpleEmbed({
                    title: user.username,
                    description: `**Rank**: ${userRank}/${guildLevels.length}\n**XP**: ${userLevel.xp}/${levelToXp(level + 1)}\n**Level**: ${level}`,
                    color: EmbedColor.Neutral
                }).setThumbnail(user.avatarURL())]
            };
        }

        return { error: "Issue retrieving XP information, please try again", ephemeral: true };
    },
    help: {
        subcommands: [],
        description,
        category: "Information"
    }
};

export default ping;