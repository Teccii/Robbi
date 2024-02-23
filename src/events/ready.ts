import { ActivityType, Events, GuildBasedChannel } from "discord.js";
import { CaseModel, CaseType } from "models/Case";
import { SettingsModel } from "models/Settings";
import { PollModel } from "models/Poll";
import { EmbedColor } from "lib/config";
import { info, log } from "lib/log";
import { endPoll } from "lib/poll";
import Event from "lib/event";
import colors from "colors";
import dayjs from "dayjs";
import _ from "lodash";

const statuses: {
    name: string,
    state?: string,
    type: ActivityType,
}[] = [
    {
        name: "customstatus",
        state: "Accelerate your entire PC experience with the fast, powerful NVIDIA® GeForce® GT 1030 graphics card",
        type: ActivityType.Custom
    },
    {
        name: "customstatus",
        state: "I love fossil fuels. My dream is to work on an oil rig so that I can drink oil whenever I want",
        type: ActivityType.Custom
    },
    {
        name: "customstatus",
        state: "Yeah I'd like to solve the puzzle \"alright go ahead\" MREOWWW",
        type: ActivityType.Custom
    },
    {
        name: "customstatus",
        state: "The horrors are endless but I stay silly :3",
        type: ActivityType.Custom
    },
    {
        name: "customstatus",
        state: "Me waking up after telling the nice doctor the truth",
        type: ActivityType.Custom
    },
    {
        name: "customstatus",
        state: "The grind NEVER starts. I am sleeping",
        type: ActivityType.Custom
    }
];

const ready: Event = {
    name: Events.ClientReady,
    once: true,
    exec: async (client) => {
        log("ready", colors.green, `Logged in as ${client.user?.tag}`);

        /*
        This function runs every 3 seconds in order to update stuff
        */
        const update = async () => {
            /*
            This refreshes the guild configs.
            If the client side is incongruent with the database side, or vice versa,
            one will need to be updated.

            This means that every time you change the guild configs,
            you will need to also set the `toUpdate` flag to true,
            so that this can catch it.
            */
            for (const [key] of client.settings) {
                let s = await SettingsModel.findOne({ _id: key });

                if (s) {
                    const cachedSettings = client.settings.get(key);

                    if (cachedSettings == s && !s.toUpdate) {
                        continue;
                    }

                    if (cachedSettings) {
                        if (s.toUpdate) {
                            //Sync the client with the database.
                            log("sync", colors.cyan, `Database -> Client (${key})`);

                            const newSettings = await SettingsModel.findOneAndUpdate(
                                { _id: s._id },
                                { toUpdate: false },
                                { new: true }
                            );

                            if (newSettings) {
                                client.settings.set(key, newSettings);
                            }
                        } else if (cachedSettings.toUpdate) {
                            //Sync the database with the client.
                            const ourSettings = { ...cachedSettings };
                            delete ourSettings._id;

                            ourSettings.toUpdate = false;

                            log("sync", colors.cyan, `Client -> Database (${key})`);

                            await SettingsModel.updateOne(
                                { _id: s._id },
                                ourSettings
                            );

                            const newSettings = await SettingsModel.findOne({ _id: s._id });

                            if (newSettings) {
                                client.settings.set(key, newSettings);
                            }
                        }
                    }
                } else {
                    /*
                    If the client has a key, but there is no config on the database,
                    generate an empty one. Can't trust the client side here.
                    */
                    log("config", colors.cyan, `Generating config (${key})...`);

                    client.settings.set(
                        key,
                        await new SettingsModel({ _id: key }).save()
                    );

                    log("config", colors.cyan, `Finished generating config (${key})`);
                }
            }

            /*
            Handles expired mute and ban cases.
            */
            const now = Math.trunc(Date.now() / 1000);

            const endedPolls = await PollModel.find({
                endsAt: { $exists: true, $lt: now },
            });

            for (const poll of endedPolls) {
                const guild = await client.guilds.fetch(poll.guildId);
                
                await endPoll(client, guild, poll, false);
            }

            const expiredCases = await CaseModel.find({
                caseType: { $in: [CaseType.Ban, CaseType.Mute] },
                duration: { $exists: true },
                expired: false,
                expiresAt: { $exists: true, $lt: now },
            });

            await CaseModel.updateMany(
                {
                    caseType: { $in: [CaseType.Ban, CaseType.Mute] },
                    duration: { $exists: true },
                    expired: false,
                    expiresAt: { $exists: true, $lt: now },
                },
                { expired: true },
            );

            for (const _case of expiredCases) {
                const caseType = _case.caseType;
                const guild = await client.guilds.fetch(_case.guildId);

                if (!client.settings.has(guild.id)) {
                    const s = await SettingsModel.findOneAndUpdate(
                        { _id: guild.id },
                        { toUpdate: true },
                        { upsert: true, setDefaultsOnInsert: true, new: true }
                    );

                    log("sync", colors.cyan, `Database -> Client (${guild.id})`);

                    client.settings.set(guild.id, s);
                    guild.settings = s;
                } else {
                    const s = client.settings.get(guild.id)!;

                    guild.settings = s;
                }

                const user = await client.users.fetch(_case.targetId);
                const logChannelId = guild.settings.events.find(v => v.event == "caseExpire")?.channel;
                let logChannel: GuildBasedChannel | null = null;

                if (logChannelId) {
                    logChannel = await guild.channels.fetch(logChannelId);
                }

                if (caseType == CaseType.Ban) {
                    await guild.members.unban(user, "Ban expired").then(_ => {
                        info("unban", `${user.username} (${user.id}) unbanned from ${guild.id}.\n\tReason: Ban expired`);
                    });

                    if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                        await logChannel.send({
                            embeds: [client.simpleEmbed({
                                description: `${user} unbanned`,
                                footer: `User ID: ${user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                                color: EmbedColor.Neutral
                            })]
                        });
                    }

                    await user.send({
                        embeds: [client.simpleEmbed({
                            title: `You have been unbanned from ${guild}`,
                            color: EmbedColor.Neutral,
                        }).setFields(
                            { name: "Reason", value: "Ban expired" }
                        )]
                    });
                } else if (caseType == CaseType.Mute) {
                    const member = await guild.members.fetch(user);

                    await member.timeout(null).then(_ => {
                        info("unmute", `${user.username} (${user.id}) unmuted in ${guild.id}.\n\tReason: Mute expired`);
                    });

                    if (logChannel && !logChannel.isDMBased() && logChannel.isTextBased()) {
                        await logChannel.send({
                            embeds: [client.simpleEmbed({
                                description: `${user} unmuted`,
                                footer: `User ID: ${user.id} · ${dayjs().format("DD/MM/YYYY HH:mm")}`,
                                color: EmbedColor.Neutral
                            })]
                        });
                    }

                    await user.send({
                        embeds: [client.simpleEmbed({
                            title: `You have been unmuted from ${guild}`,
                            color: EmbedColor.Neutral,
                        }).setFields(
                            { name: "Reason", value: "Mute expired" }
                        )]
                    });
                }
            }


        }

        const updatePresence = () => {
            const newStatus = _.sample(statuses);
            client.user?.setActivity(newStatus);
        }

        setInterval(update, 3 * 1000);
        setInterval(updatePresence, 30 * 1000);

        client.refreshCommands();
    }
};

export default ready;