import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";

const description = "Manages staff roles for this guild.";

const roles: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommandGroup(group =>
            group
                .addSubcommand(subcmd =>
                    subcmd
                        .addRoleOption(option =>
                            option
                                .setRequired(true)
                                .setName("role")
                                .setDescription("The new helper role.")    
                        )
                        .setName("helper")
                        .setDescription("Sets the helper role of this guild.")
                )
                .addSubcommand(subcmd =>
                    subcmd
                        .addRoleOption(option =>
                            option
                                .setRequired(true)
                                .setName("role")
                                .setDescription("The new moderator role.")    
                        )
                        .setName("moderator")
                        .setDescription("Sets the moderator role of this guild.")
                )
                .addSubcommand(subcmd =>
                    subcmd
                        .addRoleOption(option =>
                            option
                                .setRequired(true)
                                .setName("role")
                                .setDescription("The new admin role.")    
                        )
                        .setName("admin")
                        .setDescription("Sets the admin role of this guild.")
                )
                .setName("set")
                .setDescription("Sets staff roles for this guild.")    
        )
        .addSubcommandGroup(group =>
            group
                .addSubcommand(subcmd =>
                    subcmd
                        .setName("helper")
                        .setDescription("Unsets the helper role of this guild.")
                )
                .addSubcommand(subcmd =>
                    subcmd
                        .setName("moderator")
                        .setDescription("Unsets the moderator role of this guild.")
                )
                .addSubcommand(subcmd =>
                    subcmd
                        .setName("admin")
                        .setDescription("Unsets the admin role of this guild.")
                )
                .setName("unset")
                .setDescription("Unsets staff roles for this guild.")    
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("roles")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const group = interaction.options.getSubcommandGroup();
        const subcmd = interaction.options.getSubcommand();

        if (group == "set") {
            const role = interaction.options.getRole("role", true);

            if (subcmd == "helper") {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "staffRoles.helper": role.id, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully assigned Helper to ${role}`,
                        color: EmbedColor.Success,
                    })]
                };
            } else if (subcmd == "moderator") {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "staffRoles.moderator": role.id, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully assigned Moderator to ${role}`,
                        color: EmbedColor.Success,
                    })]
                };
            } else if (subcmd == "admin") {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "staffRoles.admin": role, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully assigned Admin to ${role}`,
                        color: EmbedColor.Success,
                    })]
                };
            }
        } else if (group == "unset") {
            if (subcmd == "helper") {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $unset: { "staffRoles.helper": "" }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully unassigned Helper`,
                        color: EmbedColor.Success,
                    })]
                };
            } else if (subcmd == "moderator") {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $unset: { "staffRoles.moderator": "" }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully unassigned Moderator`,
                        color: EmbedColor.Success,
                    })]
                };
            } else if (subcmd == "admin") {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $unset: { "staffRoles.admin": "" }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Successfully unassigned Admin`,
                        color: EmbedColor.Success,
                    })]
                };
            }
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["set", "unset"],
        description,
        category: "Management"
    }
};

export default roles;