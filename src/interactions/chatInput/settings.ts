import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { EmbedColor } from "lib/config";
import { CustomInteractionReplyOptions, InteractionCommand } from "lib/command";
import CustomClient from "lib/client";
import { AnnouncementType, SettingsModel } from "models/Settings";

async function handleLeveling(client: CustomClient, interaction: ChatInputCommandInteraction): Promise<CustomInteractionReplyOptions> {
    if (!interaction.guild) {
        return { error: "Missing Guild", ephemeral: true };
    }

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


async function handleTickets(client: CustomClient, interaction: ChatInputCommandInteraction): Promise<CustomInteractionReplyOptions> {
    if (!interaction.guild) {
        return { error: "Missing Guild", ephemeral: true };
    }
    
    const category = interaction.options.getChannel("category", false, [ChannelType.GuildCategory]);

    if (category) {
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
}

async function handleStaffApply(client: CustomClient, interaction: ChatInputCommandInteraction): Promise<CustomInteractionReplyOptions> {
    if (!interaction.guild) {
        return { error: "Missing Guild", ephemeral: true };
    }
    
    const channel = interaction.options.getChannel("channel", false, [ChannelType.GuildText]);

    if (channel) {
        client.settings.set(
            interaction.guild.id,
            await SettingsModel.findOneAndUpdate(
                { _id: interaction.guild.id },
                { staffApplyChannel: channel.id, toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            )
        );
    }

    return {
        embeds: [client.simpleEmbed({
            description: "Updated staff application settings",
            color: EmbedColor.Success,
        })]
    };
}

async function handleLogs(client: CustomClient, interaction: ChatInputCommandInteraction): Promise<CustomInteractionReplyOptions> {
    if (!interaction.guild) {
        return { error: "Missing Guild", ephemeral: true };
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

        case "expressionAll": {
            events = ["expressionCreate", "expressionDelete", "expressionUpdate"];
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
                "expressionCreate", "expressionDelete", "expressionUpdate",
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
}

const description = "Manages bot settings for this guild";

const settings: InteractionCommand = {
    data: new SlashCommandBuilder()
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
            .setName("leveling")
            .setDescription("Manages the settings of the leveling system.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addChannelOption(option =>
                    option
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                        .setName("category")
                        .setDescription("The category to place tickets under.")    
                )
                .setName("tickets")
                .setDescription("Manages the settings of the tickets system.")
        )
        .addSubcommand(subcmd =>
            subcmd
                .addChannelOption(option =>
                    option
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)
                        .setName("channel")
                        .setDescription("The channel to send staff applications to.")    
                )
                .setName("staff-apply")
                .setDescription("Manages the settings of the staff application system.")
        )
        .addSubcommand(subcmd =>
            subcmd
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
                            { name: "Expression Create", value: "expressionCreate" },
                            { name: "Expression Delete", value: "expressionDelete" },
                            { name: "Expression Update", value: "expressionUpdate" },
                            { name: "All Expression Events", value: "expressionAll" },
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
                .setName("logs")
                .setDescription("Manages the channels where events are logged.")
        )
        .setName("settings")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const subcmdGroup = interaction.options.getSubcommandGroup(false);
        const subcmd = interaction.options.getSubcommand(true);

        if (subcmdGroup) {

        } else {
            if (subcmd == "leveling") {
                return await handleLeveling(client, interaction);
            } else if (subcmd == "tickets") {
                return await handleTickets(client, interaction);
            } else if (subcmd == "staff-apply") {
                return await handleStaffApply(client, interaction);
            } else if (subcmd == "logs") {
                return await handleLogs(client, interaction);
            }
        }

        return { error: "Unknown Error", ephemeral: true };
    },
    help: {
        subcommands: ["leveling", "tickets", "logs"], 
        description,
        category: "Management"
    }
};

export default settings;