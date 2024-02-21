import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { InteractionCommand } from "lib/command";
import { SettingsModel } from "models/Settings";

const description = "Manages the channels where events are logged.";

const log: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addStringOption(option =>
            option
                .setChoices(
                    { name: "Channel Create", value: "channelCreate" },
                    { name: "Channel Delete", value: "channelDelete" },
                    { name: "Channel Update", value: "channelUpdate" },
                    { name: "All Channel Events", value: "channelAll" },
                    { name: "Member Join", value: "guildMemberAdd" },
                    { name: "Member Leave", value: "guildMemberRemove" },
                    { name: "Member Update", value: "guildMemberUpdate" },
                    { name: "All Member Events", value: "memberAll" },
                    { name: "Message Delete", value: "messageDelete" },
                    { name: "Message Update", value: "messageUpdate" },
                    { name: "All Message Events", value: "messageAll" },
                    { name: "Role Create", value: "roleCreate" },
                    { name: "Role Delete", value: "roleDelete" },
                    { name: "Role Update", value: "roleUpdate" },
                    { name: "All Role Events", value: "roleAll" },
                    { name: "Case Create", value: "caseCreate" },
                    { name: "Case Delete", value: "caseDelete" },
                    { name: "Case Update", value: "caseUpdate" },
                    { name: "Case Expire", value: "caseExpire" },
                    { name: "All Case Events", value: "caseAll" },
                    { name: "All Events", value: "allEvents" },
                )
                .setRequired(true)
                .setName("event")
                .setDescription("The event(s).")
        )
        .addChannelOption(option =>
            option
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
                .setName("channel")
                .setDescription("The channel. If left unspecified, the event(s) will not be logged in any channel.")
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName("log")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const channel = interaction.options.getChannel("channel", false);
        const _event = interaction.options.getString("event", true);

        let events: string[] = [_event];

        switch (_event) {
            case "channelAll": {
                events = ["channelCreate", "channelDelete", "channelUpdate"];
                break;
            }

            case "memberAll": {
                events = ["guildMemberAdd", "guildMemberRemove", "guildMemberUpdate"];
                break;
            }

            case "messageAll": {
                events = ["messageDelete", "messageUpdate"];
                break;
            }

            case "roleAll": {
                events = ["roleCreate", "roleDelete", "roleUpdate"];
                break;
            }

            case "caseAll": {
                events = ["caseCreate", "caseDelete", "caseUpdate", "caseExpire"];
                break;
            }

            case "allEvents": {
                events = [
                    "channelCreate", "channelDelete", "channelUpdate",
                    "guildMemberAdd", "guildMemberRemove", "guildMemberUpdate",
                    "messageDelete", "messageUpdate",
                    "roleCreate", "roleDelete", "roleUpdate",
                    "caseCreate", "caseDelete", "caseUpdate", "caseExpire",
                ];
                break;
            }
        }

        for (const event of events) {
            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $pull: { events: { event } }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            if (channel) {
                client.settings.set(
                    interaction.guild.id,
                    await SettingsModel.findOneAndUpdate(
                        { _id: interaction.guild.id },
                        { $push: { events: { event, channel: channel.id } }, toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    )
                );
            }
        }

        if (channel) {
            return {
                embeds: [client.simpleEmbed({
                    description: `${events.map(v => `\`${v}\``).join(", ")} are now being logged in ${channel}`,
                    color: EmbedColor.Neutral,
                })]
            };
        } else {
            return {
                embeds: [client.simpleEmbed({
                    description: `${events.map(v => `\`${v}\``).join(", ")} are no longer being logged in any channel`,
                    color: EmbedColor.Neutral,
                })]
            };
        }
    },
    help: {
        subcommands: [],
        description,
        category: "Moderation"
    }
};

export default log;