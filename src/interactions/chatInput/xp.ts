import { ChatInputCommandInteraction, PermissionFlagsBits, Role, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { LevelModel } from "models/Level";
import { levelToXp, setRoles, xpToLevel } from "lib/xp";
import { AnnouncementType, SettingsModel } from "models/Settings";

const description = "Manages the leveling system for this guild.";

const xp: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommandGroup(group =>
            group
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
                .setDescription("Manages the rewards of the leveling system.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addBooleanOption(option =>
                    option
                        .setRequired(false)
                        .setName("remove-past-roles")
                        .setDescription("Whether to remove past rewards or not.")
                )
                .addStringOption(option =>
                    option
                        .setChoices(
                            { name: "Never", value: "Never" },
                            { name: "Every Five", value: "EveryFive" },
                            { name: "Every Ten", value: "EveryTen" },
                            { name: "Rewards Only", value: "RewardsOnly" },
                            { name: "Every Five and Rewards", value: "EveryFiveAndRewards" },
                            { name: "Every Ten and Rewards", value: "EveryTenAndRewards" },
                            { name: "Always", value: "Always" }
                        )
                        .setRequired(false)
                        .setName("announcements")
                        .setDescription("Whether to announce level ups and if so, what way.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("message-xp-min")
                        .setDescription("The minimum message XP gain.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("message-xp-max")
                        .setDescription("The maximum message XP gain.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("message-cooldown")
                        .setDescription("The cooldown for message XP gain.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("reply-xp-min")
                        .setDescription("The minimum reply XP gain.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("reply-xp-max")
                        .setDescription("The maximum reply XP gain.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("reply-cooldown")
                        .setDescription("The cooldown for reply XP gain.")
                )
                .setName("settings")
                .setDescription("Manages the settings of the leveling system.")
        )
        .addSubcommandGroup(group =>
            group
                .addSubcommand(subcmd =>
                    subcmd
                        .addUserOption(option =>
                            option
                                .setRequired(true)
                                .setName("member")
                                .setDescription("The target member.")
                        )
                        .setName("user")
                        .setDescription("Resets the user's level.")
                )
                .addSubcommand(subcmd =>
                    subcmd
                        .setName("server")
                        .setDescription("Resets the entire server's levels.")
                )
                .setName("reset")
                .setDescription("Resets the target's level.")
        )
        .addSubcommandGroup(group =>
            group
                .addSubcommand(subcmd =>
                    subcmd
                        .addUserOption(option =>
                            option
                                .setRequired(true)
                                .setName("member")
                                .setDescription("The target member.")
                        )
                        .addIntegerOption(option =>
                            option
                                .setRequired(true)
                                .setName("level")
                                .setDescription("The new level.")
                        )
                        .setName("level")
                        .setDescription("Changes the user's level.")
                )
                .addSubcommand(subcmd =>
                    subcmd
                        .addUserOption(option =>
                            option
                                .setRequired(true)
                                .setName("member")
                                .setDescription("The target member.")
                        )
                        .addIntegerOption(option =>
                            option
                                .setRequired(true)
                                .setName("xp")
                                .setDescription("The new XP amount.")
                        )
                        .setName("xp")
                        .setDescription("Changes the user's XP.")
                )
                .setName("set")
                .setDescription("Changes the user's level or XP.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("xp")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const group = interaction.options.getSubcommandGroup();
        const subcmd = interaction.options.getSubcommand();

        if (group == "rewards") {
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
                        description: `Successfully added a reward for level ${level}`,
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
                        description: `Successfully added a reward for level ${level}`,
                        color: EmbedColor.Success
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
        } else if (group == "reset") {
            if (subcmd == "user") {
                const member = interaction.options.getMember("member");

                if (!member) {
                    return {
                        error: "User is not a member of this guild>",
                        ephemeral: true,
                    };
                }

                await LevelModel.findOneAndUpdate(
                    { guildId: interaction.guild.id, userId: member.id },
                    { cachedLevel: 0, xp: 0 },
                    { upsert: true }
                );

                await setRoles(member, 0, interaction.settings);

                return {
                    embeds: [client.simpleEmbed({
                        description: `Reset ${member}'s XP`,
                        color: EmbedColor.Neutral
                    })]
                };
            } else if (subcmd == "server") {
                await LevelModel.updateMany(
                    { guildId: interaction.guild.id },
                    { cachedLevel: 0, xp: 0 }
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Reset levels for the entire server`,
                        color: EmbedColor.Neutral
                    })]
                };
            }
        } else if (group == "set") {
            const member = interaction.options.getMember("member");

            if (!member) {
                return {
                    error: "User is not a member of this guild",
                    ephemeral: true,
                };
            }

            if (subcmd == "level") {
                const level = interaction.options.getInteger("level", true);

                await LevelModel.findOneAndUpdate(
                    { guildId: interaction.guild.id, userId: member.id },
                    { cachedLevel: level, xp: levelToXp(level) },
                    { upsert: true }
                );

                await setRoles(member, level, interaction.settings);

                return {
                    embeds: [client.simpleEmbed({
                        description: `Set ${member}'s level to ${level}`,
                        color: EmbedColor.Neutral,
                    })]
                };
            } else if (subcmd == "xp") {
                const xp = interaction.options.getInteger("xp", true);

                await LevelModel.findOneAndUpdate(
                    { guildId: interaction.guild.id, userId: member.id },
                    { cachedLevel: xpToLevel(xp), xp },
                    { upsert: true }
                );

                await setRoles(member, xpToLevel(xp), interaction.settings);

                return {
                    embeds: [client.simpleEmbed({
                        description: `Set ${member}'s XP to ${xp}`,
                        color: EmbedColor.Neutral,
                    })]
                };
            }
        } else if (subcmd == "settings") {
            const removePastRoles = interaction.options.getBoolean("remove-past-roles", false);
            const announcements = interaction.options.getString("announcements", false);
            const messageMin = interaction.options.getInteger("message-xp-min", false);
            const messageMax = interaction.options.getInteger("message-xp-max", false);
            const messageCooldown = interaction.options.getInteger("messageCooldown", false);
            const replyMin = interaction.options.getInteger("reply-xp-min", false);
            const replyMax = interaction.options.getInteger("reply-xp-max", false);
            const replyCooldown = interaction.options.getInteger("replyCooldown", false);

            if (removePastRoles != null) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.removePastRoles": removePastRoles, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (announcements != null) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.announcements": announcements as AnnouncementType, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (messageMin) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.messageMin": messageMin, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (messageMax) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.messageMax": messageMax, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (messageCooldown) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.messageCooldown": messageCooldown, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (replyMin) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.replyMin": replyMin, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (replyMax) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.replyMax": replyMax, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            if (replyCooldown) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { "leveling.replyCooldown": replyCooldown, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated leveling settings",
                    color: EmbedColor.Success,
                })]
            };
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: [
            "rewards/add",
            "rewards/remove",
            "rewards/get",
            "rewards/list",
            "reset/user",
            "reset/role",
            "settings",
            "set/level",
            "set/xp",
        ],
        description,
        category: "Management"
    }
};

export default xp;