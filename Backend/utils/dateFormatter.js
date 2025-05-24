export function getLocalDateInTimezone( timezoneValue="UTC+0", date = null,) {
    const now = date ? date: new Date(); // Get current date/time in local system's timezone

    // 1. Extract the offset from the timezone string
    const offsetMatch = timezoneValue.match(/UTC([+-]\d+)/);
    if (!offsetMatch) {
        console.error("Invalid timezoneValue format:", timezoneValue);
        return null; // Or throw an error
    }
    const utcOffsetHours = parseInt(offsetMatch[1], 10);

    // 2. Get the current UTC hours and minutes
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const utcMilliseconds = now.getUTCMilliseconds();

    // 3. Create a new Date object representing the current UTC date
    //    We'll then adjust the hours and minutes for the target timezone.
    const targetDate = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        utcHours + utcOffsetHours, // Add the offset to UTC hours
        utcMinutes,
        utcSeconds,
        utcMilliseconds
    );

    return targetDate;
}
