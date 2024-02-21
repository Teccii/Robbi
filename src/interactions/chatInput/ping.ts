import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";

const description = "Checks the latency of the bot's connection.";

const ping: InteractionCommand = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        await interaction.deferReply();

        const reply = await interaction.fetchReply();
        const ping = reply.createdTimestamp - interaction.createdTimestamp;

        let color: EmbedColor = EmbedColor.Success;

        if (ping >= 500) {
            color = EmbedColor.Error;
        } else if (ping >= 250) {
            color = EmbedColor.Warning;
        }

        await interaction.editReply({
            embeds: [client.simpleEmbed({
                title: "Pong!",
                description: `**Latency**: ${ping}ms\n**API Latency**: ${client.ws.ping}ms`,
                color: color
            })]
        });

        return {};
    },
    help: {
        subcommands: [],
        description,
        category: "Information"
    }
};

export default ping;