import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";

const description = "Manages the rules of this guild.";

const ping: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("title")
                        .setDescription("The title of the rule")
                )
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("description")
                        .setDescription("The description of the rule")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("position")
                        .setDescription("Where to insert the rule. If left unspecified, appends it to the list.")
                )
                .setName("add")
                .setDescription("Adds a rule.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addIntegerOption(option =>
                    option
                        .setRequired(true)
                        .setName("number")
                        .setDescription("The number of the rule.")
                )
                .setName("remove")
                .setDescription("Removes a rule.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addIntegerOption(option =>
                    option
                        .setRequired(true)
                        .setName("number")
                        .setDescription("The number of the rule.")
                )
                .setName("get")
                .setDescription("Gets a rule.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("list")
                .setDescription("Lists every rule in the guild.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("rules")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();

        if (subcmd == "add") {
            const title = interaction.options.getString("title", true);
            const description = interaction.options.getString("description", true);
            const position = interaction.options.getInteger("position", false);

            if (position !== null) {
                if (position < 1 || position > interaction.settings.rules.length) {
                    return { error: `Cannot insert an element out of bounds`, ephemeral: true };
                }

                const newRules = interaction.settings.rules;
                newRules.splice(position - 1, 0, { title, description });

                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { rules: newRules, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Inserted new rule ${position}: ${title}`,
                        color: EmbedColor.Success
                    })]
                };
            } else {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $push: { rules: { title, description } }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Added new rule: ${title}`,
                        color: EmbedColor.Success
                    })]
                };
            }
        } else if (subcmd == "remove") {
            const number = interaction.options.getInteger("number", true);
            const newRules = interaction.settings.rules.filter((_, i) => i != number - 1);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { rules: newRules, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: `Removed rule ${number}`,
                    color: EmbedColor.Success
                })]
            };
        } else if (subcmd == "get") {
            const number = interaction.options.getInteger("number", true);
            const rule = interaction.settings.rules[number - 1];

            return {
                embeds: [client.simpleEmbed({
                    title: `Rule ${number}: ${rule.title}`,
                    description: rule.description,
                    color: EmbedColor.Neutral,
                })]
            };
        } else if (subcmd == "list") {
            const rules = interaction.settings.rules;

            if (rules.length == 0) {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Rules for ${interaction.guild.name}`,
                        description: "No rules available.",
                        color: EmbedColor.Neutral
                    })]
                };
            } else {
                let embed = client.simpleEmbed({
                    title: `Rules for ${interaction.guild.name}`,
                    color: EmbedColor.Neutral,
                });

                rules.forEach((rule, index) => {
                    embed = embed.addFields({
                        name: `Rule ${index + 1}: ${rule.title}`,
                        value: rule.description,
                    });
                });

                return { embeds: [embed] };
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

export default ping;