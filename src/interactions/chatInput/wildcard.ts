import {
    ChatInputCommandInteraction,
    ModalBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextInputStyle
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";
import { Question, toActionRows } from "lib/modal";

export const wildcardAddId = "wildcardAdd";
export const wildcardAddQuestions = [
    new Question("title", "Title", TextInputStyle.Short, true),
    new Question("description", "Description", TextInputStyle.Paragraph, true)
];

const description = "Manages wildcards for this guild.";

const wildcard: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The identifier of the new wildcard.")
                )
                .setName("add")
                .setDescription("Adds a new wildcard.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The identifier of the wildcard.")
                )
                .setName("remove")
                .setDescription("Removes a wildcard.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The identifier of the wildcard.")
                )
                .setName("get")
                .setDescription("Sends a wildcard in chat.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("list")
                .setDescription("Lists every wildcard in the guild.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("wildcard")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();

        if (subcmd == "add") {
            const id = interaction.options.getString("id", true);

            if (!interaction.settings.wildcards.some(v => v.id == id)) {
                const modal = new ModalBuilder()
                    .setCustomId(`${wildcardAddId}-${id}`)
                    .setTitle("Add Wildcard")
                    .setComponents(toActionRows(wildcardAddQuestions));

                await interaction.showModal(modal);
            } else {
                return { error: `A wildcard with the id \`${id}\` already exists.` };
            }
        } else if (subcmd == "remove") {
            const id = interaction.options.getString("id", true);

            if (interaction.settings.wildcards.some(v => v.id == id)) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $pull: { wildcards: { id } }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Deleted wildcard \`${id}\``
                    })]
                }
            } else {
                return { error: `No existing wildcard with the id \`${id}\`` };
            }
        } else if (subcmd == "get") {
            const id = interaction.options.getString("id", true);
            const wildcard = interaction.settings.wildcards.find(v => v.id == id);

            if (wildcard) {
                return {
                    embeds: [client.simpleEmbed({
                        title: wildcard.title,
                        description: wildcard.description,
                        color: EmbedColor.Neutral
                    })]
                };
            } else {
                return {
                    error: `A wildcard with the id \`${id}\` does not exist`,
                    ephemeral: true,
                };
            }
        } else if (subcmd == "list") {
            if (interaction.settings.wildcards.length != 0) {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Wildcards for ${interaction.guild.name}`,
                        description: interaction.settings.wildcards.map(v => `\`${v.id}\``).join(", "),
                        color: EmbedColor.Neutral
                    })]
                };
            } else {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Wildcards for ${interaction.guild.name}`,
                        description: "No wildcards available",
                        color: EmbedColor.Neutral
                    })]
                };
            }
        }

        return {};
    },
    help: {
        subcommands: ["add", "remove", "get", "list"],
        description,
        category: "Management"
    }
};

export default wildcard;