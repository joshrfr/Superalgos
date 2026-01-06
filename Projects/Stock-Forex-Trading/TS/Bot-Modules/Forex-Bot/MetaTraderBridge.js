exports.newStockForexTradingBotModulesMetaTraderBridge = function (processIndex) {

    const MODULE_NAME = "MetaTrader Bridge";

    /*
    MetaTrader 4/5 Bridge Connector

    This module connects Superalgos to MetaTrader 4 or MetaTrader 5 via a bridge.
    MT4/5 doesn't have a native REST API, so we use one of these bridge methods:

    1. ZeroMQ Bridge (Recommended for HFT)
       - Install the DWX_ZeroMQ_Connector EA on MT4/5
       - GitHub: https://github.com/darwinex/dwx-zeromq-connector
       - Runs on localhost with configurable ports

    2. WebSocket Bridge
       - Install a WebSocket EA on MT4/5
       - Several open-source options available

    3. REST Bridge via Local Server
       - Install MT4/5 REST Bridge EA
       - Exposes REST endpoints on localhost

    Configuration Example:
    {
        "codeName": "metatrader",
        "platform": "mt5",  // or "mt4"
        "bridgeType": "rest",  // "zeromq", "websocket", or "rest"
        "host": "localhost",
        "port": 8080,
        "accountId": "YOUR_MT_ACCOUNT"
    }
    */

    let thisObject = {
        initialize: initialize,
        finalize: finalize,
        getOrder: getOrder,
        createOrder: createOrder,
        cancelOrder: cancelOrder,
        getPositions: getPositions,
        getAccountInfo: getAccountInfo,
        getQuote: getQuote,
        subscribeToQuotes: subscribeToQuotes
    };

    let exchangeConfig;
    let platform;      // mt4 or mt5
    let bridgeType;    // zeromq, websocket, or rest
    let host;
    let port;
    let accountId;
    let wsConnection;

    return thisObject;

    function initialize(callBackFunction) {
        try {
            exchangeConfig = TS.projects.foundations.globals.taskConstants.TASK_NODE.parentNode.parentNode.parentNode.referenceParent.parentNode.parentNode.config;

            platform = exchangeConfig.platform || 'mt5';
            bridgeType = exchangeConfig.bridgeType || 'rest';
            host = exchangeConfig.host || 'localhost';
            port = exchangeConfig.port || 8080;
            accountId = exchangeConfig.accountId || '';

            SA.logger.info(MODULE_NAME + ' -> initialize -> Platform: ' + platform.toUpperCase());
            SA.logger.info(MODULE_NAME + ' -> initialize -> Bridge Type: ' + bridgeType);
            SA.logger.info(MODULE_NAME + ' -> initialize -> Host: ' + host + ':' + port);

            // For WebSocket bridge, establish connection
            if (bridgeType === 'websocket') {
                initializeWebSocket();
            }

            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE);

        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> initialize -> err = ' + err.stack);
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE);
        }
    }

    function finalize() {
        if (wsConnection) {
            wsConnection.close();
            wsConnection = undefined;
        }
        exchangeConfig = undefined;
    }

    function initializeWebSocket() {
        try {
            const WebSocket = SA.nodeModules.ws;
            wsConnection = new WebSocket(`ws://${host}:${port}`);

            wsConnection.on('open', () => {
                SA.logger.info(MODULE_NAME + ' -> WebSocket connected to MT' + platform.slice(-1));
            });

            wsConnection.on('error', (err) => {
                SA.logger.error(MODULE_NAME + ' -> WebSocket error: ' + err.message);
            });

            wsConnection.on('close', () => {
                SA.logger.info(MODULE_NAME + ' -> WebSocket disconnected');
            });
        } catch (err) {
            SA.logger.error(MODULE_NAME + ' -> initializeWebSocket -> err = ' + err.stack);
        }
    }

    async function createOrder(symbol, type, side, volume, price, params) {
        /*
        Create order on MetaTrader.

        Parameters:
        - symbol: Trading pair (e.g., "XAUUSD", "EURUSD")
        - type: "market" or "limit" or "stop"
        - side: "buy" or "sell"
        - volume: Lot size (e.g., 0.01, 0.1, 1.0)
        - price: Entry price for pending orders
        - params: { stopLoss, takeProfit, magicNumber, comment }
        */

        switch (bridgeType) {
            case 'rest':
                return await createOrderREST(symbol, type, side, volume, price, params);
            case 'websocket':
                return await createOrderWebSocket(symbol, type, side, volume, price, params);
            case 'zeromq':
                return await createOrderZeroMQ(symbol, type, side, volume, price, params);
            default:
                throw new Error('Unsupported bridge type: ' + bridgeType);
        }
    }

    async function createOrderREST(symbol, type, side, volume, price, params) {
        const http = SA.nodeModules.http;

        // Map order types to MT format
        let mtOrderType;
        if (type.toLowerCase() === 'market') {
            mtOrderType = side.toLowerCase() === 'buy' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
        } else if (type.toLowerCase() === 'limit') {
            mtOrderType = side.toLowerCase() === 'buy' ? 'ORDER_TYPE_BUY_LIMIT' : 'ORDER_TYPE_SELL_LIMIT';
        } else if (type.toLowerCase() === 'stop') {
            mtOrderType = side.toLowerCase() === 'buy' ? 'ORDER_TYPE_BUY_STOP' : 'ORDER_TYPE_SELL_STOP';
        }

        let orderData = {
            action: 'ORDER_SEND',
            symbol: symbol.replace('/', ''),  // XAUUSD format
            type: mtOrderType,
            volume: volume,
            price: price || 0,  // 0 for market orders
            sl: params.stopLoss || 0,
            tp: params.takeProfit || 0,
            magic: params.magicNumber || 12345,
            comment: params.comment || 'Superalgos'
        };

        return new Promise((resolve, reject) => {
            let postData = JSON.stringify(orderData);

            let options = {
                hostname: host,
                port: port,
                path: '/api/trade',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            let req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json.error) {
                            reject(new Error(json.error));
                        } else {
                            resolve({
                                id: json.ticket || json.order,
                                symbol: symbol,
                                side: side,
                                type: type,
                                volume: volume,
                                price: json.price || price,
                                status: 'Filled',
                                openTime: json.openTime
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

    async function createOrderWebSocket(symbol, type, side, volume, price, params) {
        return new Promise((resolve, reject) => {
            if (!wsConnection || wsConnection.readyState !== 1) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            let mtOrderType;
            if (type.toLowerCase() === 'market') {
                mtOrderType = side.toLowerCase() === 'buy' ? 0 : 1;  // OP_BUY = 0, OP_SELL = 1
            } else if (type.toLowerCase() === 'limit') {
                mtOrderType = side.toLowerCase() === 'buy' ? 2 : 3;  // OP_BUYLIMIT = 2, OP_SELLLIMIT = 3
            } else if (type.toLowerCase() === 'stop') {
                mtOrderType = side.toLowerCase() === 'buy' ? 4 : 5;  // OP_BUYSTOP = 4, OP_SELLSTOP = 5
            }

            let orderCommand = {
                action: 'TRADE',
                actionType: 'OPEN',
                symbol: symbol.replace('/', ''),
                orderType: mtOrderType,
                volume: volume,
                price: price || 0,
                stopLoss: params.stopLoss || 0,
                takeProfit: params.takeProfit || 0,
                magic: params.magicNumber || 12345,
                comment: params.comment || 'Superalgos'
            };

            let responseHandler = (message) => {
                try {
                    let response = JSON.parse(message.data);
                    if (response.action === 'TRADE' && response.ticket) {
                        wsConnection.removeEventListener('message', responseHandler);
                        resolve({
                            id: response.ticket,
                            symbol: symbol,
                            side: side,
                            type: type,
                            volume: volume,
                            price: response.price,
                            status: 'Filled'
                        });
                    } else if (response.error) {
                        wsConnection.removeEventListener('message', responseHandler);
                        reject(new Error(response.error));
                    }
                } catch (e) {
                    // Not our response, ignore
                }
            };

            wsConnection.addEventListener('message', responseHandler);
            wsConnection.send(JSON.stringify(orderCommand));

            // Timeout after 30 seconds
            setTimeout(() => {
                wsConnection.removeEventListener('message', responseHandler);
                reject(new Error('Order timeout'));
            }, 30000);
        });
    }

    async function createOrderZeroMQ(symbol, type, side, volume, price, params) {
        /*
        ZeroMQ implementation for DWX_ZeroMQ_Connector
        Requires zmq npm package
        */
        const zmq = SA.nodeModules.zeromq;

        return new Promise(async (resolve, reject) => {
            try {
                const pushSocket = new zmq.Push();
                const pullSocket = new zmq.Pull();

                await pushSocket.connect(`tcp://${host}:${port}`);
                await pullSocket.connect(`tcp://${host}:${port + 1}`);

                let mtOrderType;
                if (type.toLowerCase() === 'market') {
                    mtOrderType = side.toLowerCase() === 'buy' ? 0 : 1;
                } else if (type.toLowerCase() === 'limit') {
                    mtOrderType = side.toLowerCase() === 'buy' ? 2 : 3;
                } else if (type.toLowerCase() === 'stop') {
                    mtOrderType = side.toLowerCase() === 'buy' ? 4 : 5;
                }

                let command = `TRADE|OPEN|${symbol.replace('/', '')}|${mtOrderType}|${volume}|${price || 0}|${params.stopLoss || 0}|${params.takeProfit || 0}|${params.comment || 'Superalgos'}|${params.magicNumber || 12345}`;

                await pushSocket.send(command);

                // Wait for response
                for await (const [msg] of pullSocket) {
                    let response = msg.toString();
                    let parts = response.split('|');

                    if (parts[0] === 'TRADE' && parts[1] === 'OK') {
                        resolve({
                            id: parts[2],  // ticket
                            symbol: symbol,
                            side: side,
                            type: type,
                            volume: volume,
                            price: parseFloat(parts[3]),
                            status: 'Filled'
                        });
                        break;
                    } else if (parts[0] === 'ERROR') {
                        reject(new Error(parts[1]));
                        break;
                    }
                }

                pushSocket.close();
                pullSocket.close();
            } catch (err) {
                reject(err);
            }
        });
    }

    async function getOrder(ticketId) {
        const http = SA.nodeModules.http;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: host,
                port: port,
                path: `/api/orders/${ticketId}`,
                method: 'GET'
            };

            http.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            id: json.ticket,
                            symbol: json.symbol,
                            side: json.type.includes('BUY') ? 'buy' : 'sell',
                            type: json.type.includes('LIMIT') ? 'limit' : json.type.includes('STOP') ? 'stop' : 'market',
                            volume: json.volume,
                            openPrice: json.openPrice,
                            currentPrice: json.currentPrice,
                            stopLoss: json.stopLoss,
                            takeProfit: json.takeProfit,
                            profit: json.profit,
                            status: json.status || 'Open'
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function cancelOrder(ticketId) {
        const http = SA.nodeModules.http;

        return new Promise((resolve, reject) => {
            let orderData = {
                action: 'ORDER_DELETE',
                ticket: ticketId
            };

            let postData = JSON.stringify(orderData);

            let options = {
                hostname: host,
                port: port,
                path: '/api/trade',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            let req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        if (json.error) {
                            reject(new Error(json.error));
                        } else {
                            resolve({ success: true, ticketId: ticketId });
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

    async function getPositions() {
        const http = SA.nodeModules.http;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: host,
                port: port,
                path: '/api/positions',
                method: 'GET'
            };

            http.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        let positions = (json.positions || json).map(p => ({
                            ticket: p.ticket,
                            symbol: p.symbol,
                            side: p.type.includes('BUY') ? 'long' : 'short',
                            volume: p.volume,
                            openPrice: p.openPrice,
                            currentPrice: p.currentPrice,
                            stopLoss: p.stopLoss,
                            takeProfit: p.takeProfit,
                            profit: p.profit,
                            swap: p.swap,
                            commission: p.commission,
                            openTime: p.openTime,
                            magic: p.magic
                        }));
                        resolve(positions);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getAccountInfo() {
        const http = SA.nodeModules.http;

        return new Promise((resolve, reject) => {
            let options = {
                hostname: host,
                port: port,
                path: '/api/account',
                method: 'GET'
            };

            http.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            id: json.login || accountId,
                            name: json.name,
                            server: json.server,
                            currency: json.currency || 'USD',
                            balance: json.balance,
                            equity: json.equity,
                            margin: json.margin,
                            freeMargin: json.freeMargin,
                            marginLevel: json.marginLevel,
                            profit: json.profit,
                            leverage: json.leverage,
                            platform: platform.toUpperCase()
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    async function getQuote(symbol) {
        const http = SA.nodeModules.http;

        return new Promise((resolve, reject) => {
            let mtSymbol = symbol.replace('/', '');

            let options = {
                hostname: host,
                port: port,
                path: `/api/quote/${mtSymbol}`,
                method: 'GET'
            };

            http.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data);
                        resolve({
                            symbol: symbol,
                            bid: json.bid,
                            ask: json.ask,
                            spread: json.ask - json.bid,
                            time: json.time,
                            high: json.high,
                            low: json.low
                        });
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            }).on('error', reject);
        });
    }

    function subscribeToQuotes(symbols, callback) {
        /*
        Subscribe to real-time quotes via WebSocket.

        symbols: Array of symbols to subscribe to
        callback: Function called with quote updates
        */
        if (bridgeType !== 'websocket') {
            SA.logger.warn(MODULE_NAME + ' -> subscribeToQuotes requires WebSocket bridge');
            return;
        }

        if (!wsConnection || wsConnection.readyState !== 1) {
            SA.logger.error(MODULE_NAME + ' -> WebSocket not connected');
            return;
        }

        // Subscribe command
        let subscribeCommand = {
            action: 'SUBSCRIBE',
            symbols: symbols.map(s => s.replace('/', ''))
        };

        wsConnection.send(JSON.stringify(subscribeCommand));

        // Handle incoming quotes
        wsConnection.on('message', (message) => {
            try {
                let data = JSON.parse(message);
                if (data.action === 'TICK') {
                    callback({
                        symbol: data.symbol,
                        bid: data.bid,
                        ask: data.ask,
                        time: data.time
                    });
                }
            } catch (e) {
                // Ignore non-JSON messages
            }
        });
    }
};
