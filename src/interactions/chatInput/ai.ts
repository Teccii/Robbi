import {
    ChannelType,
    ChatInputCommandInteraction,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputStyle
} from "discord.js";
import { InteractionCommand } from "lib/command";
import { EmbedColor } from "lib/config";
import { Question, toActionRows } from "lib/modal";
import { ISettings, SettingsModel } from "models/Settings";

export const aiPromptId = "aiPrompt";
export function getPromptQuestions(settings: ISettings): Question[] {
    return [
        new Question(
            "first",
            "Paragraph 1",
            TextInputStyle.Paragraph,
            true,
            undefined,
            settings.ai.prompt.slice(0, 4000),
        ),
        new Question(
            "second",
            "Paragraph 2",
            TextInputStyle.Paragraph,
            true,
            undefined,
            settings.ai.prompt.slice(4000, 8000),
        ),
        new Question(
            "third",
            "Paragraph 3",
            TextInputStyle.Paragraph,
            true,
            undefined,
            settings.ai.prompt.slice(8000),
        )
    ]
}

const description = "Manages the AI chatbot for this guild.";

const ai: InteractionCommand = {
    data: new SlashCommandBuilder()
        .addSubcommand(cmd =>
            cmd
                .setName("start")
                .setDescription("Boots up the AI for this guild.")    
        )
        .addSubcommand(cmd =>
            cmd
                .setName("stop")
                .setDescription("Shuts down the AI for this guild.")    
        )
        .addSubcommand(cmd =>
            cmd
                .setName("reset")
                .setDescription("Restarts the AI for this guild.")    
        )
        .addSubcommand(cmd =>
            cmd
                .addBooleanOption(option =>
                    option
                        .setRequired(true)
                        .setName("value")
                        .setDescription("The new Debug Mode value.")
                )
                .setName("debug")
                .setDescription("Toggles Debug Mode on/off for the AI for this guild.")    
        )
        .addSubcommand(cmd =>
            cmd
                .addStringOption(option =>
                    option
                        .setChoices(
                            { name: "None", value: "None" },
                            { name: "Low", value: "Low" },
                            { name: "Medium", value: "Medium"},
                            { name: "High", value: "High" },
                        )
                        .setRequired(true)
                        .setName("value")
                        .setDescription("The new Content Filter level.")    
                )
                .setName("filter")
                .setDescription("Manages the Content Filter of the AI for this guild.")    
        )
        .addSubcommand(cmd =>
            cmd
                .addNumberOption(option =>
                    option
                        .setMinValue(0.0)
                        .setMaxValue(1.0)
                        .setRequired(true)
                        .setName("value")
                        .setDescription("The new temperature value.")    
                )
                .setName("temperature")
                .setDescription("Manages the temperature of the AI for this guild.")    
        )
        .addSubcommand(cmd =>
            cmd
                .setName("prompt")
                .setDescription("Manages the prompt of the AI for this guild.")    
        )
        .addSubcommandGroup(group =>
            group
                .addSubcommand(cmd =>
                    cmd
                        .addChannelOption(option =>
                            option
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                                .setName("channel")
                                .setDescription("The channel to add.")    
                        )
                        .setName("add")
                        .setDescription("Adds a channel to the list.")
                )
                .addSubcommand(cmd =>
                    cmd
                        .addChannelOption(option =>
                            option
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                                .setName("channel")
                                .setDescription("The channel to remove.")    
                        )
                        .setName("remove")
                        .setDescription("Removes a channel from the list.")
                )
                .addSubcommand(cmd =>
                    cmd
                        .setName("list")
                        .setDescription("Lists the channels where the AI can be triggered.")
                )
                .setName("channel")
                .setDescription("Manages the channels where the AI can be triggered.")    
        )
        .setDMPermission(false)
        .setName("ai")
        .setDescription(description),
    exec: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) {
            return { error: "Invalid Interaction Type" };
        }

        const permLevel = client.permLevel(interaction.member);
        const subcmd = interaction.options.getSubcommand();

        const adminOnly = ["debug", "filter", "temperature", "prompt", "add", "remove"]
        const staffOnly = ["start", "stop", "list"];

        if ((permLevel < 2 && adminOnly.includes(subcmd)) || (permLevel < 1 && staffOnly.includes(subcmd))) {
			return { error: "Insufficient permissions", ephemeral: true };
		}

        if (subcmd == "start") {
            if (!client.chats.has(interaction.guild.id)) {
                client.newChat(interaction.guild.id);

                return {
                    embeds: [client.simpleEmbed({
                        description: "Successfully turned on the AI",
                        color: EmbedColor.Success,
                    })]
                };
            } else {
                return { error: "The AI is already turned on" };
            }
        } else if (subcmd == "stop") {
            if (client.chats.delete(interaction.guild.id)) {
                return {
                    embeds: [client.simpleEmbed({
                        description: "Successfully turned off the AI",
                        color: EmbedColor.Success,
                    })]
                };
            } else {
                return { error: "The AI is already turned off" };
            }
        } else if (subcmd == "reset") {
            if (client.newChat(interaction.guild.id)) {
                return {
                    embeds: [client.simpleEmbed({
                        description: "Successfully reset the AI",
                        color: EmbedColor.Success,
                    })]
                };
            } else {
                return { error: "Failed to reset the AI" };
            }
        }  else if (subcmd == "debug") {
            const value = interaction.options.getBoolean("value", true);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { "ai.debug": value, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated AI settings",
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "filter") {
            const value = interaction.options.getString("value", true);
        
            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { "ai.contentFilter": value, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated AI settings",
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "temperature") {
            const value = interaction.options.getNumber("value", true);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { "ai.temperature": value, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated AI settings",
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "prompt") {
            const modal = new ModalBuilder()
                .setCustomId(`${aiPromptId}`)
                .setTitle(`Edit prompt for ${interaction.guild.name}`)
                .setComponents(toActionRows(getPromptQuestions(interaction.settings)));

            await interaction.showModal(modal);
        } else if (subcmd == "add") {
            const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $pull: { "ai.channels": channel.id }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );
    
            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $push: { "ai.channels": channel.id }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated AI settings",
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "remove") {
            const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $pull: { "ai.channels": channel.id }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            return {
                embeds: [client.simpleEmbed({
                    description: "Updated AI settings",
                    color: EmbedColor.Success,
                })]
            };
        } else if (subcmd == "list") {
            const channelIds = interaction.settings.ai.channels;

            return {
                embeds: [client.simpleEmbed({
                    title: `AI Channels for ${interaction.guild.name}`,
                    description: channelIds.map(v => `<#${v}>`).join("\n"),
                    color: EmbedColor.Neutral,
                })]
            };
        }

        return { };
    },
    help: {
        subcommands: ["start", "stop", "reset"],
        description,
        category: "Management"
    }
};

export default ai;