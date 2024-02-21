import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    PermissionFlagsBits
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { info } from "lib/log";
import dayjs from "dayjs";

const deleteMessagesAfter: InteractionCommand = {
    data: new ContextMenuCommandBuilder()
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("Delete Messages After")
        .setType(ApplicationCommandType.Message),
    exec: async (client, interaction) => {
        if (!(interaction instanceof MessageContextMenuCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const message = interaction.targetMessage.id;
        const messagesAfter = await interaction.channel?.messages.fetch({ limit: 100, after: message });

        if (!messagesAfter || (messagesAfter && messagesAfter.size == 0)) {
            return {
                error: "There are no messages after this message to delete",
                ephemeral: true,
            };
        }

        const messages = await interaction.channel?.bulkDelete(messagesAfter);

        if (messages) {
            const loggableMessages = messages.toJSON().map(msg => {
                const author = msg!.author!;
                const content = msg!.content;

                return `\t\t${author.username} (${author.id}): ${content}`;
            }).join("\n");

            info("delete messages after", `${interaction.user.username} (${interaction.user.id}) deleted ${messages.size} after ${interaction.targetMessage.url}.\n\tMessages:\n${loggableMessages}`);

            return {
                embeds: [client.simpleEmbed({
                    description: `Deleted ${messages.size} messages from the channel`,
                    footer: `${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Success,
                })]
            };
        } else {
            return {
                error: `Failed to delete ${messagesAfter.size} messages after [this message](${interaction.targetMessage.url})`,
                ephemeral: true,
            };
        }
    },
    help: {
        subcommands: [],
        description: "Deletes up to 100 messages after the target message.",
        category: "Moderation"
    }
};

export default deleteMessagesAfter;