import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { CaseModel, CaseType} from "models/Case";
import { EmbedColor } from "lib/config";
import { parseDuration } from "lib/time";
import { info } from "lib/log";
import dayjs from "dayjs";

const description = "Bans a member from the server.";

const ban: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription("The target member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("length")
                .setDescription("The duration of the ban.")
                .setAutocomplete(true)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("The reason for the ban.")
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("ban")
        .setDescription(description),
    autocompleteOptions: {
        length: (filter) => [
            { name: "Permanent", value: "permanent" },
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

        const user = interaction.options.getUser("member", true);

        if (user.id == interaction.user.id) {
            return {
                error: "Unable to self-moderate",
                ephemeral: true
            }
        }

        const member = interaction.guild.members.cache.find(v => v.id === user.id);

        if (client.permLevel(interaction.member) <= (member !== undefined ? client.permLevel(member) : 0)) {
            return {
                error: "Cannot moderate user with similar or higher authority",
                ephemeral: true
            }
        }

        const caseNumber = await client.nextCounter(`${interaction.guild.id}-caseNumber`);
        const reason = interaction.options.getString("reason", false) ?? "No reason provided";
        const duration = interaction.options.getString("length", false) ?? "permanent";
    
        const logChannelId = interaction.settings.events.find(v => v.event == "caseCreate")?.channel;
    
        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId);
    
            if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                await logChannel.send({
                    embeds: [client.simpleEmbed({
                        title: `Case number ${caseNumber}`,
                        description: `${user} banned by ${interaction.user}`,
                        footer: `User ID: ${user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral
                    })]
                });
            }
        }
    
        let dmSuccessful = true;
    
        if (user.bot) {
            dmSuccessful = false;
        }
    
        if (duration.toLowerCase() === "permanent") {
            await new CaseModel({
                caseNumber,
                caseType: CaseType.Ban,
                guildId: interaction.guild.id,
                moderatorId: interaction.user.id,
                targetId: user.id,
                reason,
            }).save();
    
            if (dmSuccessful) {
                await user.send({
                    embeds: [client.simpleEmbed({
                        title: `You have been permanently banned from ${interaction.guild}`,
                        color: EmbedColor.Neutral,
                        footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`
                    }).setFields(
                        { name: "Reason", value: reason, inline: true }
                    )]
                }).catch(() => {
                    dmSuccessful = false;
                });
            }

            let guildBanSuccessful = true;
    
            await interaction.guild.bans.create(user, { reason }).then(() => {
                info("ban", `${user.username} (${user.id}) banned from ${interaction.guild.name} (${interaction.guild.id} by ${interaction.user.username} (${interaction.user.id}).\nDuration: ${duration.toLowerCase()}\nReason: ${reason}`);
            }).catch(() => {
                guildBanSuccessful = false;
            });
    
            await interaction.reply({
                embeds: [client.simpleEmbed({
                    description: `${!guildBanSuccessful ? ":warning: Failed to create guild ban.\n" : ""}${!dmSuccessful ? ":warning: Unable to send messages to this user.\n": ""}${user} banned indefinitely`,
                    footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Neutral
                })]
            });
        } else {
            const seconds = parseDuration(duration);
            const expiresAt = Math.trunc(Date.now() / 1000) + seconds;
    
            await new CaseModel({
                caseNumber,
                caseType: CaseType.Ban,
                guildId: interaction.guild.id,
                moderatorId: interaction.user.id,
                targetId: user.id,
                reason,
                duration: seconds,
                expired: false,
                expiresAt,
            }).save();
    
            if (dmSuccessful) {
                await user.send({
                    embeds: [client.simpleEmbed({
                        title: `You have been banned from ${interaction.guild}`,
                        footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral,
                    }).setFields(
                        { name: "Reason", value: reason, inline: true },
                        { name: "Expires", value: `<t:${expiresAt}:R>`, inline: true }
                    )]
                }).catch(() => {
                    dmSuccessful = false; 
                });
            }

            let guildBanSuccessful = true;
    
            await interaction.guild.bans.create(user, { reason }).then(() => {
                info("ban", `${user.username} (${user.id}) banned from ${interaction.guild.name} (${interaction.guild.id} by ${interaction.user.username} (${interaction.user.id}).\nDuration: ${duration.toLowerCase()}\nReason: ${reason}`);
            }).catch(() => {
                guildBanSuccessful = false;
            });

            await interaction.reply({
                embeds: [client.simpleEmbed({
                    description: `${!guildBanSuccessful ? ":warning: Failed to create guild ban.\n" : ""}${!dmSuccessful ? ":warning: Unable to send messages to this user.\n": ""}${user} will be unbanned <t:${expiresAt}:R>`,
                    footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Neutral
                })]
            });
        }

        return {};
    },
    help: {
        subcommands: [],
        description,
        category: "Moderation"
    }

};

export default ban;