import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { info } from "lib/log";
import { CaseModel, CaseType } from "models/Case";
import dayjs from "dayjs";

const description = "Gives a warning to a user.";

const warn: InteractionCommand = {
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
                .setDescription("The reason for the warning.")
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("warn")
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

        if (client.permLevel(interaction.member) <= client.permLevel(member)) {
            return {
                error: "Cannot moderate user with similar or higher authority",
                ephemeral: true
            }
        }

        const reason = interaction.options.getString("reason", true);
        const caseNumber = await client.nextCounter(`${interaction.guild.id}-caseNumber`);

        info("warn", `${member.user.username} (${member.id}) warned in ${interaction.guild.name} (${interaction.guild.id}) by ${interaction.user} (${interaction.user.id}).\n\tReason: ${reason}`);

        await new CaseModel({
            caseNumber,
            caseType: CaseType.Warn,
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
                        description: `${member} warned by ${interaction.user}`,
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
                    title: `You have been warned in ${interaction.guild}`,
                    color: EmbedColor.Neutral,
                    footer: `Case number ${caseNumber} · ${dayjs().format("DD/MM/YYYY HH:mm")}`
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
                    ? `${member} has been warned with the following reason:\n${reason}`
                    : `:warning: Unable to send messages to this user\n${member} has been warned with the following reason:\n${reason}`,
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

export default warn;