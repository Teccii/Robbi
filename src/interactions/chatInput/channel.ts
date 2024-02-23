import { 
    ChannelType,
    ChatInputCommandInteraction,
    SlashCommandBuilder
} from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";

type ChannelTypes = (
    ChannelType.GuildText
    | ChannelType.GuildVoice
    | ChannelType.GuildCategory
    | ChannelType.GuildAnnouncement
    | ChannelType.AnnouncementThread
    | ChannelType.PublicThread
    | ChannelType.PrivateThread
    | ChannelType.GuildStageVoice
    | ChannelType.GuildForum
    | ChannelType.GuildMedia
)[];

const channelTypes: ChannelTypes = [
    ChannelType.GuildText,
    ChannelType.GuildVoice,
    ChannelType.GuildForum,
];

const description = "Manages channel visibility for specific members.";

const channel: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(subcmd =>
            subcmd
                .addUserOption(option =>
                    option
                        .setRequired(true)
                        .setName("user")
                        .setDescription("The user.")    
                )
                .addChannelOption(option =>
                    option
                        .addChannelTypes(...channelTypes)
                        .setRequired(false)
                        .setName("channel")
                        .setDescription("The channel to make visible. If left unspecified, it will be the current channel.")    
                )
                .setName("show")
                .setDescription("Makes a channel visible to a user.")    
        )
        .addSubcommand(subcmd =>
            subcmd
                .addUserOption(option =>
                    option
                        .setRequired(true)
                        .setName("user")
                        .setDescription("The user.")    
                )
                .addChannelOption(option =>
                    option
                        .addChannelTypes(...channelTypes)
                        .setRequired(false)
                        .setName("channel")
                        .setDescription("The channel to make invisible. If left unspecified, it will be the current channel.")    
                )
                .setName("hide")
                .setDescription("Makes a channel invisible to a user.")    
        )
        .setName("channel")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmd = interaction.options.getSubcommand();
        const member = interaction.options.getMember("user");

        if (!member) {
            return {
                error: "User is not a member of this guild",
                ephemeral: true,
            };
        }

        if (member.id == interaction.member.id) {
            return {
                error: "Unable to show or hide a channel from oneself",
                ephemeral: true
            }
        }

        if (client.permLevel(interaction.member) <= client.permLevel(member)) {
            return {
                error: "Cannot modify permissions for a user with similar or higher authority",
                ephemeral: true
            }
        }

        const channel = interaction.options.getChannel("channel", false, channelTypes) ?? interaction.channel;

        if (channel && channel.type != ChannelType.GuildCategory && !channel.isThread()) {
            if (subcmd == "show") {
                await channel.permissionOverwrites.edit(member, { ViewChannel: true });
            } else if (subcmd == "hide") {
                await channel.permissionOverwrites.edit(member, { ViewChannel: false });
            }
        }

        if (subcmd == "show") {
            return {
                embeds: [client.simpleEmbed({
                    description: `${channel} is now visible to ${member}`,
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "hide") {
            return {
                embeds: [client.simpleEmbed({
                    description: `${channel} is now invisible to ${member}`,
                    color: EmbedColor.Error,
                })]
            };
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["show", "hide"],
        description,
        category: "Information"
    }
};

export default channel;