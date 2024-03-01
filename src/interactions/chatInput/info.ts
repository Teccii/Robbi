import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import dayjs from "dayjs";

const description = "Gets information about a user/role.";

const info: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .setName("user")
                .setDescription("Get information about a user.")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("The user to get information about.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("role")
                .setDescription("Get information about a role.")
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("The role to get information about.")
                        .setRequired(true)
                )
        )
        .setName("info")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();

        if (subcmd == "role") {
            const role = interaction.options.getRole("role", true);
            const permissions = role.permissions.toArray();

            if (permissions.length == 0) {
                return {
                    embeds: [client.simpleEmbed({
                        title: role.name,
                        color: EmbedColor.Neutral
                    }).setFields(
                        { name: 'Created', value: `<t:${Math.floor(role.createdAt.getTime() / 1000)}:f>`, inline: true },
                        { name: 'Members', value: `${role.members.size}`, inline: true },
                        { name: 'Permissions', value: "No elevated permissions available" },
                    )]
                };
            } else {
                return {
                    embeds: [client.simpleEmbed({
                        title: role.name,
                        color: EmbedColor.Neutral
                    }).setFields(
                        { name: 'Created', value: `<t:${Math.floor(role.createdAt.getTime() / 1000)}:f>`, inline: true },
                        { name: 'Members', value: `${role.members.size}`, inline: true },
                        { name: 'Permissions', value: permissions.join(", ") },
                    )]
                };
            }

        } else if (subcmd == "user") {
            const member = interaction.options.getMember("user");

            if (!member) {
                return { error: "User is not a member of this guild" };
            }

            const roles = member.roles.cache.toJSON().join(", ");

            return {
                embeds: [client.simpleEmbed({
                    footer: dayjs().format("DD/MM/YYYY HH:mm"),
                    color: EmbedColor.Neutral,
                }).setAuthor({
                    name: member.user.username,
                    iconURL: member.user.avatarURL()!
                }).setFields(
                    { name: 'Registered', value: `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:f>`, inline: true },
                    { name: 'Joined', value: `<t:${Math.floor(member.joinedAt?.getTime()! / 1000)}:f>`, inline: true },
                    { name: 'Roles', value: roles },
                )]
            };
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["user", "role"],
        description,
        category: "Information"
    }
};

export default info;