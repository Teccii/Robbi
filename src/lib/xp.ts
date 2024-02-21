import { GuildMember } from "discord.js";
import { ISettings } from "models/Settings";

export function levelToXp(level: number): number {
    return Math.floor(40 * level * level);
}

export function xpToLevel(xp: number): number {
    return Math.floor(0.05 * Math.sqrt(10 * xp));
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