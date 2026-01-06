exports.newStockForexTradingBotModulesForexExchangeAPI = function (processIndex) {

    const MODULE_NAME = "Forex Exchange API";

    let thisObject = {
        initialize: initialize,
        finalize: finalize,
        getOrder: getOrder,
        createOrder: createOrder,
        cancelOrder: cancelOrder,
        getPositions: getPositions,
        getAccountInfo: getAccountInfo,
        getSpread: getSpread
    };

    let exchangeConfig;
    let broker;
    let apiKey;
    let accountId;
    let practice;

    // Supported forex brokers
    const FOREX_BROKERS = {
        OANDA: 'oanda',
        FOREX_COM: 'forex-com',
        FXCM: 'fxcm',
        IG: 'ig'
    };

    // Instrument mappings for different brokers
    const INSTRUMENT_MAP = {
        'XAU/USD': { oanda: 'XAU_USD', fxcm: 'XAU/USD' },
        'XAG/USD': { oanda: 'XAG_USD', fxcm: 'XAG/USD' },
        'EUR/USD': { oanda: 'EUR_USD', fxcm: 'EUR/USD' },
        'GBP/USD': { oanda: 'GBP_USD', fxcm: 'GBP/USD' },
        'USD/JPY': { oanda: 'USD_JPY', fxcm: 'USD/JPY' },
        'USD/CHF': { oanda: 'USD_CHF', fxcm: 'USD/CHF' },
        'AUD/USD': { oanda: 'AUD_USD', fxcm: 'AUD/USD' },
        'NZD/USD': { oanda: 'NZD_USD', fxcm: 'NZD/USD' }
    };

    return thisObject;

    function initialize(callBackFunction) {
        try {
            // Get exchange configuration from task node hierarchy
            exchangeConfig = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.parentNode.parentNode.config;

            broker = exchangeConfig.codeName || FOREX_BROKERS.OANDA;
            apiKey = exchangeConfig.apiKey || '';
            accountId = exchangeConfig.accountId || '';
            practice = exchangeConfig.practice !== false;

            SA.logger.info(MODULE_NAME + ' -> initialize -> Broker: ' + broker);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Account ID: ' + accountId);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Practice Mode: ' + practice);

            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE);

        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> initialize -> err = ' + err.stack);
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }

    function finalize() {
        exchangeConfig = undefined;
    }

    async function createOrder(instrument, type, side, units, price, params) {
        /*
        Create a new forex order.

        Parameters:
        - instrument: Currency pair (e.g., "XAU/USD", "EUR/USD")
        - type: "market" or "limit" or "stop"
        - side: "buy" or "sell"
        - units: Position size (can be negative for sell)
        - price: Entry price for limit/stop orders
        - params: Additional parameters (stopLoss, takeProfit, trailingStop)
        */
        try {
            switch (broker.toLowerCase()) {
                case FOREX_BROKERS.OANDA:
                    return await createOandaOrder(instrument, type, side, units, price, params);
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> createOrder -> err = ' + err.stack);
            throw err;
        }
    }

    async function getOrder(orderId) {
        /*
        Get order/trade details by ID.
        */
        try {
            switch (broker.toLowerCase()) {
                case FOREX_BROKERS.OANDA:
                    return await getOandaOrder(orderId);
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> getOrder -> err = ' + err.stack);
            throw err;
        }
    }

    async function cancelOrder(orderId) {
        /*
        Cancel an existing order.
        */
        try {
            switch (broker.toLowerCase()) {
                case FOREX_BROKERS.OANDA:
                    return await cancelOandaOrder(orderId);
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> cancelOrder -> err = ' + err.stack);
            throw err;
        }
    }

    async function getPositions() {
        /*
        Get all open positions.
        */
        try {
            switch (broker.toLowerCase()) {
                case FOREX_BROKERS.OANDA:
                    return await getOandaPositions();
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> getPositions -> err = ' + err.stack);
            throw err;
        }
    }

    async function getAccountInfo() {
        /*
        Get account information including balance, margin, etc.
        */
        try {
            switch (broker.toLowerCase()) {
                case FOREX_BROKERS.OANDA:
                    return await getOandaAccount();
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> getAccountInfo -> err = ' + err.stack);
            throw err;
        }
    }

    async function getSpread(instrument) {
        /*
        Get current bid/ask spread for an instrument.
        */
        try {
            switch (broker.toLowerCase()) {
                case FOREX_BROKERS.OANDA:
                    return await getOandaSpread(instrument);
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> getSpread -> err = ' + err.stack);
            throw err;
        }
    }

    // ==================== OANDA v20 API Implementation ====================

    function getOandaInstrument(pair) {
        // Convert XAU/USD to XAU_USD format
        if (INSTRUMENT_MAP[pair] && INSTRUMENT_MAP[pair].oanda) {
            return INSTRUMENT_MAP[pair].oanda;
        }
        return pair.replace('/', '_');
    }

    function getOandaHostname() {
        return practice ? 'api-fxpractice.oanda.com' : 'api-fxtrade.oanda.com';
    }

    async function createOandaOrder(instrument, type, side, units, price, params) {
        const https = SA.nodeModules.https;
        let hostname = getOandaHostname();
        let oandaInstrument = getOandaInstrument(instrument);

        // Adjust units for sell orders (negative)
        let adjustedUnits = side.toLowerCase() === 'sell' ? -Math.abs(units) : Math.abs(units);

        let orderData = {
            order: {
                instrument: oandaInstrument,
                units: adjustedUnits.toString(),
                type: type.toUpperCase(),
                positionFill: 'DEFAULT'
            }
        };

        // Set price for limit/stop orders
        if (type.toLowerCase() === 'limit') {
            orderData.order.price = price.toString();
            orderData.order.type = 'LIMIT';
        } else if (type.toLowerCase() === 'stop') {
            orderData.order.price = price.toString();
            orderData.order.type = 'STOP';
        } else {
            orderData.order.type = 'MARKET';
        }

        // Add stop loss
        if (params && params.stopLoss) {
            orderData.order.stopLossOnFill = {
                price: params.stopLoss.toString()
            };
        }

        // Add take profit
        if (params && params.takeProfit) {
            orderData.order.takeProfitOnFill = {
                price: params.takeProfit.toString()
            };
        }

        // Add trailing stop (in pips distance)
        if (params && params.trailingStop) {
            orderData.order.trailingStopLossOnFill = {
                distance: params.trailingStop.toString()
            };
        }

        return new Promise((resolve, reject) => {
            let postData = JSON.stringify(orderData);

            let options = {
                hostname: hostname,
                path: `/v3/accounts/${accountId}/orders`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            let req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);

                        if (json.orderFillTransaction) {
                            // Market order filled immediately
                            let fill = json.orderFillTransaction;
                            resolve({
                                id: fill.id,
                                tradeId: fill.tradeOpened ? fill.tradeOpened.tradeID : null,
                                instrument: instrument,
                                side: side,
                                units: parseFloat(fill.units),
                                price: parseFloat(fill.price),
                                status: 'FILLED',
                                pl: parseFloat(fill.pl || 0),
                                time: fill.time
                            });
                        } else if (json.orderCreateTransaction) {
                            // Pending order created
                            let order = json.orderCreateTransaction;
                            resolve({
                                id: order.id,
                                instrument: instrument,
                                side: side,
                                units: parseFloat(order.units),
                                price: order.price ? parseFloat(order.price) : null,
                                status: 'PENDING',
                                time: order.time
                            });
                        } else if (json.errorMessage) {
                            reject(new Error(json.errorMessage));
                        } else {
                            reject(new Error('Unknown response format'));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            });

            req.on('error', (err) => reject(err));
            req.write(postData);
            req.end();
        });
    }

    async function getOandaOrder(orderId) {
        const https = SA.nodeModules.https;
        let hostname = getOandaHostname();

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/accounts/${accountId}/orders/${orderId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json.order) {
                            let order = json.order;
                            resolve({
                                id: order.id,
                                instrument: order.instrument.replace('_', '/'),
                                type: order.type,
                                units: parseFloat(order.units),
                                price: order.price ? parseFloat(order.price) : null,
                                status: order.state,
                                createTime: order.createTime,
                                fillingTransactionID: order.fillingTransactionID
                            });
                        } else {
                            reject(new Error('Order not found'));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function cancelOandaOrder(orderId) {
        const https = SA.nodeModules.https;
        let hostname = getOandaHostname();

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/accounts/${accountId}/orders/${orderId}/cancel`,
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            };

            let req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, orderId: orderId });
                    } else {
                        try {
                            let json = JSON.parse(data);
                            reject(new Error(json.errorMessage || 'Cancel failed'));
                        } catch (e) {
                            reject(new Error('Cancel failed with status ' + res.statusCode));
                        }
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    async function getOandaPositions() {
        const https = SA.nodeModules.https;
        let hostname = getOandaHostname();

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/accounts/${accountId}/openPositions`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let positions = [];

                        if (json.positions) {
                            for (let pos of json.positions) {
                                // Long position
                                if (pos.long && parseFloat(pos.long.units) !== 0) {
                                    positions.push({
                                        instrument: pos.instrument.replace('_', '/'),
                                        side: 'long',
                                        units: parseFloat(pos.long.units),
                                        avgPrice: parseFloat(pos.long.averagePrice),
                                        unrealizedPL: parseFloat(pos.long.unrealizedPL),
                                        tradeIDs: pos.long.tradeIDs
                                    });
                                }
                                // Short position
                                if (pos.short && parseFloat(pos.short.units) !== 0) {
                                    positions.push({
                                        instrument: pos.instrument.replace('_', '/'),
                                        side: 'short',
                                        units: Math.abs(parseFloat(pos.short.units)),
                                        avgPrice: parseFloat(pos.short.averagePrice),
                                        unrealizedPL: parseFloat(pos.short.unrealizedPL),
                                        tradeIDs: pos.short.tradeIDs
                                    });
                                }
                            }
                        }
                        resolve(positions);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getOandaAccount() {
        const https = SA.nodeModules.https;
        let hostname = getOandaHostname();

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/accounts/${accountId}/summary`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json.account) {
                            let acc = json.account;
                            resolve({
                                id: acc.id,
                                currency: acc.currency,
                                balance: parseFloat(acc.balance),
                                unrealizedPL: parseFloat(acc.unrealizedPL),
                                realizedPL: parseFloat(acc.pl),
                                marginUsed: parseFloat(acc.marginUsed),
                                marginAvailable: parseFloat(acc.marginAvailable),
                                nav: parseFloat(acc.NAV),
                                marginCloseoutPercent: parseFloat(acc.marginCloseoutPercent),
                                openTradeCount: acc.openTradeCount,
                                openPositionCount: acc.openPositionCount,
                                pendingOrderCount: acc.pendingOrderCount
                            });
                        } else {
                            reject(new Error('Account not found'));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getOandaSpread(instrument) {
        const https = SA.nodeModules.https;
        let hostname = getOandaHostname();
        let oandaInstrument = getOandaInstrument(instrument);

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/accounts/${accountId}/pricing?instruments=${oandaInstrument}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json.prices && json.prices.length > 0) {
                            let price = json.prices[0];
                            let bid = parseFloat(price.bids[0].price);
                            let ask = parseFloat(price.asks[0].price);
                            resolve({
                                instrument: instrument,
                                bid: bid,
                                ask: ask,
                                spread: ask - bid,
                                spreadPips: (ask - bid) * (instrument.includes('JPY') ? 100 : 10000),
                                time: price.time
                            });
                        } else {
                            reject(new Error('Price not available'));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }
};
