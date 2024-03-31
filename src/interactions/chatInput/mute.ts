import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { CaseModel, CaseType } from "models/Case";
import { EmbedColor } from "lib/config";
import { parseDuration } from "lib/time";
import { info } from "lib/log";
import dayjs from "dayjs";

const description = "Times out a person for a given length of time.";

const mute: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription("The target member.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("length")
                .setDescription("The duration of the time out.")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for the time out.")
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("mute")
        .setDescription(description),
    autocompleteOptions: {
        length: (filter) => [
            { name: "1m", value: "1m" },
            { name: "1h", value: "1h" },
            { name: "1d", value: "1d" },
            { name: "1w", value: "1w" },
            { name: "1M", value: "1M" },
            { name: "1y", value: "1y" },
        ].filter(option => option.value.startsWith(filter)),
    },
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

        if (member.id == interaction.member.id) {
            return {
                error: "Unable to self-moderate",
                ephemeral: true
            }
        }

        if (client.permLevel(interaction.member) <= client.permLevel(member)) {
            return {
                error: "Cannot moderate user with similar or higher authority",
                ephemeral: true
            }
        }

        const caseNumber = await client.nextCounter(`${interaction.guild.id}-caseNumber`);
        const reason = interaction.options.getString("reason", false) ?? "No reason provided";
        const seconds = parseDuration(interaction.options.getString("length", true));
        const expiresAt = Math.trunc(Date.now() / 1000) + seconds;

        await member.timeout(seconds * 1000, reason).then(member => {
            info("mute", `${member.user.username} (${member.id}) muted in ${interaction.guild.name} (${interaction.guild.id}) by ${interaction.user} (${interaction.user.id}).\n\tDuration: ${seconds}.\n\tReason: ${reason}`);
        });

        await new CaseModel({
            caseNumber,
            caseType: CaseType.Mute,
            guildId: interaction.guild.id,
            moderatorId: interaction.user.id,
            targetId: member.id,
            reason,
            duration: seconds,
            expired: false,
            expiresAt,
        }).save();

        const logChannelId = interaction.settings.events.find(v => v.event == "caseCreate")?.channel;

        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);

            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        description: `${member} muted by ${interaction.user}`,
                        footer: `Case number ${caseNumber} · User ID: ${member.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
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
                    title: `You have been muted in ${interaction.guild}`,
                    color: EmbedColor.Neutral,
                    footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`
                }).setFields(
                    { name: "Reason", value: reason, inline: true },
                    { name: "Expires", value: `<t:${expiresAt}:R>`, inline: true }
                )]
            }).catch(_ => {
                dmSuccessful = false;
            });
        }

        return {
            embeds: [client.simpleEmbed({
                description: dmSuccessful
                    ? `${member} will be unmuted <t:${expiresAt}:R>`
                    : `:warning: Unable to send messages to this user\n${member} will be unmuted <t:${expiresAt}:R>`,
                footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
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

export default mute;