import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { info } from "lib/log";
import dayjs from "dayjs";

const description = "Unmutes a user in the server.";

const unmute: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription("The target member.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for the unmute.")
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("unmute")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const member = interaction.options.getMember("member");

        if (!member) {
            return {
                error: "User is not a member of this guild",
                ephemeral: true,
            };
        }

        if (!member.isCommunicationDisabled()) {
            return { error: "Unable to unmute a user that isn't muted" };
        }

        const reason = interaction.options.getString("reason", false) ?? "No reason provided.";

        await member.timeout(null).then(_ => {
            info("unmute", `${member.user.username} (${member.id}) unmuted in ${interaction.guild.name} (${interaction.guild.id}) by ${interaction.user} (${interaction.user.id}).\n\tReason: ${reason}`);
        });

        const logChannelId = interaction.settings.events.find(v => v.event == "caseCreate")?.channel;

        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        description: `${member} unmuted by ${interaction.user}`,
                        footer: `User ID: ${member.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral
                    })]
                });
            }
        }

        let dmSuccessful = true;

        if (member.user.bot) {
            dmSuccessful = false;
        } else {
            await member.send({
                embeds: [client.simpleEmbed({
                    title: `You have been unmuted in ${interaction.guild}`,
                    footer: dayjs().format("DD/MM/YYYY HH:mm"),
                    color: EmbedColor.Neutral,
                }).setFields(
                    { name: "Reason", value: reason, inline: true },
                )]
            }).catch(_ => {
                dmSuccessful = false;
            });
        }

        return {
            embeds: [client.simpleEmbed({
                description: dmSuccessful
                    ? `${member} has been unmuted`
                    : `:warning: Unable to send messages to this user\n${member} has been unmuted`,
                footer: dayjs().format("DD/MM/YYYY HH:mm"),
                color: EmbedColor.Neutral,
            })]
        };
    },
    help: {
        subcommands: [],
        description,
        category: "Moderation"
    }
};

export default unmute;