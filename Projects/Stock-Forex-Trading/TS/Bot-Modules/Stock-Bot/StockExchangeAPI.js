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
        IBKR: 'ibkr',
        TD_AMERITRADE: 'td-ameritrade',
        TRADIER: 'tradier',
        TRADESTATION: 'tradestation'
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
                case STOCK_BROKERS.INTERACTIVE_BROKERS:
                case STOCK_BROKERS.IBKR:
                    return await createIBKROrder(symbol, type, side, amount, price, params);
                case STOCK_BROKERS.TRADESTATION:
                    return await createTradeStationOrder(symbol, type, side, amount, price, params);
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
                case STOCK_BROKERS.INTERACTIVE_BROKERS:
                case STOCK_BROKERS.IBKR:
                    return await getIBKROrder(orderId);
                case STOCK_BROKERS.TRADESTATION:
                    return await getTradeStationOrder(orderId);
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
                case STOCK_BROKERS.INTERACTIVE_BROKERS:
                case STOCK_BROKERS.IBKR:
                    return await cancelIBKROrder(orderId);
                case STOCK_BROKERS.TRADESTATION:
                    return await cancelTradeStationOrder(orderId);
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
                case STOCK_BROKERS.INTERACTIVE_BROKERS:
                case STOCK_BROKERS.IBKR:
                    return await getIBKRPositions();
                case STOCK_BROKERS.TRADESTATION:
                    return await getTradeStationPositions();
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
                case STOCK_BROKERS.INTERACTIVE_BROKERS:
                case STOCK_BROKERS.IBKR:
                    return await getIBKRAccount();
                case STOCK_BROKERS.TRADESTATION:
                    return await getTradeStationAccount();
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

    // ==================== INTERACTIVE BROKERS (IBKR) API Implementation ====================
    /*
    Interactive Brokers Client Portal API - Best for HFT
    Requires TWS or IB Gateway running locally with API enabled.

    Setup:
    1. Download and install TWS or IB Gateway from IBKR
    2. Enable API access in TWS settings (Edit > Global Configuration > API > Settings)
    3. Set the gateway URL in config (default: https://localhost:5000)

    Config example:
    {
        "codeName": "interactive-brokers",
        "gatewayUrl": "https://localhost:5000",
        "accountId": "YOUR_ACCOUNT_ID",
        "paperTrading": true
    }
    */

    function getIBKRBaseUrl() {
        return exchangeConfig.gatewayUrl || 'https://localhost:5000';
    }

    async function createIBKROrder(symbol, type, side, amount, price, params) {
        const https = SA.nodeModules.https;
        const url = require('url');

        let baseUrl = getIBKRBaseUrl();
        let accountId = exchangeConfig.accountId || '';
        let ticker = symbol.split('/')[0];

        // First, get the contract ID (conid) for the symbol
        let conid = await getIBKRContractId(ticker);

        let orderData = {
            orders: [{
                conid: conid,
                orderType: type.toUpperCase() === 'MARKET' ? 'MKT' : 'LMT',
                side: side.toUpperCase(),
                quantity: amount,
                tif: params.timeInForce || 'DAY'
            }]
        };

        if (type.toUpperCase() === 'LIMIT' || type.toUpperCase() === 'LMT') {
            orderData.orders[0].price = price;
        }

        return new Promise((resolve, reject) => {
            let postData = JSON.stringify(orderData);
            let parsedUrl = new url.URL(`${baseUrl}/v1/api/iserver/account/${accountId}/orders`);

            let options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                rejectUnauthorized: false // IBKR uses self-signed certs locally
            };

            let req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json[0] && json[0].order_id) {
                            resolve({
                                id: json[0].order_id,
                                symbol: ticker,
                                side: side,
                                type: type,
                                qty: amount,
                                price: price,
                                status: json[0].order_status || 'Submitted'
                            });
                        } else if (json.error) {
                            reject(new Error(json.error));
                        } else {
                            // IBKR may require order confirmation
                            resolve({
                                id: 'pending_confirmation',
                                message: json.message || 'Order requires confirmation',
                                replyId: json.id
                            });
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

    async function getIBKRContractId(symbol) {
        const https = SA.nodeModules.https;
        const url = require('url');

        let baseUrl = getIBKRBaseUrl();

        return new Promise((resolve, reject) => {
            let parsedUrl = new url.URL(`${baseUrl}/v1/api/iserver/secdef/search?symbol=${symbol}`);

            let options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                rejectUnauthorized: false
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json[0] && json[0].conid) {
                            resolve(json[0].conid);
                        } else {
                            reject(new Error('Contract not found for symbol: ' + symbol));
                        }
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getIBKROrder(orderId) {
        const https = SA.nodeModules.https;
        const url = require('url');

        let baseUrl = getIBKRBaseUrl();
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let parsedUrl = new url.URL(`${baseUrl}/v1/api/iserver/account/${accountId}/order/${orderId}`);

            let options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
                method: 'GET',
                rejectUnauthorized: false
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            id: json.orderId || orderId,
                            symbol: json.ticker,
                            side: json.side,
                            type: json.orderType,
                            qty: parseFloat(json.totalSize || json.remainingQuantity),
                            filledQty: parseFloat(json.filledQuantity || 0),
                            price: json.price ? parseFloat(json.price) : null,
                            filledPrice: json.avgPrice ? parseFloat(json.avgPrice) : null,
                            status: json.status
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function cancelIBKROrder(orderId) {
        const https = SA.nodeModules.https;
        const url = require('url');

        let baseUrl = getIBKRBaseUrl();
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let parsedUrl = new url.URL(`${baseUrl}/v1/api/iserver/account/${accountId}/order/${orderId}`);

            let options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
                method: 'DELETE',
                rejectUnauthorized: false
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
                            reject(new Error(json.error || 'Cancel failed'));
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

    async function getIBKRPositions() {
        const https = SA.nodeModules.https;
        const url = require('url');

        let baseUrl = getIBKRBaseUrl();
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let parsedUrl = new url.URL(`${baseUrl}/v1/api/portfolio/${accountId}/positions/0`);

            let options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
                method: 'GET',
                rejectUnauthorized: false
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let positions = json.map(p => ({
                            symbol: p.contractDesc || p.ticker,
                            qty: parseFloat(p.position),
                            side: parseFloat(p.position) > 0 ? 'long' : 'short',
                            avgPrice: parseFloat(p.avgCost),
                            marketValue: parseFloat(p.mktValue),
                            unrealizedPL: parseFloat(p.unrealizedPnl),
                            unrealizedPLPercent: parseFloat(p.unrealizedPnl) / parseFloat(p.avgCost) * 100
                        }));
                        resolve(positions);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getIBKRAccount() {
        const https = SA.nodeModules.https;
        const url = require('url');

        let baseUrl = getIBKRBaseUrl();
        let accountId = exchangeConfig.accountId || '';

        return new Promise((resolve, reject) => {
            let parsedUrl = new url.URL(`${baseUrl}/v1/api/portfolio/${accountId}/summary`);

            let options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
                method: 'GET',
                rejectUnauthorized: false
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            id: accountId,
                            status: 'active',
                            currency: json.baseCurrency || 'USD',
                            cash: parseFloat(json.availablefunds?.amount || json.totalcashvalue?.amount || 0),
                            portfolioValue: parseFloat(json.netliquidation?.amount || 0),
                            buyingPower: parseFloat(json.buyingpower?.amount || 0),
                            marginUsed: parseFloat(json.maintmarginreq?.amount || 0),
                            dayTradesRemaining: json.daytradesremaining?.amount
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    // ==================== TRADESTATION API Implementation ====================
    /*
    TradeStation API - Good for active traders
    Requires OAuth2 authentication.

    Setup:
    1. Create an app at https://developer.tradestation.com/
    2. Get your API Key and Secret
    3. Complete OAuth flow to get access token

    Config example:
    {
        "codeName": "tradestation",
        "apiKey": "YOUR_API_KEY",
        "apiSecret": "YOUR_API_SECRET",
        "accessToken": "YOUR_ACCESS_TOKEN",
        "accountId": "YOUR_ACCOUNT_ID",
        "paperTrading": true
    }
    */

    function getTradeStationBaseUrl() {
        return paperTrading ? 'sim-api.tradestation.com' : 'api.tradestation.com';
    }

    async function createTradeStationOrder(symbol, type, side, amount, price, params) {
        const https = SA.nodeModules.https;

        let hostname = getTradeStationBaseUrl();
        let accountId = exchangeConfig.accountId || '';
        let accessToken = exchangeConfig.accessToken || apiKey;
        let ticker = symbol.split('/')[0];

        let orderData = {
            AccountID: accountId,
            Symbol: ticker,
            Quantity: amount.toString(),
            OrderType: type.toUpperCase() === 'MARKET' ? 'Market' : 'Limit',
            TradeAction: side.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
            TimeInForce: { Duration: params.timeInForce || 'DAY' },
            Route: 'Intelligent'
        };

        if (type.toUpperCase() === 'LIMIT') {
            orderData.LimitPrice = price.toString();
        }

        return new Promise((resolve, reject) => {
            let postData = JSON.stringify(orderData);

            let options = {
                hostname: hostname,
                path: '/v3/orderexecution/orders',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
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
                        if (json.Orders && json.Orders[0]) {
                            let order = json.Orders[0];
                            resolve({
                                id: order.OrderID,
                                symbol: ticker,
                                side: side,
                                type: type,
                                qty: amount,
                                price: price,
                                status: order.Status
                            });
                        } else if (json.Errors) {
                            reject(new Error(json.Errors[0].Message));
                        } else {
                            reject(new Error('Order creation failed'));
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

    async function getTradeStationOrder(orderId) {
        const https = SA.nodeModules.https;

        let hostname = getTradeStationBaseUrl();
        let accountId = exchangeConfig.accountId || '';
        let accessToken = exchangeConfig.accessToken || apiKey;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/brokerage/accounts/${accountId}/orders/${orderId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let order = json.Orders ? json.Orders[0] : json;
                        resolve({
                            id: order.OrderID,
                            symbol: order.Symbol,
                            side: order.TradeAction,
                            type: order.OrderType,
                            qty: parseFloat(order.Quantity),
                            filledQty: parseFloat(order.FilledQuantity || 0),
                            price: order.LimitPrice ? parseFloat(order.LimitPrice) : null,
                            filledPrice: order.FilledPrice ? parseFloat(order.FilledPrice) : null,
                            status: order.Status
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function cancelTradeStationOrder(orderId) {
        const https = SA.nodeModules.https;

        let hostname = getTradeStationBaseUrl();
        let accessToken = exchangeConfig.accessToken || apiKey;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/orderexecution/orders/${orderId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
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
                            reject(new Error(json.Message || 'Cancel failed'));
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

    async function getTradeStationPositions() {
        const https = SA.nodeModules.https;

        let hostname = getTradeStationBaseUrl();
        let accountId = exchangeConfig.accountId || '';
        let accessToken = exchangeConfig.accessToken || apiKey;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/brokerage/accounts/${accountId}/positions`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let positions = (json.Positions || []).map(p => ({
                            symbol: p.Symbol,
                            qty: parseFloat(p.Quantity),
                            side: parseFloat(p.Quantity) > 0 ? 'long' : 'short',
                            avgPrice: parseFloat(p.AveragePrice),
                            marketValue: parseFloat(p.MarketValue),
                            unrealizedPL: parseFloat(p.UnrealizedProfitLoss),
                            unrealizedPLPercent: parseFloat(p.UnrealizedProfitLossPercent)
                        }));
                        resolve(positions);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getTradeStationAccount() {
        const https = SA.nodeModules.https;

        let hostname = getTradeStationBaseUrl();
        let accountId = exchangeConfig.accountId || '';
        let accessToken = exchangeConfig.accessToken || apiKey;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: hostname,
                path: `/v3/brokerage/accounts/${accountId}/balances`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let balances = json.Balances ? json.Balances[0] : json;
                        resolve({
                            id: accountId,
                            status: 'active',
                            currency: 'USD',
                            cash: parseFloat(balances.CashBalance || 0),
                            portfolioValue: parseFloat(balances.Equity || 0),
                            buyingPower: parseFloat(balances.BuyingPower || 0),
                            dayTradingBuyingPower: parseFloat(balances.DayTradingBuyingPower || 0),
                            marginBalance: parseFloat(balances.MarginBalance || 0)
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }
};
