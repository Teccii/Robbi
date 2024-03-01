import { ChatInputCommandInteraction, Role, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";

const description = "Manages the rewards of the leveling system.";

const rewards: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addIntegerOption(option =>
                    option
                        .setRequired(true)
                        .setName("level")
                        .setDescription("The level of the reward.")
                )
                .addRoleOption(option =>
                    option
                        .setRequired(true)
                        .setName("role")
                        .setDescription("The role of the reward.")
                )
                .setName("add")
                .setDescription("Adds a reward.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addIntegerOption(option =>
                    option
                        .setRequired(true)
                        .setName("level")
                        .setDescription("The level of the reward.")
                )
                .addRoleOption(option =>
                    option
                        .setRequired(true)
                        .setName("role")
                        .setDescription("The role of the reward.")
                )
                .setName("remove")
                .setDescription("Removes a reward.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addIntegerOption(option =>
                    option
                        .setRequired(true)
                        .setName("level")
                        .setDescription("The level.")
                )
                .setName("get")
                .setDescription("Gets the rewards for a level.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("list")
                .setDescription("Lists the current rewards.")
        )
        .setName("rewards")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();

        if (subcmd == "add") {
            const level = interaction.options.getInteger("level", true);
            const role = interaction.options.getRole("role", true);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $push: { "leveling.levelRoles": { level, role: role.id } }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: `Added a reward for level ${level}`,
                    color: EmbedColor.Success
                })]
            };
        } else if (subcmd == "remove") {
            const level = interaction.options.getInteger("level", true);
            const role = interaction.options.getRole("role", true);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $pull: { "leveling.levelRoles": { level, role: role.id } }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: `Removed a reward from level ${level}`,
                    color: EmbedColor.Error
                })]
            };
        } else if (subcmd == "get") {
            const level = interaction.options.getInteger("level", true);
            const rewards = interaction.settings.leveling.levelRoles.filter(v => v.level == level).map(v => v.role);

            let roles: Role[] = [];

            for (const reward of rewards) {
                const role = await interaction.guild.roles.fetch(reward);

                if (role) {
                    roles.push(role);
                }
            }

            if (roles.length != 0) {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Rewards for level ${level}`,
                        description: roles.join("\n"),
                        color: EmbedColor.Neutral,
                    })]
                };
            } else {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Rewards for level ${level}`,
                        description: "No rewards available",
                        color: EmbedColor.Neutral,
                    })]
                };
            }
        } else if (subcmd == "list") {
            const _rewards = interaction.settings.leveling.levelRoles;

            let rewards: Map<number, Role[]> = new Map();

            for (const reward of _rewards.sort((a, b) => a.level - b.level)) {
                const role = await interaction.guild.roles.fetch(reward.role);

                if (role) {
                    if (rewards.has(reward.level)) {
                        rewards.get(reward.level)?.push(role);
                    } else {
                        rewards.set(reward.level, [role]);
                    }
                }
            }

            let embed = client.simpleEmbed({
                title: `Rewards for ${interaction.guild.name}`,
                color: EmbedColor.Neutral,
            });

            for (const [level, roles] of rewards) {
                embed = embed.addFields({
                    name: `Level ${level}`,
                    value: roles.join("\n")
                });
            }

            if (rewards.size == 0) {
                return { embeds: [embed.setDescription(`This guild has no rewards`)] };
            }

            return { embeds: [embed] };
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["add", "remove", "get", "list"],
        description,
        category: "Management"
    }
};

export default rewards;