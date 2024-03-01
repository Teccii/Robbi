import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { info } from "lib/log";

const description = "Bulk deletes x messages from the channel.";

const purge: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addIntegerOption(option =>
            option
                .setName("number")
                .setDescription("The number of messages to delete.")
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("purge")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const number = interaction.options.getInteger("number", true);

        const messages = await interaction.channel?.bulkDelete(number);

        if (messages) {
            const loggableMessages = messages.toJSON().map(msg => {
                const author = msg!.author!;
                const content = msg!.content;

                return `\t\t${author.username} (${author.id}): ${content}`;
            }).join("\n");

            info("purge", `${interaction.user.username} (${interaction.user.id}) purged ${number} messages from ${interaction.channel?.name} (${interaction.channel?.id}).\n\tMessages:\n${loggableMessages}`);

            return {
                embeds: [client.simpleEmbed({
                    description: `Deleted ${number} messages from the channel`,
                    color: EmbedColor.Success
                })]
            };
        } else {
            return {
                error: `Failed to delete ${number} messages from the channel`,
                ephemeral: true,
            }
        }
    },
    help: {
        subcommands: [],
        description,
        category: "Moderation"
    }
};

export default purge;