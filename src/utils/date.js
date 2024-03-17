const convertDateToTimetamp = (dtStr) => {
    if (!dtStr) return null;
    // const [d, m, y] = dtStr.split(/-|\//); // splits "26-02-2012" or "26/02/2012"
    // const date = new Date(y, m - 1, d);
    const date = new Date(dtStr);
    return date.getTime();
}

module.exports = { convertDateToTimetamp };