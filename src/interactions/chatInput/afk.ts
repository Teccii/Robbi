import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { AFKModel } from "models/AFK";

const description = "Marks you as AFK until the next time you message.";

const afk: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setRequired(true)
                .setName("reason")
                .setDescription("Why are you going AFK?")    
        )
        .setName("afk")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const reason = interaction.options.getString("reason", true);

        await AFKModel.deleteOne({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
        });

        await new AFKModel({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            reason,
        }).save();

        return {
            embeds: [client.simpleEmbed({
                description: `${interaction.user} is now AFK: \`${reason}\``,
                color: EmbedColor.Neutral,
            })]
        };
    },
    help: {
        subcommands: [],
        description,
        category: "Miscellaneous"
    }
};

export default afk;