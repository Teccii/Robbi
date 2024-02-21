import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";
import { StarboardMessageModel } from "models/StarboardMessage";
import emojiRegex from "emoji-regex";

function isEmoji(str: string): boolean {
    return Boolean(str.match(emojiRegex()) || str.match(/<a:.+?:\d+>|<:.+?:\d+>/));
}

const description = "Manages the starboard system for this guild.";

const starboard: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The identifier for the starboard.")
                )
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("emoji")
                        .setDescription("The emoji to trigger it.")
                )
                .addChannelOption(option =>
                    option
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                        .setName("channel")
                        .setDescription("The channel for the starboard.")
                )
                .addIntegerOption(option =>
                    option
                        .setRequired(false)
                        .setName("threshold")
                        .setDescription("The threshold for the starboard.")
                )
                .setName("add")
                .setDescription("Adds a starboard.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addStringOption(option =>
                    option
                        .setRequired(true)
                        .setName("id")
                        .setDescription("The identifier for the starboard.")
                )
                .addBooleanOption(option =>
                    option
                        .setRequired(true)
                        .setName("clear")
                        .setDescription("If set to true, deletes starboard messages.")
                )
                .setName("remove")
                .setDescription("Remove a starboard.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .setName("list")
                .setDescription("Lists every starboard in the guild.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("starboard")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }
        
        const permLevel = client.permLevel(interaction.member);
        const subcmd = interaction.options.getSubcommand();
        
        const adminOnly = ["add", "remove"];
        const staffOnly = ["list"];

        if ((permLevel < 3 && adminOnly.includes(subcmd)) || (permLevel < 1 && staffOnly.includes(subcmd))) {
			return { error: "Insufficient permissions", ephemeral: true };
		}

        if (subcmd == "add") {
            const id = interaction.options.getString("id", true);
            const emoji = interaction.options.getString("emoji", true);
            const channel = interaction.options.getChannel("channel", true);
            const threshold = interaction.options.getInteger("threshold", false) ?? 10;

            if (isEmoji(emoji)) {
                if (!interaction.settings.starboards.some(v => v.id == id)) {
                    client.settings.set(
                        interaction.guild.id,
                        await SettingsModel.findOneAndUpdate(
                            { _id: interaction.guild.id },
                            {
                                $push: {
                                    starboards: {
                                        id,
                                        emoji,
                                        channel: channel.id,
                                        threshold
                                    }
                                }, toUpdate: true
                            },
                            { upsert: true, setDefaultsOnInsert: true, new: true }
                        )
                    );

                    return {
                        embeds: [client.simpleEmbed({
                            description: `Added new starboard \`${id}\``,
                            color: EmbedColor.Success,
                        })]
                    };
                } else {
                    return { error: `A starboard with the id \`${id}\` already exists` };
                }
            } else {
                return { error: `Invalid emoji: \`${emoji}\`` };
            }
        } else if (subcmd == "remove") {
            const id = interaction.options.getString("id", true);
            const clear = interaction.options.getBoolean("clear", true);
            const starboard = interaction.settings.starboards.find(v => v.id == id);

            if (starboard) {
                if (clear) {
                    const channel = await interaction.guild.channels.fetch(starboard.channel);

                    if (channel && !channel.isDMBased() && channel.isTextBased()) {
                        const messages = await StarboardMessageModel.find({
                            guildId: interaction.guild.id,
                            starboardId: id,
                        });

                        for (const message of messages) {
                            const channelMessage = await channel.messages.fetch(message.starboardMessageId);

                            await channelMessage.delete();
                        }
                    }

                    await StarboardMessageModel.deleteMany({
                        guildId: interaction.guild.id,
                        starboardId: id,
                    });
                }

                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $pull: { starboards: { id: id } }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );

                return {
                    embeds: [client.simpleEmbed({
                        description: `Deleted starboard \`${id}\``,
                        color: EmbedColor.Success,
                    })]
                };
            } else {
                return { error: `No existing starboard with the id \`${id}\`` };
            }
        } else if (subcmd == "list") {
            if (interaction.settings.starboards.length != 0) {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Starboards for ${interaction.guild.name}`,
                        description: interaction.settings.starboards.map(v => `${v.emoji} \`${v.id}\``).join(", "),
                        color: EmbedColor.Neutral
                    })]
                };
            } else {
                return {
                    embeds: [client.simpleEmbed({
                        title: `Starboards for ${interaction.guild.name}`,
                        description: "No starboards available",
                        color: EmbedColor.Neutral
                    })]
                };
            }
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["add", "remove", "list"],
        description,
        category: "Management"
    }
};

export default starboard;