const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const axios = require("axios");

const EXCLUSIONS = ["SSHY", "VUSC"];

const CLIENTS = {
  DIV_TRACKER: Symbol("divTracker"),
  STOCK_EVENTS: Symbol("stockEvents"),
};

const ISIN_CACHE = {};

const HEADER_FORMAT = {
  [CLIENTS.DIV_TRACKER]: [
    { id: "Ticker", title: "Ticker" },
    { id: "Quantity", title: "Quantity" },
    { id: "Cost Per Share", title: "Cost Per Share" },
    { id: "Date", title: "Date" },
    { id: "Commission", title: "Commission" },
  ],
  [CLIENTS.STOCK_EVENTS]: [
    { id: "Symbol", title: "Symbol" },
    { id: "Date", title: "Date" },
    { id: "Quantity", title: "Quantity" },
    { id: "Price", title: "Price" },
  ],
};

const TICKER_POSTFIX = {
  [CLIENTS.DIV_TRACKER]: {
    default: "GB",
    PA: "FR",
    MC: "ES",
  },
  [CLIENTS.STOCK_EVENTS]: {
    default: "LSE",
    PA: "PA",
    MC: "MC",
  },
};

const DATA_PROVIDER = {
  [CLIENTS.DIV_TRACKER]: async (row) => {
    const { ticker, cost, quantity, date } = await commonData(
      row,
      CLIENTS.DIV_TRACKER
    );
    const conversionFee = row["Currency conversion fee (GBP)"]
      ? row["Currency conversion fee (GBP)"]
      : 0;
    const stampDuty = row["Stamp duty reserve tax"]
      ? row["Stamp duty reserve tax"]
      : 0;
    return {
      Ticker: ticker,
      Quantity: quantity,
      "Cost Per Share": cost,
      Date: date,
      Commission: conversionFee + stampDuty,
    };
  },

  [CLIENTS.STOCK_EVENTS]: async (row) => {
    const { ticker, cost, quantity, date } = await commonData(
      row,
      CLIENTS.STOCK_EVENTS
    );
    return {
      Symbol: ticker,
      Date: date,
      Quantity: quantity,
      Price: cost,
    };
  },
};

const mapCsvData = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.trim().split("\n");

    if (lines.length < 2) {
      throw new Error(
        "CSV file must have at least two lines: headers and data."
      );
    }

    const headers = lines[0].split(",");
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const rowData = {};

      if (values.length !== headers.length) {
        throw new Error(
          "Number of values does not match the number of headers."
        );
      }

      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      data.push(rowData);
    }
    return data;
  } catch (error) {
    console.error("Error reading and processing CSV file:", error);
  }
};

const commonData = async (row, client) => {
  let cost = parseFloat(row["Price / share"]);
  if (row["Currency (Price / share)"] === "GBX") {
    cost = cost / 100;
  }
  const ticker = row.Ticker;
  const ISIN = row.ISIN;
  const currency = row["Currency (Price / share)"];
  let quantity = row["No. of shares"];
  if (row.Action !== "Market buy") {
    quantity *= -1;
  }
  return {
    ticker: await getTicker(client, currency, ISIN, ticker),
    cost: cost.toString(),
    quantity,
    date: row.Time.split(" ")[0],
  };
};

const convertTrading212ToDIVTracker = async (
  inputFilePath,
  outputFilePath,
  client
) => {
  const outputCSV = createCsvWriter({
    path: outputFilePath,
    header: HEADER_FORMAT[client],
  });

  let count = 0;

  const records = [];

  const transactions = mapCsvData(inputFilePath);

  for (let i = 0; i < transactions.length; i += 1) {
    const row = transactions[i];
    console.log(`START ${i} ${row.ISIN}`);
    const out = await DATA_PROVIDER[client](row);
    records.push(out);
    console.log(`END : ${i} ${row.ISIN}`);
    count += 1;
  }

  outputCSV.writeRecords(records).then(() => {
    console.log("✅ Conversion complete.");
    console.table({
      Trades: count,
    });
  });
};

const searchYahooFinance = async (query) => {
  const yahooFinanceUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&lang=en-GB&region=GB&quotesCount=6&newsCount=4&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query
  &multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true
  &enableEnhancedTrivialQuery=true&enableCulturalAssets=true&enableLogoUrl=true`;

  try {
    const response = await axios.get(yahooFinanceUrl);

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = response.data.quotes;
    return { quote: data[0] };
  } catch (error) {
    console.error("Request error:", error);
  }
};

const getTicker = async (client, currency, ISIN, ticker) => {
  if (currency === "USD") {
    return ticker;
  }
  if (ISIN_CACHE[ISIN]) {
    return ISIN_CACHE[ISIN];
  }

  if (EXCLUSIONS.includes(ticker)) {
    return `${ticker}.${TICKER_POSTFIX[client]["default"]}`;
  }

  try {
    const { quote } = await searchYahooFinance(ISIN);
    const { symbol } = quote;

    let updatedSymbol;
    if (symbol.includes(".")) {
      const [tik, p] = symbol.split(".");

      let posix;

      if (TICKER_POSTFIX[client][p]) {
        posix = TICKER_POSTFIX[client][p];
      } else {
        posix = TICKER_POSTFIX[client]["default"];
      }

      updatedSymbol = `${tik}.${posix}`;
    } else {
      updatedSymbol = symbol;
    }
    ISIN_CACHE[ISIN] = updatedSymbol;
    return updatedSymbol;
  } catch (e) {
    return `${ticker}.${TICKER_POSTFIX[client]["default"]}`;
  }
};

module.exports = { convertTrading212ToDIVTracker };
