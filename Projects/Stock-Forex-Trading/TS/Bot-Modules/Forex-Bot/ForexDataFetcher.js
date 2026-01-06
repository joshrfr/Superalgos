exports.newStockForexTradingBotModulesForexDataFetcher = function (processIndex) {

    const MODULE_NAME = "Forex Data Fetcher";
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

    // Forex pair symbol from configuration
    let symbol;
    let exchangeConfig;
    let broker;
    let apiKey;
    let accountId;
    let practice;

    // Supported forex brokers/data providers
    const FOREX_PROVIDERS = {
        OANDA: 'oanda',
        FOREX_COM: 'forex-com',
        FXCM: 'fxcm',
        TRADINGVIEW: 'tradingview',
        ALPHA_VANTAGE: 'alpha-vantage',
        TWELVE_DATA: 'twelve-data'
    };

    // Common forex pairs including XAU/USD
    const FOREX_INSTRUMENTS = {
        'XAU/USD': { oanda: 'XAU_USD', type: 'precious-metal', pipSize: 0.01 },
        'XAG/USD': { oanda: 'XAG_USD', type: 'precious-metal', pipSize: 0.001 },
        'EUR/USD': { oanda: 'EUR_USD', type: 'currency', pipSize: 0.0001 },
        'GBP/USD': { oanda: 'GBP_USD', type: 'currency', pipSize: 0.0001 },
        'USD/JPY': { oanda: 'USD_JPY', type: 'currency', pipSize: 0.01 },
        'USD/CHF': { oanda: 'USD_CHF', type: 'currency', pipSize: 0.0001 },
        'AUD/USD': { oanda: 'AUD_USD', type: 'currency', pipSize: 0.0001 },
        'NZD/USD': { oanda: 'NZD_USD', type: 'currency', pipSize: 0.0001 },
        'EUR/GBP': { oanda: 'EUR_GBP', type: 'currency', pipSize: 0.0001 },
        'EUR/JPY': { oanda: 'EUR_JPY', type: 'currency', pipSize: 0.01 },
        'GBP/JPY': { oanda: 'GBP_JPY', type: 'currency', pipSize: 0.01 },
        'USD/CAD': { oanda: 'USD_CAD', type: 'currency', pipSize: 0.0001 }
    };

    return thisObject;

    function initialize(pStatusDependencies, callBackFunction) {
        try {
            statusDependencies = pStatusDependencies;

            // Get exchange configuration
            exchangeConfig = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.parentNode.parentNode.config;

            // Get symbol from market configuration (e.g., XAU/USD)
            symbol = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.config.codeName;

            // Get broker/data provider
            broker = exchangeConfig.codeName || FOREX_PROVIDERS.OANDA;
            apiKey = exchangeConfig.apiKey || '';
            accountId = exchangeConfig.accountId || '';
            practice = exchangeConfig.practice !== false;

            SA.logger.info(MODULE_NAME + ' -> initialize -> Symbol: ' + symbol);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Broker: ' + broker);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Practice Mode: ' + practice);

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

            SA.logger.info(MODULE_NAME + ' -> start -> Fetching forex data for ' + symbol + ' since ' + new Date(since).toISOString());

            // Fetch OHLCV data based on broker
            let ohlcvData;

            switch (broker.toLowerCase()) {
                case FOREX_PROVIDERS.OANDA:
                    ohlcvData = await fetchOandaData(symbol, since, apiKey, accountId, practice);
                    break;
                case FOREX_PROVIDERS.ALPHA_VANTAGE:
                    ohlcvData = await fetchAlphaVantageForex(symbol, since, apiKey);
                    break;
                case FOREX_PROVIDERS.TWELVE_DATA:
                    ohlcvData = await fetchTwelveDataForex(symbol, since, apiKey);
                    break;
                default:
                    // Default to free Twelve Data for XAU/USD
                    ohlcvData = await fetchTwelveDataForex(symbol, since, apiKey);
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

    async function fetchOandaData(pair, since, apiKey, accountId, practice) {
        /*
        OANDA v20 REST API for forex and precious metals data.
        Supports XAU/USD (Gold), XAG/USD (Silver), and all major forex pairs.
        */
        try {
            const https = SA.nodeModules.https;

            // Convert pair format (XAU/USD -> XAU_USD)
            let instrument = pair.replace('/', '_');
            if (FOREX_INSTRUMENTS[pair]) {
                instrument = FOREX_INSTRUMENTS[pair].oanda;
            }

            // OANDA API endpoints
            let hostname = practice ? 'api-fxpractice.oanda.com' : 'api-fxtrade.oanda.com';

            let fromTime = new Date(since).toISOString();
            let path = `/v3/instruments/${instrument}/candles?granularity=M1&from=${fromTime}&count=5000`;

            return new Promise((resolve, reject) => {
                let options = {
                    hostname: hostname,
                    path: path,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                };

                let req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data);
                            let ohlcvArray = [];

                            if (json.candles) {
                                for (let candle of json.candles) {
                                    if (candle.complete) {
                                        let timestamp = new Date(candle.time).valueOf();
                                        let mid = candle.mid;

                                        ohlcvArray.push([
                                            timestamp,
                                            parseFloat(mid.o),  // open
                                            parseFloat(mid.h),  // high
                                            parseFloat(mid.l),  // low
                                            parseFloat(mid.c),  // close
                                            candle.volume || 0  // volume (tick volume for forex)
                                        ]);
                                    }
                                }
                            }
                            resolve(ohlcvArray);
                        } catch (parseErr) {
                            SA.logger.warn(MODULE_NAME + ' -> fetchOandaData -> Parse error: ' + parseErr.message);
                            resolve([]);
                        }
                    });
                });

                req.on('error', (err) => {
                    SA.logger.error(MODULE_NAME + ' -> fetchOandaData -> Error: ' + err.message);
                    resolve([]);
                });

                req.end();
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> fetchOandaData -> err = ' + err.stack);
            return [];
        }
    }

    async function fetchAlphaVantageForex(pair, since, apiKey) {
        /*
        Alpha Vantage FX API for forex data.
        Use FX_INTRADAY for currency pairs.
        */
        try {
            const https = SA.nodeModules.https;

            // Parse pair (XAU/USD -> from_currency=XAU, to_currency=USD)
            let [fromCurrency, toCurrency] = pair.split('/');

            // For precious metals, use different endpoint
            let endpoint = 'FX_INTRADAY';
            let url = `https://www.alphavantage.co/query?function=${endpoint}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&interval=1min&outputsize=full&apikey=${apiKey}`;

            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data);
                            let ohlcvArray = [];

                            let timeSeries = json['Time Series FX (Intraday)'] || json['Time Series (1min)'];
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
                                            0  // Forex has no real volume
                                        ]);
                                    }
                                }
                                // Sort by timestamp ascending
                                ohlcvArray.sort((a, b) => a[0] - b[0]);
                            }
                            resolve(ohlcvArray);
                        } catch (parseErr) {
                            SA.logger.warn(MODULE_NAME + ' -> fetchAlphaVantageForex -> Parse error: ' + parseErr.message);
                            resolve([]);
                        }
                    });
                }).on('error', (err) => {
                    SA.logger.error(MODULE_NAME + ' -> fetchAlphaVantageForex -> Error: ' + err.message);
                    resolve([]);
                });
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> fetchAlphaVantageForex -> err = ' + err.stack);
            return [];
        }
    }

    async function fetchTwelveDataForex(pair, since, apiKey) {
        /*
        Twelve Data API - supports forex and commodities including XAU/USD.
        Free tier available with rate limits.
        */
        try {
            const https = SA.nodeModules.https;

            // Convert XAU/USD to XAUUSD format for Twelve Data
            let symbol = pair.replace('/', '');

            let fromDate = new Date(since).toISOString().split('.')[0];
            let url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&start_date=${fromDate}&outputsize=5000&apikey=${apiKey}`;

            return new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data);
                            let ohlcvArray = [];

                            if (json.values) {
                                for (let candle of json.values) {
                                    let timestamp = new Date(candle.datetime).valueOf();

                                    if (timestamp >= since) {
                                        ohlcvArray.push([
                                            timestamp,
                                            parseFloat(candle.open),
                                            parseFloat(candle.high),
                                            parseFloat(candle.low),
                                            parseFloat(candle.close),
                                            0  // Volume (forex tick volume if available)
                                        ]);
                                    }
                                }
                                // Sort by timestamp ascending
                                ohlcvArray.sort((a, b) => a[0] - b[0]);
                            }
                            resolve(ohlcvArray);
                        } catch (parseErr) {
                            SA.logger.warn(MODULE_NAME + ' -> fetchTwelveDataForex -> Parse error: ' + parseErr.message);
                            resolve([]);
                        }
                    });
                }).on('error', (err) => {
                    SA.logger.error(MODULE_NAME + ' -> fetchTwelveDataForex -> Error: ' + err.message);
                    resolve([]);
                });
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> fetchTwelveDataForex -> err = ' + err.stack);
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
