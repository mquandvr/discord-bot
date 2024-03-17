const convertDateToTimetamp = (dtStr) => {
    const [d, m, y] = dtStr.split(/-|\//); // splits "26-02-2012" or "26/02/2012"
    const date = new Date(y, m - 1, d);
    return date.getTime();
}

module.exports = { convertDateToTimetamp };