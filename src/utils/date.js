const convertDateToTimetamp = (dtStr) => {
    if (!dtStr) return null;
    // const [d, m, y] = dtStr.split(/-|\//); // splits "26-02-2012" or "26/02/2012"
    // const date = new Date(y, m - 1, d);
    const date = new Date(dtStr);
    return date.getTime();
};

const convertStrToTimetamp = (dtStr) => {
    if (!dtStr) return null;
    const [datePart] = dtStr.split(' ');
    // splits "2012-02-25" or "2024/02/25"
    const [y, m, d] = datePart.split(/-|\//);
    const date = new Date(y, m - 1, d);
    // const date = new Date(dtStr);
    return date.getTime();
};

const convertYMDStrToTimetamp = (dtStr) => {
    if (!dtStr) return Date.now();
    const y = dtStr.substr(0, 4);
    const m = dtStr.substr(4, 2);
    const d = dtStr.substr(6, 2);
    const date = new Date(y, m - 1, d);
    return date.getTime();
};

export { convertDateToTimetamp, convertStrToTimetamp, convertYMDStrToTimetamp };