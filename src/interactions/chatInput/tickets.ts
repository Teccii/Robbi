import {
    ActionRowBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputStyle
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";
import { Question } from "lib/modal";

export const ticketSelectId = "ticketSelect";
export const ticketDeleteId = "ticketDelete";
export const ticketGeneralId = "ticketGeneral";
export const ticketReportId = "ticketReport";

export const ticketGeneralQuestions = [
    new Question("question", "What is your question?", TextInputStyle.Paragraph, true),
];
export const ticketReportQuestions = [
    new Question("member", "Who are you reporting?", TextInputStyle.Short, true),
    new Question("reason", "Why are you reporting them?", TextInputStyle.Paragraph, true),
];

const description = "Manages the tickets system for this guild.";

const tickets: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addChannelOption(option =>
                    option
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                        .setName("category")
                        .setDescription("The category to place tickets under.")    
                )
                .setName("settings")
                .setDescription("Manages the settings of the tickets system.")    
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("embed")
                .setDescription("Sends the embed for ticket creation.")    
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("tickets")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();

        if (subcmd == "settings") {
            const category = interaction.options.getChannel("category", false);

            if (category && category.type == ChannelType.GuildCategory) {
                console.log("update category");
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { ticketCategory: category.id, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated tickets settings",
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "embed") {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("ticketSelect")
                .setPlaceholder("Select ticket option")
                .setOptions(
                    new StringSelectMenuOptionBuilder()
                        .setEmoji("🌐")
                        .setLabel("General Support")
                        .setDescription("Ask questions about the server")
                        .setValue("ticketGeneral"),
                    new StringSelectMenuOptionBuilder()
                        .setEmoji("📢")
                        .setLabel("Report Person")
                        .setDescription("Report one or more bad actors")
                        .setValue("ticketReport")
                );

            const components = [new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu)];

            await interaction.channel?.send({
                embeds: [client.simpleEmbed({
                    title: "Tickets",
                    description: "Open a ticket to report people or ask questions about the server!",
                    color: EmbedColor.Neutral,
                })],
                components
            });

            return {
                embeds: [client.simpleEmbed({
                    description: "Embed sent",
                    color: EmbedColor.Success,
                })],
                ephemeral: true
            };
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["settings", "embed"],
        description,
        category: "Information"
    }
};

export default tickets;