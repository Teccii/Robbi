import { GuildMember, TextBasedChannel } from "discord.js";
import { AnnouncementType, ISettings } from "models/Settings";
import CustomClient from "./client";
import { EmbedColor } from "./config";
import dayjs from "dayjs";
import { ILevel } from "models/Level";

export function levelToXp(level: number): number {
    return Math.floor(40 * level * level);
}

export function xpToLevel(xp: number): number {
    return Math.floor(0.05 * Math.sqrt(10 * xp));
}

export function announce(newLevel: number, settings: ISettings): boolean {
    const _type = settings.leveling.announcements;

    if (_type == AnnouncementType.Always) {
        return true;
    }

    const fiveVariants = [AnnouncementType.EveryFive, AnnouncementType.EveryFiveAndRewards];
    const tenVariants = [AnnouncementType.EveryTen, AnnouncementType.EveryTenAndRewards];

    if (newLevel % 5 == 0 && fiveVariants.includes(_type)) {
        return true;
    }

    if (newLevel % 10 == 0 && tenVariants.includes(_type)) {
        return true;
    }

    const hasRewards = settings.leveling.levelRoles.some(v => v.level == newLevel);
    const rewardVariants = [
        AnnouncementType.RewardsOnly,
        AnnouncementType.EveryFiveAndRewards,
        AnnouncementType.EveryTenAndRewards
    ];

    return hasRewards && rewardVariants.includes(_type);
}


export async function handleNewLevel(
    client: CustomClient,
    member: GuildMember,
    channel: TextBasedChannel,
    newLevel: number,
    leveling: ILevel,
    settings: ISettings
) {
    leveling.cachedLevel = newLevel;

    await leveling.save();

    if (announce(newLevel, settings)) {
        await channel.send({
            embeds: [client.simpleEmbed({
                description: `${member} is now level ${newLevel}! :tada:`,
                footer: `${dayjs().format("DD/MM/YYYY HH:mm")}`,
                color: EmbedColor.Neutral
            })]
        });
    }

    await setRoles(member, newLevel, settings);
}

export async function setRoles(member: GuildMember, level: number, settings: ISettings) {
    const roles = settings.leveling.levelRoles.filter(v => v.level <= level).sort((a, b) => b.level - a.level).map(v => v.role);

    for (const id of roles) {
        await member.roles.add(id);
    }

    const higherRoles = settings.leveling.levelRoles.filter(v => v.level > level).map(v => v.role);

    for (const id of higherRoles) {
        await member.roles.remove(id);
    }

    if (settings.leveling.removePastRoles) {
        const pastRoles = roles.slice(1, roles.length);

        for (const id of pastRoles) {
            await member.roles.remove(id);
        }
    }
}