import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    PermissionFlagsBits
} from "discord.js";
import { EmbedColor } from "./config";
import { ticketDeleteId } from "interactions/chatInput/tickets";
import CustomClient from "./client";

export enum TicketType {
	GeneralSupport,
	ReportPerson,
    MessageReport,
}

export async function createTicket(
    client: CustomClient,
	interaction: ModalSubmitInteraction | MessageContextMenuCommandInteraction,
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

            const embeds: EmbedBuilder[] = [];
            const components: ActionRowBuilder<ButtonBuilder>[] = [];

            let embed: EmbedBuilder = client.simpleEmbed({
                title: `${interaction.user.username} opened a ticket!`,
                footer: "Please wait while the staff review your ticket",
                color: EmbedColor.Neutral
            });

            if (type == TicketType.GeneralSupport) {
                const question = answers.get("question")!;

                embeds.push(embed.addFields({
                    name: "Question",
                    value: `\`\`\`${question}\`\`\``
                }));
            } else if (type == TicketType.ReportPerson) {
                const member = answers.get("member")!;
                const reason = answers.get("reason")!;

                embeds.push(embed.addFields(
                    { name: "Member", value: `\`\`\`${member}\`\`\`` },
                    { name: "Reason", value: `\`\`\`${reason}\`\`\`` },
                ));
            } else if (type == TicketType.MessageReport && interaction instanceof MessageContextMenuCommandInteraction) {
                const content = interaction.targetMessage.content.length == 0 ? "<empty>" : interaction.targetMessage.content;
                
                embeds.push(embed.addFields(
                    { name: "Member", value: `${interaction.targetMessage.author}` },
                    { name: "Message Content", value: `\`\`\`${content}\`\`\``}
                ));
                
                let i = 1;

                for (const [_, attachment] of interaction.targetMessage.attachments) {
                    if (attachment.contentType?.includes("image/")) {
                        embeds.push(client.simpleEmbed({
                            title: `Attachment ${i}`,
                            color: EmbedColor.Neutral
                        }).setImage(attachment.url));

                        i++;
                    } else if (attachment.contentType?.includes("video/")) {
                        components.push(new ActionRowBuilder<ButtonBuilder>().addComponents([
                            new ButtonBuilder()
                                .setLabel(attachment.name)
                                .setStyle(ButtonStyle.Link)
                                .setURL(attachment.url)
                        ]));
                    }
                }
            }

            components.push(new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId(ticketDeleteId)
                    .setEmoji("🗑️")
                    .setLabel("Delete Ticket")
                    .setStyle(ButtonStyle.Danger)
            ));

            await channel.send({
                embeds,
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
