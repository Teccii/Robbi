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

export function parseDuration(str: string): number {
    const unit = str[str.length - 1];
    const value = Number(str.slice(0, str.length - 1))

    switch (unit) {
        case "s": {
            return value;
        }
    
        case "m": {
            return value * 60;
        }
    
        case "h": {
            return value * 60 * 60;
        }
    
        case "d": {
            return value * 60 * 60 * 24;
        }
    
        case "w": {
            return value * 60 * 60 * 24 * 7;
        }
    
        case "M": {
            return value * 60 * 60 * 24 * 30;
        }
    
        case "y": {
            return value * 60 * 60 * 24 * 365;
        }
    
        default: {
            return value; //assume seconds
        }
    }
}