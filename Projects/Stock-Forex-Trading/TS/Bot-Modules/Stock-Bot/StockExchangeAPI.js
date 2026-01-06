exports.newStockForexTradingBotModulesStockExchangeAPI = function (processIndex) {

    const MODULE_NAME = "Stock Exchange API";

    let thisObject = {
        initialize: initialize,
        finalize: finalize,
        getOrder: getOrder,
        createOrder: createOrder,
        cancelOrder: cancelOrder,
        getPositions: getPositions,
        getAccountInfo: getAccountInfo
    };

    let exchangeConfig;
    let broker;
    let apiKey;
    let apiSecret;
    let paperTrading;

    // Supported stock brokers
    const STOCK_BROKERS = {
        ALPACA: 'alpaca',
        INTERACTIVE_BROKERS: 'interactive-brokers',
        TD_AMERITRADE: 'td-ameritrade',
        TRADIER: 'tradier'
    };

    return thisObject;

    function initialize(callBackFunction) {
        try {
            // Get exchange configuration from task node hierarchy
            exchangeConfig = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.parentNode.parentNode.config;

            broker = exchangeConfig.codeName || STOCK_BROKERS.ALPACA;
            apiKey = exchangeConfig.apiKey || '';
            apiSecret = exchangeConfig.apiSecret || '';
            paperTrading = exchangeConfig.paperTrading !== false;

            SA.logger.info(MODULE_NAME + ' -> initialize -> Broker: ' + broker);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Paper Trading: ' + paperTrading);

            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE);

        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> initialize -> err = ' + err.stack);
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }

    function finalize() {
        exchangeConfig = undefined;
    }

    async function createOrder(symbol, type, side, amount, price, params) {
        /*
        Create a new order on the stock exchange.

        Parameters:
        - symbol: Stock ticker (e.g., "AAPL")
        - type: "market" or "limit"
        - side: "buy" or "sell"
        - amount: Number of shares
        - price: Limit price (for limit orders)
        - params: Additional parameters (stop_loss, take_profit, etc.)
        */
        try {
            switch (broker.toLowerCase()) {
                case STOCK_BROKERS.ALPACA:
                    return await createAlpacaOrder(symbol, type, side, amount, price, params);
                case STOCK_BROKERS.TRADIER:
                    return await createTradierOrder(symbol, type, side, amount, price, params);
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
        Get order details by ID.
        */
        try {
            switch (broker.toLowerCase()) {
                case STOCK_BROKERS.ALPACA:
                    return await getAlpacaOrder(orderId);
                case STOCK_BROKERS.TRADIER:
                    return await getTradierOrder(orderId);
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
                case STOCK_BROKERS.ALPACA:
                    return await cancelAlpacaOrder(orderId);
                case STOCK_BROKERS.TRADIER:
                    return await cancelTradierOrder(orderId);
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
                case STOCK_BROKERS.ALPACA:
                    return await getAlpacaPositions();
                case STOCK_BROKERS.TRADIER:
                    return await getTradierPositions();
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
        Get account information including balance, buying power, etc.
        */
        try {
            switch (broker.toLowerCase()) {
                case STOCK_BROKERS.ALPACA:
                    return await getAlpacaAccount();
                case STOCK_BROKERS.TRADIER:
                    return await getTradierAccount();
                default:
                    throw new Error('Unsupported broker: ' + broker);
            }
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> getAccountInfo -> err = ' + err.stack);
            throw err;
        }
    }

    // ==================== ALPACA API Implementation ====================

    async function createAlpacaOrder(symbol, type, side, amount, price, params) {
        const https = SA.nodeModules.https;

        // Alpaca API endpoints
        let hostname = paperTrading ? 'paper-api.alpaca.markets' : 'api.alpaca.markets';

        let orderData = {
            symbol: symbol.split('/')[0],  // Remove /USD suffix
            qty: amount.toString(),
            side: side.toLowerCase(),
            type: type.toLowerCase(),
            time_in_force: params.timeInForce || 'day'
        };

        if (type.toLowerCase() === 'limit') {
            orderData.limit_price = price.toString();
        }

        if (params.stopLoss) {
            orderData.stop_loss = { stop_price: params.stopLoss.toString() };
        }

        if (params.takeProfit) {
            orderData.take_profit = { limit_price: params.takeProfit.toString() };
        }

        return new Promise((resolve, reject) => {
            let postData = JSON.stringify(orderData);

            let options = {
                hostname: hostname,
                path: '/v2/orders',
                method: 'POST',
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': apiSecret,
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
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({
                                id: json.id,
                                symbol: json.symbol,
                                side: json.side,
                                type: json.type,
                                qty: parseFloat(json.qty),
                                price: json.limit_price ? parseFloat(json.limit_price) : null,
                                status: json.status,
                                createdAt: json.created_at
                            });
                        } else {
                            reject(new Error(json.message || 'Order creation failed'));
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

    async function getAlpacaOrder(orderId) {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'paper-api.alpaca.markets' : 'api.alpaca.markets';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v2/orders/${orderId}`,
                method: 'GET',
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': apiSecret
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            id: json.id,
                            symbol: json.symbol,
                            side: json.side,
                            type: json.type,
                            qty: parseFloat(json.qty),
                            filledQty: parseFloat(json.filled_qty || 0),
                            price: json.limit_price ? parseFloat(json.limit_price) : null,
                            filledPrice: json.filled_avg_price ? parseFloat(json.filled_avg_price) : null,
                            status: json.status,
                            createdAt: json.created_at,
                            filledAt: json.filled_at
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function cancelAlpacaOrder(orderId) {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'paper-api.alpaca.markets' : 'api.alpaca.markets';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v2/orders/${orderId}`,
                method: 'DELETE',
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': apiSecret
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
                            reject(new Error(json.message || 'Cancel failed'));
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

    async function getAlpacaPositions() {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'paper-api.alpaca.markets' : 'api.alpaca.markets';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: '/v2/positions',
                method: 'GET',
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': apiSecret
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let positions = json.map(p => ({
                            symbol: p.symbol,
                            qty: parseFloat(p.qty),
                            side: parseFloat(p.qty) > 0 ? 'long' : 'short',
                            avgPrice: parseFloat(p.avg_entry_price),
                            marketValue: parseFloat(p.market_value),
                            unrealizedPL: parseFloat(p.unrealized_pl),
                            unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100
                        }));
                        resolve(positions);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getAlpacaAccount() {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'paper-api.alpaca.markets' : 'api.alpaca.markets';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: '/v2/account',
                method: 'GET',
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': apiSecret
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            id: json.id,
                            status: json.status,
                            currency: json.currency,
                            cash: parseFloat(json.cash),
                            portfolioValue: parseFloat(json.portfolio_value),
                            buyingPower: parseFloat(json.buying_power),
                            daytradeCount: json.daytrade_count,
                            patternDayTrader: json.pattern_day_trader
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    // ==================== TRADIER API Implementation ====================

    async function createTradierOrder(symbol, type, side, amount, price, params) {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'sandbox.tradier.com' : 'api.tradier.com';
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let formData = new URLSearchParams({
                class: 'equity',
                symbol: symbol.split('/')[0],
                duration: params.timeInForce || 'day',
                side: side.toLowerCase(),
                quantity: amount.toString(),
                type: type.toLowerCase()
            });

            if (type.toLowerCase() === 'limit') {
                formData.append('price', price.toString());
            }

            let options = {
                hostname: hostname,
                path: `/v1/accounts/${accountId}/orders`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };

            let req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json.order) {
                            resolve({
                                id: json.order.id.toString(),
                                symbol: symbol,
                                side: side,
                                type: type,
                                qty: amount,
                                price: price,
                                status: json.order.status
                            });
                        } else {
                            reject(new Error(json.errors ? json.errors.error : 'Order creation failed'));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            });

            req.on('error', reject);
            req.write(formData.toString());
            req.end();
        });
    }

    async function getTradierOrder(orderId) {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'sandbox.tradier.com' : 'api.tradier.com';
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v1/accounts/${accountId}/orders/${orderId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let order = json.order;
                        resolve({
                            id: order.id.toString(),
                            symbol: order.symbol,
                            side: order.side,
                            type: order.type,
                            qty: parseFloat(order.quantity),
                            filledQty: parseFloat(order.exec_quantity || 0),
                            price: order.price ? parseFloat(order.price) : null,
                            filledPrice: order.avg_fill_price ? parseFloat(order.avg_fill_price) : null,
                            status: order.status
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function cancelTradierOrder(orderId) {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'sandbox.tradier.com' : 'api.tradier.com';
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v1/accounts/${accountId}/orders/${orderId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            };

            let req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, orderId: orderId });
                    } else {
                        reject(new Error('Cancel failed'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    async function getTradierPositions() {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'sandbox.tradier.com' : 'api.tradier.com';
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v1/accounts/${accountId}/positions`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let positions = [];
                        if (json.positions && json.positions.position) {
                            let posArray = Array.isArray(json.positions.position)
                                ? json.positions.position
                                : [json.positions.position];

                            positions = posArray.map(p => ({
                                symbol: p.symbol,
                                qty: parseFloat(p.quantity),
                                side: parseFloat(p.quantity) > 0 ? 'long' : 'short',
                                avgPrice: parseFloat(p.cost_basis) / parseFloat(p.quantity),
                                marketValue: parseFloat(p.quantity) * parseFloat(p.close_price || p.cost_basis / p.quantity)
                            }));
                        }
                        resolve(positions);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getTradierAccount() {
        const https = SA.nodeModules.https;
        let hostname = paperTrading ? 'sandbox.tradier.com' : 'api.tradier.com';
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v1/accounts/${accountId}/balances`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let balances = json.balances;
                        resolve({
                            id: accountId,
                            status: 'active',
                            currency: 'USD',
                            cash: parseFloat(balances.cash.cash_available || balances.total_cash),
                            portfolioValue: parseFloat(balances.total_equity),
                            buyingPower: parseFloat(balances.margin ? balances.margin.stock_buying_power : balances.total_cash)
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }
};
