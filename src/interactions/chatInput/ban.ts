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

        const member = interaction.options.getMember("member");

        if (!member) {
            //ig just copy paste this here lol
            const user = interaction.options.getUser("member", true);
            const caseNumber = await client.nextCounter(`${interaction.guild.id}-caseNumber`);
            const reason = interaction.options.getString("reason", false) ?? "No reason provided";
            const duration = interaction.options.getString("length", false) ?? "permanent";

            let dmSuccessful = true;

            if (user.bot) {
                dmSuccessful = false;
            }

            if (duration.toLowerCase() == "permanent") {
                await new CaseModel({
                    caseNumber,
                    caseType: CaseType.Ban,
                    guildId: interaction.guild.id,
                    moderatorId: interaction.user.id,
                    targetId: user.id,
                    reason,
                }).save();

                const logChannelId = interaction.settings.events.find(v => v.event == "caseCreate")?.channel;

                if (logChannelId) {
                    const logChannel = await interaction.guild.channels.fetch(logChannelId);

                    if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                        await logChannel.send({
                            embeds: [client.simpleEmbed({
                                description: `${member} banned by ${interaction.user}`,
                                footer: `Case number ${caseNumber} · User ID: ${user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                                color: EmbedColor.Neutral
                            })]
                        });
                    }
                }

                if (dmSuccessful) {
                    await user.send({
                        embeds: [client.simpleEmbed({
                            title: `You have been permanently banned from ${interaction.guild}`,
                            color: EmbedColor.Neutral,
                            footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`
                        }).setFields(
                            { name: "Reason", value: reason, inline: true }
                        )]
                    }).catch(_ => {
                        dmSuccessful = false;
                    });
                }

                return {
                    embeds: [client.simpleEmbed({
                        description: dmSuccessful
                            ? `${member} already banned, added another case`
                            : `:warning: Unable to send messages to this user\n${member} already banned, added another case`,
                        footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral
                    })]
                }
            } else {
                //idk how to handle this case lol
                return {
                    error: "User is not a member of this guild.\nUnable to ban for a variable length of time.",
                    ephemeral: true,
                };
            }
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
        const duration = interaction.options.getString("length", false) ?? "permanent";

        let dmSuccessful = true;

        if (member.user.bot) {
            dmSuccessful = false;
        }

        if (duration.toLowerCase() == "permanent") {
            await new CaseModel({
                caseNumber,
                caseType: CaseType.Ban,
                guildId: interaction.guild.id,
                moderatorId: interaction.user.id,
                targetId: member.id,
                reason,
            }).save();

            const logChannelId = interaction.settings.events.find(v => v.event == "caseCreate")?.channel;

            if (logChannelId) {
                const logChannel = await interaction.guild.channels.fetch(logChannelId);

                if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                    await logChannel.send({
                        embeds: [client.simpleEmbed({
                            description: `${member} banned by ${interaction.user}`,
                            footer: `Case number ${caseNumber} · User ID: ${member.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                            color: EmbedColor.Neutral
                        })]
                    });
                }
            }

            if (dmSuccessful) {
                await member.send({
                    embeds: [client.simpleEmbed({
                        title: `You have been permanently banned from ${interaction.guild}`,
                        color: EmbedColor.Neutral,
                        footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`
                    }).setFields(
                        { name: "Reason", value: reason, inline: true }
                    )]
                }).catch(_ => {
                    dmSuccessful = false;
                });
            }

            await member.ban({ reason: reason }).then(member => {
                info("ban", `${member.user.username} (${member.id}) banned from ${interaction.guild.name} (${interaction.guild.id} by ${interaction.user.username} (${interaction.user.id}).\nDuration: ${duration.toLowerCase()}\nReason: ${reason}`);
            });

            return {
                embeds: [client.simpleEmbed({
                    description: dmSuccessful
                        ? `${member} banned indefinitely`
                        : `:warning: Unable to send messages to this user\n\t${member} banned indefinitely`,
                    footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Neutral
                })]
            }
        } else {
            const seconds = parseDuration(duration);

            const expiresAt = Math.trunc(Date.now() / 1000) + seconds;

            await new CaseModel({
                caseNumber,
                caseType: CaseType.Ban,
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
                            description: `${member} banned`,
                            footer: `Case number ${caseNumber} · User ID: ${member.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                            color: EmbedColor.Neutral
                        }).setAuthor({
                            name: member.user.username,
                            iconURL: member.avatarURL() ?? undefined,
                        })]
                    })
                }
            }

            if (dmSuccessful) {
                await member.send({
                    embeds: [client.simpleEmbed({
                        title: `You have been banned from ${interaction.guild}`,
                        footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral,
                    }).setFields(
                        { name: "Reason", value: reason, inline: true },
                        { name: "Expires", value: `<t:${expiresAt}:R>`, inline: true }
                    )],
                }).catch(_ => {
                    dmSuccessful = false;
                });
            }

            await member.ban({ reason: reason }).then(member => {
                info("ban", `${member.user.username} (${member.id}) banned from ${interaction.guild.name} (${interaction.guild.id} by ${interaction.user.username} (${interaction.user.id}).\n\tDuration: ${duration}\n\tReason: ${reason}`);
            });

            return {
                embeds: [client.simpleEmbed({
                    description: dmSuccessful
                        ? `${member} will be unbanned <t:${expiresAt}:R>`
                        : `:warning: Unable to send messages to this user\n${member} will be unbanned <t:${expiresAt}:R>`,
                    footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                    color: EmbedColor.Neutral,
                })]
            };
        }
    },
    help: {
        subcommands: [],
        description,
        category: "Moderation"
    }

};

export default ban;