function getAccountRegion(uid) {
  const region = uid.toString().slice(0, 1);
  switch (region) {
    case "9":
      return `prod_official_cht`;
    case "8":
      return `prod_official_asia`;
    case "7":
      return `prod_official_eur`;
    case "6":
      return `prod_official_usa`;
    default:
      return false;
  }
}

function formattedAccountRegion(region) {
  switch (region) {
    case "prod_official_cht":
      return "TW";
    case "prod_official_asia":
      return "SEA";
    case "prod_official_eur":
      return "EU";
    case "prod_official_usa":
      return "NA";
    default:
      return false;
  }
}

export { getAccountRegion, formattedAccountRegion };
