export function durationToString(seconds: number): string {
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * (365 / 12);
    const year = day * 365;

    const years = Math.floor(seconds / year);
    const months = Math.floor((seconds % year) / month);
    const days = Math.floor(((seconds % year) % month) / day);
    const hours = Math.floor((seconds % day) / hour);
    const minutes = Math.floor((seconds % hour) / minute);
    const _seconds = Math.floor(seconds % minute);

    let duration = "";

    if (years !== 0) {
        duration += `${years} years `;
    }

    if (months !== 0) {
        duration += `${months} months `;
    }

    if (days !== 0) {
        duration += `${days} days `;
    }

    if (hours !== 0) {
        duration += `${hours} hours `;
    }

    if (minutes !== 0) {
        duration += `${minutes} minutes `;
    }

    if (_seconds !== 0) {
        duration += `${_seconds} seconds`;
    }

    return duration;
}