import {
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ButtonInteraction,
    CommandInteraction,
    Events,
    GuildMember,
    Interaction,
    ModalBuilder,
    ModalSubmitInteraction,
} from "discord.js";
import { CustomInteractionReplyOptions, toReplyOptions } from "lib/command";
import { wildcardAddId, wildcardAddQuestions } from "interactions/chatInput/wildcard";
import { pollVoteId } from "interactions/chatInput/poll";
import { PollModel } from "models/Poll";
import {
    ticketDeleteId,
    ticketGeneralId,
    ticketGeneralQuestions,
    ticketReportId,
    ticketReportQuestions,
    ticketSelectId 
} from "interactions/chatInput/tickets";
import { TicketType, createTicket } from "lib/tickets";
import { resetServerConfirmButtonId } from "interactions/chatInput/xp";
import { staffApplyModalId, staffApplyQuestions } from "interactions/chatInput/staffApply";
import { parseAnswers, toActionRows } from "lib/modal";
import { SettingsModel } from "models/Settings";
import { EmbedColor } from "lib/config";
import { LevelModel } from "models/Level";
import { info, log } from "lib/log";
import CustomClient from "lib/client";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import { remindmeId, remindmeQuestions } from "interactions/chatInput/remindme";
import { parseDuration } from "lib/time";
import { ReminderModel } from "models/Reminder";
import { aiPromptId, getPromptQuestions } from "interactions/chatInput/ai";

async function handleDMInteraction(_client: CustomClient, _interaction: Interaction): Promise<any> {

}

async function handleSelectMenu(_client: CustomClient, interaction: AnySelectMenuInteraction): Promise<any> {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId == ticketSelectId) {
            const selected = interaction.values[0];

            if (selected == ticketGeneralId) {
                const modal = new ModalBuilder()
                    .setCustomId(ticketGeneralId)
                    .setTitle("General Support")
                    .setComponents(toActionRows(ticketGeneralQuestions));

                await interaction.showModal(modal);
            } else if (selected == ticketReportId) {
                const modal = new ModalBuilder()
                    .setCustomId(ticketReportId)
                    .setTitle("Report Person")
                    .setComponents(toActionRows(ticketReportQuestions));

                await interaction.showModal(modal);
            }
        }
    }
}

async function handleButton(client: CustomClient, interaction: ButtonInteraction): Promise<any> {
    if (!interaction.guild) {
        return;
    }

    info("button", interaction.customId);

    if (interaction.customId == ticketDeleteId && interaction.member instanceof GuildMember) {
        const permLevel = client.permLevel(interaction.member);

        if (permLevel >= 1) {
            await interaction.channel?.delete();
        } else {
            await interaction.reply({
                embeds: [client.simpleError("Insufficient Permissions")],
                ephemeral: true
            });
        }
    } else if (interaction.customId == resetServerConfirmButtonId) {
        await LevelModel.updateMany(
            { guildId: interaction.guild.id },
            { $unset: { cachedLevel: 0, xp: 0 } }
        );

        await interaction.channel?.send({
            embeds: [client.simpleEmbed({
                description: `:cold_face: ${interaction.user} just reset the entire server's levels!`,
                color: EmbedColor.Error,
            })]
        });
    } else if (interaction.customId.startsWith(pollVoteId)) {
        const split = interaction.customId.split("-")
        const id = split[1];
        const option = Number(split[2]);

        const poll = await PollModel.findOne({
            guildId: interaction.guild.id,
            pollId: id,
        });

        if (poll) {
            if (!poll.voted.includes(interaction.user.id)) {
                //typescript be like
                let update: any = {};
                update[`votes.${option - 1}`] = 1;

                const success = (await PollModel.findOneAndUpdate(
                    { guildId: interaction.guild.id, pollId: id },
                    { $inc: update, $push: { voted: interaction.user.id } }
                )) !== null;

                if (success) {
                    await interaction.reply({
                        embeds: [client.simpleEmbed({
                            description: `Successfully voted for option ${option}!`,
                            color: EmbedColor.Success,
                        })],
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        embeds: [client.simpleError(`Something went wrong while trying to vote for option ${option}`)],
                        ephemeral: true
                    });
                }
            } else {
                await interaction.reply({
                    embeds: [client.simpleError(`You have already voted in this poll`)],
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                embeds: [client.simpleError(`That poll has already ended or does not exist`)],
                ephemeral: true
            });
        }
    }
}

async function handleModal(client: CustomClient, interaction: ModalSubmitInteraction): Promise<any> {
    if (!interaction.guild) {
        return;
    }

    info("modal", interaction.customId);

    if (interaction.customId == ticketGeneralId) {
        const answers = await parseAnswers(client, interaction, ticketGeneralQuestions);
        const success = await createTicket(client, interaction, answers, TicketType.GeneralSupport);

        if (!success) {
            await interaction.reply({
                embeds: [client.simpleError("Something went wrong while trying to open ticket, please try again")],
                ephemeral: true,
            });
        }
    } else if (interaction.customId == ticketReportId) {
        const answers = await parseAnswers(client, interaction, ticketReportQuestions);
        const success = await createTicket(client, interaction, answers, TicketType.ReportPerson);

        if (!success) {
            await interaction.reply({
                embeds: [client.simpleError("Something went wrong while trying to open ticket, please try again")],
                ephemeral: true,
            });
        }
    } else if (interaction.customId == aiPromptId) {
        const answers = await parseAnswers(client, interaction, getPromptQuestions(interaction.settings));
        const prompt = answers.get("first")! + answers.get("second")! + answers.get("third")!;

        client.settings.set(
            interaction.guild.id,
            await SettingsModel.findOneAndUpdate(
                { _id: interaction.guild.id },
                { "ai.prompt": prompt, toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            )
        );
    
        await interaction.reply({
            embeds: [client.simpleEmbed({
                description: "Updated AI settings",
                color: EmbedColor.Success,
            })]
        });
    } else if (interaction.customId.startsWith(wildcardAddId)) {
        const answers = await parseAnswers(client, interaction, wildcardAddQuestions);

        const id = interaction.customId.slice(wildcardAddId.length + 1);
        const title = answers.get("title")!;
        const description = answers.get("description")!;

        if (!interaction.settings.wildcards.some(v => v.id == id)) {
            client.settings.set(
                interaction.guild.id,
                await SettingsModel.findOneAndUpdate(
                    { _id: interaction.guild.id },
                    { $push: { wildcards: { id, title, description } }, toUpdate: true },
                    { upsert: true, setDefaultsOnInsert: true, new: true }
                )
            );

            await interaction.reply({
                embeds: [client.simpleEmbed({
                    description: `Added new wildcard \`${id}\``,
                    color: EmbedColor.Success,
                })]
            });
        } else {
            await interaction.reply({
                embeds: [client.simpleError(`A starboard with the id \`${id}\` already exists`)]
            });
        }
    } else if (interaction.customId == staffApplyModalId) {
        const answers = await parseAnswers(client, interaction, staffApplyQuestions);

        const reason = answers.get("reason")!;
        const age = answers.get("age")!;
        const timezone = answers.get("timezone")!;

        const channelId = interaction.settings.staffApplyChannel;

        if (channelId) {
            const channel = await interaction.guild.channels.fetch(channelId);

            if (channel && !channel.isDMBased() && channel.isTextBased()) {
                const msg = await channel.send({
                    embeds: [client.simpleEmbed({
                        title: `${interaction.user.username} is applying for staff!`,
                        footer: `User ID: ${interaction.user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                        color: EmbedColor.Neutral,
                    }).setFields(
                        { name: "Why should we pick you?", value: reason },
                        { name: "How old are you?", value: age },
                        { name: "What is your timezone?", value: timezone },
                    )]
                });

                await msg.startThread({
                    name: `${interaction.user.username}'s Staff Application`,
                });

                await interaction.reply({
                    embeds: [client.simpleEmbed({
                        description: "Staff application sent!",
                        color: EmbedColor.Success,
                    })],
                    ephemeral: true
                });

                return;
            }
        }

        await interaction.reply({
            embeds: [client.simpleEmbed({
                description: "Something went wrong while trying to send application",
                color: EmbedColor.Error,
            })],
            ephemeral: true
        });
    } else if (interaction.customId.startsWith(remindmeId)) {
        const answers = await parseAnswers(client, interaction, remindmeQuestions);

        const seconds = parseDuration(interaction.customId.slice(remindmeId.length + 1));
        const reason = answers.get("reason")!;
        const expiresAt = Math.trunc(Date.now() / 1000) + seconds;

        await new ReminderModel({
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            reason,
            duration: seconds,
            expiresAt,
        }).save();

        await interaction.reply({
            embeds: [client.simpleEmbed({
                description: `Your reminder will go off <t:${expiresAt}:R>`,
                color: EmbedColor.Success,
            })]
        });
    }
}

/*
Handles command interactions.
Commands return with an object which instructs
this part of the code on how to reply
to the interaction, if the command itself couldn't.
*/
async function handleCommand(client: CustomClient, interaction: CommandInteraction): Promise<any> {
    const cmd = client.commands.get(interaction.commandName);

    if (!cmd) {
        return;
    }

    let msg = `User ${interaction.user.username} (${interaction.user.id}) ran ${interaction.commandName}`;

    if (interaction.isMessageContextMenuCommand()) {
        msg += ` targeting message ${interaction.targetMessage.id}`;
    } else if (interaction.isUserContextMenuCommand()) {
        msg += ` targeting user ${interaction.user.username} (${interaction.targetUser.id})`;
    }

    info("command", msg);

    const response = await cmd.exec(client, interaction).catch(
        (e: Error) =>
        ({
            embeds: [client.simpleEmbed({
                description: e.message,
                footer: "The bot encountered an error while trying to execute the command.",
                color: EmbedColor.Error,
            })],
        } as CustomInteractionReplyOptions)
    );

    if (interaction.replied || interaction.deferred || response == null) {
        return;
    }

    const reply = toReplyOptions(client, response);

    if (Object.keys(reply).length > 0) {
        interaction.reply(reply);
    }
}

async function handleAutocomplete(client: CustomClient, interaction: AutocompleteInteraction): Promise<any> {
    const gen = client.autocompleteOptions.get(interaction.commandName);

    if (gen) {
        const focused = interaction.options.getFocused(true);
        const autocomplete = gen[focused.name](focused.value, interaction);
        const loggableAutocomplete = autocomplete.map(option => option.name).join(", ");

        info("autocomplete", `${interaction.commandName} - ${loggableAutocomplete}`);

        interaction.respond(autocomplete);
    }
}

const interactionCreate: Event = {
    name: Events.InteractionCreate,
    once: false,
    exec: async (client, interaction: Interaction) => {
        if (!interaction.guild) {
            return await handleDMInteraction(client, interaction);
        }

        /*
        If we don't have a config for this guild,
        we either find it in the database or create an empty one.
        */
        if (!client.settings.has(interaction.guild.id)) {
            const s = await SettingsModel.findOneAndUpdate(
                { _id: interaction.guild.id },
                { toUpdate: true },
                { upsert: true, setDefaultsOnInsert: true, new: true }
            );

            log("sync", colors.cyan, `Database -> Client (${interaction.guild.id})`);

            client.settings.set(interaction.guild.id, s);
            interaction.settings = s;
        } else {
            const s = client.settings.get(interaction.guild.id)!;

            interaction.settings = s;
        }

        if (interaction.isButton()) {
            await handleButton(client, interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModal(client, interaction);
        } else if (interaction.isAnySelectMenu()) {
            await handleSelectMenu(client, interaction);
        } else if (interaction.isCommand()) {
            await handleCommand(client, interaction);
        } else if (interaction.isAutocomplete()) {
            await handleAutocomplete(client, interaction);
        }
    }
};

export default interactionCreate;