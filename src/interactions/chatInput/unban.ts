import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { info } from "lib/log";
import dayjs from "dayjs";

const description = "Unbans a user from the server.";

const unban: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The target user.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for the unban.")
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("unban")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", false) ?? "No reason provided.";
        const ban = await interaction.guild.bans.fetch(user.id);

        if (user.id == interaction.user.id) {
            return {
                error: "Unable to self-moderate",
                ephemeral: true
            }
        }

        if (!ban) {
            return {
                error: "Unable to unban a user that isn't banned",
                ephemeral: true
            }
        }

        await interaction.guild.bans.remove(user, reason).then(_ => {
            info("unban", `${user.username} (${user.id}) unbanned from ${interaction.guild.name} (${interaction.guild.id}) by ${interaction.user} (${interaction.user.id}).\n\tReason: ${reason}`);
        });

        const logChannelId = interaction.settings.events.find(v => v.event == "caseCreate")?.channel;

        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        description: `${user} unbanned by ${interaction.user}`,
                        footer: `User ID: ${user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral
                    })]
                });
            }
        }

        let dmSuccessful = true;

        if (user.bot) {
            dmSuccessful = false;
        } else {
            await user.send({
                embeds: [client.simpleEmbed({
                    title: `You have been unbanned from ${interaction.guild}`,
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
                    ? `${user} has been unbanned`
                    : `:warning: Unable to send messages to this user\n${user} has been unbanned`,
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

export default unban;