const convertDateToTimetamp = (dtStr) => {
    if (!dtStr) return null;
    // const [d, m, y] = dtStr.split(/-|\//); // splits "26-02-2012" or "26/02/2012"
    // const date = new Date(y, m - 1, d);
    const date = new Date(dtStr);
    return date.getTime();
}

const convertStrToTimetamp = (dtStr) => {
    if (!dtStr) return null;
    const [datePart, timePart] = dtStr.split(' ');
    const [y, m, d] = datePart.split(/-|\//); // splits "26-02-2012" or "26/02/2012"
    const date = new Date(y, m - 1, d);
    // const date = new Date(dtStr);
    return date.getTime();
}

module.exports = { convertDateToTimetamp, convertStrToTimetamp };