import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { LevelModel } from "models/Level";
import { levelToXp, xpToLevel } from "lib/xp";

const description = "Lists information about your level.";

const ping: InteractionCommand = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const userLevel = await LevelModel.findOne({
            guildId: interaction.guild.id,
            userId: interaction.user.id
        });

        if (userLevel) {
            const guildLevels = (await LevelModel.find({
                guildId: interaction.guild.id
            })).map(v => ({ id: v.userId, xp: v.xp })).sort((a, b) => b.xp - a.xp);

            const userRank = guildLevels.findIndex(v => v.id == interaction.user.id) + 1;
            const level = xpToLevel(userLevel.xp);

            return {
                embeds: [client.simpleEmbed({
                    title: interaction.user.username,
                    description: `**Rank**: ${userRank}/${guildLevels.length}\n**XP**: ${userLevel.xp}/${levelToXp(level + 1)}\n**Level**: ${level}`,
                    color: EmbedColor.Neutral
                }).setThumbnail(interaction.user.avatarURL())]
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