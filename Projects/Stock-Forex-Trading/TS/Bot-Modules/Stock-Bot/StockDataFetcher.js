exports.newStockForexTradingBotModulesStockDataFetcher = function (processIndex) {

    const MODULE_NAME = "Stock Data Fetcher";
    const CANDLES_FOLDER_NAME = "Candles/One-Min";
    const VOLUMES_FOLDER_NAME = "Volumes/One-Min";
    const OHLCVS_FOLDER_NAME = "OHLCVs/One-Min";

    let thisObject = {
        initialize: initialize,
        start: start,
        finalize: finalize
    };

    let fileStorage = TS.projects.foundations.taskModules.fileStorage.newFileStorage(processIndex);
    let statusDependencies;

    let MAX_OHLCVs_PER_EXECUTION = 10000000;

    // Stock symbol from configuration
    let symbol;
    let exchangeConfig;
    let dataProvider;
    let apiKey;

    // Supported data providers
    const DATA_PROVIDERS = {
        YAHOO: 'yahoo',
        ALPHA_VANTAGE: 'alpha-vantage',
        POLYGON: 'polygon'
    };

    return thisObject;

    function initialize(pStatusDependencies, callBackFunction) {
        try {
            statusDependencies = pStatusDependencies;

            // Get exchange configuration
            exchangeConfig = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.parentNode.parentNode.config;

            // Get symbol from market configuration
            symbol = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.config.codeName;

            // Get data provider (default to Yahoo Finance - free)
            dataProvider = exchangeConfig.dataProvider || DATA_PROVIDERS.YAHOO;
            apiKey = exchangeConfig.apiKey || '';

            SA.logger.info(MODULE_NAME + ' -> initialize -> Symbol: ' + symbol);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Data Provider: ' + dataProvider);

            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE);

        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> initialize -> err = ' + err.stack);
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }

    function finalize() {
        fileStorage = undefined;
        statusDependencies = undefined;
    }

    async function start(callBackFunction) {
        try {
            let thisReport;
            let since;
            let initialProcessTimestamp;
            let beginingOfMarket;
            let lastFile;
            let uiStartDate = new Date(TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.config.startDate);

            // Get status report
            thisReport = statusDependencies.reportsByMainUtility.get('Self Reference');

            if (thisReport.file.lastFile !== undefined) {
                lastFile = new Date(thisReport.file.lastFile.valueOf());
                beginingOfMarket = new Date(thisReport.file.beginingOfMarket.valueOf());
            }

            if (lastFile !== undefined) {
                since = lastFile.valueOf();
                initialProcessTimestamp = lastFile.valueOf();
            } else {
                since = uiStartDate.valueOf();
                initialProcessTimestamp = uiStartDate.valueOf();
                beginingOfMarket = new Date(uiStartDate.valueOf());
            }

            SA.logger.info(MODULE_NAME + ' -> start -> Fetching stock data for ' + symbol + ' since ' + new Date(since).toISOString());

            // Fetch OHLCV data based on provider
            let ohlcvData;

            switch (dataProvider) {
                case DATA_PROVIDERS.YAHOO:
                    ohlcvData = await fetchYahooFinanceData(symbol, since);
                    break;
                case DATA_PROVIDERS.ALPHA_VANTAGE:
                    ohlcvData = await fetchAlphaVantageData(symbol, since, apiKey);
                    break;
                case DATA_PROVIDERS.POLYGON:
                    ohlcvData = await fetchPolygonData(symbol, since, apiKey);
                    break;
                default:
                    ohlcvData = await fetchYahooFinanceData(symbol, since);
            }

            if (ohlcvData === undefined || ohlcvData.length === 0) {
                SA.logger.info(MODULE_NAME + ' -> start -> No new data available');
                callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE);
                return;
            }

            SA.logger.info(MODULE_NAME + ' -> start -> Received ' + ohlcvData.length + ' candles');

            // Process and save the data
            await processOHLCVData(ohlcvData, initialProcessTimestamp, beginingOfMarket);

            // Update status report
            let lastCandle = ohlcvData[ohlcvData.length - 1];
            thisReport.file = {
                lastFile: new Date(lastCandle[0]),
                beginingOfMarket: beginingOfMarket
            };
            thisReport.save(onSaveComplete);

            function onSaveComplete(err) {
                if (err.result !== TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE.result) {
                    callBackFunction(err);
                    return;
                }
                callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE);
            }

        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> start -> err = ' + err.stack);
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }

    async function fetchYahooFinanceData(ticker, since) {
        /*
        Yahoo Finance provides free historical stock data.
        Using the unofficial API endpoint.
        */
        try {
            const https = SA.nodeModules.https;

            // Extract base ticker (remove /USD suffix if present)
            let baseSymbol = ticker.split('/')[0];

            let period1 = Math.floor(since / 1000);
            let period2 = Math.floor(Date.now() / 1000);

            // Yahoo Finance API endpoint
            let url = `https://query1.finance.yahoo.com/v8/finance/chart/${baseSymbol}?period1=${period1}&period2=${period2}&interval=1m&includePrePost=true`;

            return new Promise((resolve, reject) => {
                https.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data);
                            let ohlcvArray = [];

                            if (json.chart && json.chart.result && json.chart.result[0]) {
                                let result = json.chart.result[0];
                                let timestamps = result.timestamp || [];
                                let quote = result.indicators.quote[0];

                                for (let i = 0; i < timestamps.length; i++) {
                                    if (quote.open[i] !== null && quote.close[i] !== null) {
                                        ohlcvArray.push([
                                            timestamps[i] * 1000,  // timestamp in ms
                                            quote.open[i],
                                            quote.high[i],
                                            quote.low[i],
                                            quote.close[i],
                                            quote.volume[i] || 0
                                        ]);
                                    }
                                }
                            }
                            resolve(ohlcvArray);
                        } catch (parseErr) {
                            SA.logger.warn(MODULE_NAME + ' -> fetchYahooFinanceData -> Parse error: ' + parseErr.message);
                            resolve([]);
                        }
                    });
                }).on('error', (err) => {
                    SA.logger.error(MODULE_NAME + ' -> fetchYahooFinanceData -> Error: ' + err.message);
                    resolve([]);
                });
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> fetchYahooFinanceData -> err = ' + err.stack);
            return [];
        }
    }

    async function fetchAlphaVantageData(ticker, since, apiKey) {
        /*
        Alpha Vantage provides free stock data with an API key.
        Free tier: 5 calls/minute, 500 calls/day
        */
        try {
            const https = SA.nodeModules.https;

            let baseSymbol = ticker.split('/')[0];

            // Using TIME_SERIES_INTRADAY for 1-minute data
            let url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${baseSymbol}&interval=1min&outputsize=full&apikey=${apiKey}`;

            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data);
                            let ohlcvArray = [];

                            let timeSeries = json['Time Series (1min)'];
                            if (timeSeries) {
                                for (let timestamp in timeSeries) {
                                    let candle = timeSeries[timestamp];
                                    let ts = new Date(timestamp).valueOf();

                                    if (ts >= since) {
                                        ohlcvArray.push([
                                            ts,
                                            parseFloat(candle['1. open']),
                                            parseFloat(candle['2. high']),
                                            parseFloat(candle['3. low']),
                                            parseFloat(candle['4. close']),
                                            parseInt(candle['5. volume'])
                                        ]);
                                    }
                                }
                                // Sort by timestamp ascending
                                ohlcvArray.sort((a, b) => a[0] - b[0]);
                            }
                            resolve(ohlcvArray);
                        } catch (parseErr) {
                            SA.logger.warn(MODULE_NAME + ' -> fetchAlphaVantageData -> Parse error: ' + parseErr.message);
                            resolve([]);
                        }
                    });
                }).on('error', (err) => {
                    SA.logger.error(MODULE_NAME + ' -> fetchAlphaVantageData -> Error: ' + err.message);
                    resolve([]);
                });
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> fetchAlphaVantageData -> err = ' + err.stack);
            return [];
        }
    }

    async function fetchPolygonData(ticker, since, apiKey) {
        /*
        Polygon.io provides stock market data.
        Requires API key.
        */
        try {
            const https = SA.nodeModules.https;

            let baseSymbol = ticker.split('/')[0];
            let fromDate = new Date(since).toISOString().split('T')[0];
            let toDate = new Date().toISOString().split('T')[0];

            let url = `https://api.polygon.io/v2/aggs/ticker/${baseSymbol}/range/1/minute/${fromDate}/${toDate}?apiKey=${apiKey}&limit=50000`;

            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data);
                            let ohlcvArray = [];

                            if (json.results) {
                                for (let bar of json.results) {
                                    if (bar.t >= since) {
                                        ohlcvArray.push([
                                            bar.t,  // timestamp in ms
                                            bar.o,  // open
                                            bar.h,  // high
                                            bar.l,  // low
                                            bar.c,  // close
                                            bar.v   // volume
                                        ]);
                                    }
                                }
                            }
                            resolve(ohlcvArray);
                        } catch (parseErr) {
                            SA.logger.warn(MODULE_NAME + ' -> fetchPolygonData -> Parse error: ' + parseErr.message);
                            resolve([]);
                        }
                    });
                }).on('error', (err) => {
                    SA.logger.error(MODULE_NAME + ' -> fetchPolygonData -> Error: ' + err.message);
                    resolve([]);
                });
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> fetchPolygonData -> err = ' + err.stack);
            return [];
        }
    }

    async function processOHLCVData(ohlcvData, initialProcessTimestamp, beginingOfMarket) {
        /*
        Process the OHLCV data into daily files following Superalgos format.
        */
        try {
            // Group data by day
            let dailyData = {};

            for (let candle of ohlcvData) {
                let timestamp = candle[0];
                let date = new Date(timestamp);
                let year = date.getUTCFullYear();
                let month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                let day = date.getUTCDate().toString().padStart(2, '0');
                let dayKey = `${year}/${month}/${day}`;

                if (!dailyData[dayKey]) {
                    dailyData[dayKey] = {
                        candles: [],
                        volumes: [],
                        ohlcvs: []
                    };
                }

                // Candle format: [timestamp, open, close, min, max]
                dailyData[dayKey].candles.push([
                    candle[0],  // timestamp
                    candle[1],  // open
                    candle[4],  // close
                    candle[3],  // min (low)
                    candle[2]   // max (high)
                ]);

                // Volume format: [timestamp, volume]
                dailyData[dayKey].volumes.push([
                    candle[0],
                    candle[5]
                ]);

                // OHLCV format: [timestamp, open, high, low, close, volume]
                dailyData[dayKey].ohlcvs.push(candle);
            }

            // Save each day's data
            for (let dayKey in dailyData) {
                let data = dailyData[dayKey];

                // Save candles
                let candlesFilePath = CANDLES_FOLDER_NAME + '/' + dayKey + '/Data.json';
                await saveFile(candlesFilePath, data.candles);

                // Save volumes
                let volumesFilePath = VOLUMES_FOLDER_NAME + '/' + dayKey + '/Data.json';
                await saveFile(volumesFilePath, data.volumes);

                // Save OHLCVs
                let ohlcvsFilePath = OHLCVS_FOLDER_NAME + '/' + dayKey + '/Data.json';
                await saveFile(ohlcvsFilePath, data.ohlcvs);
            }

            SA.logger.info(MODULE_NAME + ' -> processOHLCVData -> Saved data for ' + Object.keys(dailyData).length + ' days');

        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> processOHLCVData -> err = ' + err.stack);
            throw err;
        }
    }

    async function saveFile(filePath, data) {
        return new Promise((resolve, reject) => {
            let fileContent = JSON.stringify(data);
            fileStorage.createTextFile(filePath, fileContent, (err) => {
                if (err && err.result !== TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE.result) {
                    SA.logger.error(MODULE_NAME + ' -> saveFile -> Error saving ' + filePath);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};
