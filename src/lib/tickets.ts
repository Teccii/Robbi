import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, ModalSubmitInteraction, PermissionFlagsBits } from "discord.js";
import CustomClient from "./client";
import { EmbedColor } from "./config";
import { ticketDeleteId } from "interactions/chatInput/tickets";

export enum TicketType {
	GeneralSupport,
	ReportPerson,
}

export async function createTicket(
    client: CustomClient,
	interaction: ModalSubmitInteraction,
	answers: Map<string, string>,
	type: TicketType
): Promise<boolean> {
    if (!interaction.guild) {
        return false;
    }

	const categoryId = interaction.settings.ticketCategory;

	if (categoryId) {
        const category = await interaction.guild.channels.fetch(categoryId);
        
        if (category && category.type == ChannelType.GuildCategory) {
            let overwrites = [{
                id: interaction.guild.roles.everyone.id,
                deny: PermissionFlagsBits.ViewChannel,
            }, {
                id: interaction.user.id,
                allow: PermissionFlagsBits.ViewChannel
            }];

            if (interaction.settings.staffRoles.helper) {
                overwrites.push({
                    id: interaction.settings.staffRoles.helper,
                    allow: PermissionFlagsBits.ViewChannel,
                });
            }

            if (interaction.settings.staffRoles.moderator) {
                overwrites.push({
                    id: interaction.settings.staffRoles.moderator,
                    allow: PermissionFlagsBits.ViewChannel,
                });
            }

            if (interaction.settings.staffRoles.admin) {
                overwrites.push({
                    id: interaction.settings.staffRoles.admin,
                    allow: PermissionFlagsBits.ViewChannel,
                });
            }

            const channel = await interaction.guild.channels.create({
                parent: category,
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                position: 1,
                permissionOverwrites: overwrites,
            });

            let embed: EmbedBuilder = client.simpleEmbed({
                title: `${interaction.user.username} opened a ticket!`,
                footer: "Please wait while the staff review your ticket",
                color: EmbedColor.Neutral
            });

            if (type == TicketType.GeneralSupport) {
                const question = answers.get("question")!;

                embed = embed.addFields({
                    name: "Question",
                    value: `\`\`\`${question}\`\`\``
                });
            } else if (type == TicketType.ReportPerson) {
                const member = answers.get("member")!;
                const reason = answers.get("reason")!;

                embed = embed.addFields({
                    name: "Member",
                    value: `\`\`\`${member}\`\`\``
                }, {
                    name: "Reason",
                    value: `\`\`\`${reason}\`\`\``
                });
            }

            const components = [new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId(ticketDeleteId)
                    .setEmoji("🗑️")
                    .setLabel("Delete Ticket")
                    .setStyle(ButtonStyle.Danger)
            )];

            await channel.send({
                embeds: [embed],
                components,
            });

            await interaction.reply({
                embeds: [client.simpleEmbed({
                    title: "Ticket opened!",
                    description: `Please move to ${channel}`,
                    color: EmbedColor.Success,
                })],
                ephemeral: true,
            });

            return true;
        }
	}

    return false;
}
