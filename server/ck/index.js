const axios = require("axios");
const fs = require("fs");

const usernames = [
  "crawfishcafe", "phoprimehtx", "thegreenroomhtx", "jaxonthetracks", "johnnyritashtx",
  "longweekendhtx", "btweensandwichco", "bayoubutchers", "stuffedbellyhtx", "localfoodstexas",
  "commonbondbakery", "tinyboxwoods", "boomtowncoffee", "blacksmithhouston", "catalystcoffeehtx",
  "retrospect_coffeebar", "antidotecoffee", "slowpokes_htx", "paperco_coffee", "day6coffee",
  "brass_tacks_htx", "verbena_coffee", "blendincoffeeclub", "luciacoffeehouston", "tenfoldcoffee",
  "unclebeanscoffee", "fixhouston", "theorycoffeehouse", "the_skyliner_htx", "wildcoffeehtx",
  "cafenandotx", "sweettips_htx", "tout_suite", "sweetteathtx", "empirecafehtx",
  "agora_houston", "southsidehtx", "doubletroublehtx", "campesinocoffeehouse", "minutecoffeehtx",
  "sipandstrut", "vibrant_htx", "ostiahouston", "koffeteria", "lucecoffeeroasters",
  "segundocoffeelab", "sundaypress", "thecoffeehousehtx", "thirdplacehtx", "casaemahtx"
];

const existing = [];

const client = axios.create({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "en-US,en;q=0.9"
  },
  timeout: 15000
});

async function checkUsername(username) {

  const url = "https://www.instagram.com/" + username + "/";

  try {

    const res = await client.get(url);
    const html = res.data;

    const profileCheck = html.includes('og:type" content="profile"');
    const errorCheck = html.includes("Sorry, this page isn't available");

    if (profileCheck && !errorCheck) {

      console.log(username + " exists");
      existing.push(username);

    } else if (errorCheck) {

      console.log(username + " available");

    } else {

      console.log(username + " unclear");

    }

  } catch {

    console.log(username + " request_failed");

  }

}

async function run() {

  for (const username of usernames) {

    await checkUsername(username);

    await new Promise(r => setTimeout(r, 2000));

  }

  fs.writeFileSync("existing_usernames.txt", existing.join("\n"));

  console.log("existing usernames saved:", existing.length);

}

run();