exports.newStockForexRoute = function newStockForexRoute() {
    const thisObject = {
        endpoint: 'StockForex',
        command: command
    }

    return thisObject

    function command(httpRequest, httpResponse) {
        SA.projects.foundations.utilities.httpRequests.getRequestBody(httpRequest, httpResponse, processRequest)

        async function processRequest(body) {
            try {
                if (body === undefined) {
                    return
                }
                let params = JSON.parse(body)

                switch (params.method) {
                    // ==================== STOCK DATA METHODS ====================
                    case 'fetchStockQuote': {
                        /*
                        Fetch real-time stock quote.
                        params: { symbol: "AAPL", provider: "yahoo" }
                        */
                        let quote = await fetchStockQuote(params.symbol, params.provider, params.apiKey)
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(quote), httpResponse)
                        return
                    }
                    case 'fetchStockCandles': {
                        /*
                        Fetch historical OHLCV candles for a stock.
                        params: { symbol: "AAPL", interval: "1m", from: timestamp, to: timestamp, provider: "yahoo" }
                        */
                        let candles = await fetchStockCandles(params.symbol, params.interval, params.from, params.to, params.provider, params.apiKey)
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(candles), httpResponse)
                        return
                    }
                    case 'searchStocks': {
                        /*
                        Search for stock symbols.
                        params: { query: "apple", provider: "yahoo" }
                        */
                        let results = await searchStocks(params.query, params.provider, params.apiKey)
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(results), httpResponse)
                        return
                    }
                    case 'listPopularStocks': {
                        /*
                        List popular stock symbols by category.
                        */
                        let stocks = getPopularStocks()
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(stocks), httpResponse)
                        return
                    }

                    // ==================== FOREX DATA METHODS ====================
                    case 'fetchForexQuote': {
                        /*
                        Fetch real-time forex quote.
                        params: { pair: "XAU/USD", provider: "oanda", apiKey: "...", accountId: "..." }
                        */
                        let quote = await fetchForexQuote(params.pair, params.provider, params.apiKey, params.accountId, params.practice)
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(quote), httpResponse)
                        return
                    }
                    case 'fetchForexCandles': {
                        /*
                        Fetch historical OHLCV candles for a forex pair.
                        params: { pair: "XAU/USD", interval: "M1", from: timestamp, count: 5000 }
                        */
                        let candles = await fetchForexCandles(params.pair, params.interval, params.from, params.count, params.provider, params.apiKey, params.accountId, params.practice)
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(candles), httpResponse)
                        return
                    }
                    case 'listForexPairs': {
                        /*
                        List available forex pairs including precious metals.
                        */
                        let pairs = getForexPairs()
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(pairs), httpResponse)
                        return
                    }
                    case 'listForexBrokers': {
                        /*
                        List supported forex brokers.
                        */
                        let brokers = getForexBrokers()
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(brokers), httpResponse)
                        return
                    }
                    case 'listStockBrokers': {
                        /*
                        List supported stock brokers.
                        */
                        let brokers = getStockBrokers()
                        SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(brokers), httpResponse)
                        return
                    }
                }

                let content = {
                    err: global.DEFAULT_FAIL_RESPONSE // method not supported
                }
                SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(content), httpResponse)

            } catch (err) {
                SA.logger.info('httpInterface -> StockForex -> Error: ' + err.message)
                let error = {
                    result: 'Fail Because',
                    message: err.message
                }
                SA.projects.foundations.utilities.httpResponses.respondWithContent(JSON.stringify(error), httpResponse)
            }
        }
    }

    // ==================== STOCK DATA FUNCTIONS ====================

    async function fetchStockQuote(symbol, provider, apiKey) {
        const https = SA.nodeModules.https

        if (!provider || provider === 'yahoo') {
            // Yahoo Finance quote
            let url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`

            return new Promise((resolve, reject) => {
                https.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }, (res) => {
                    let data = ''
                    res.on('data', (chunk) => { data += chunk })
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data)
                            if (json.chart && json.chart.result && json.chart.result[0]) {
                                let result = json.chart.result[0]
                                let meta = result.meta
                                let quote = result.indicators.quote[0]
                                let lastIndex = quote.close.length - 1

                                resolve({
                                    symbol: symbol,
                                    price: meta.regularMarketPrice,
                                    open: quote.open[lastIndex],
                                    high: meta.regularMarketDayHigh,
                                    low: meta.regularMarketDayLow,
                                    close: quote.close[lastIndex],
                                    volume: meta.regularMarketVolume,
                                    previousClose: meta.chartPreviousClose,
                                    change: meta.regularMarketPrice - meta.chartPreviousClose,
                                    changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100).toFixed(2),
                                    timestamp: Date.now()
                                })
                            } else {
                                reject(new Error('Invalid response from Yahoo Finance'))
                            }
                        } catch (parseErr) {
                            reject(parseErr)
                        }
                    })
                }).on('error', reject)
            })
        }

        throw new Error('Provider not supported: ' + provider)
    }

    async function fetchStockCandles(symbol, interval, from, to, provider, apiKey) {
        const https = SA.nodeModules.https

        if (!provider || provider === 'yahoo') {
            let period1 = Math.floor(from / 1000)
            let period2 = to ? Math.floor(to / 1000) : Math.floor(Date.now() / 1000)

            let url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval || '1m'}`

            return new Promise((resolve, reject) => {
                https.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }, (res) => {
                    let data = ''
                    res.on('data', (chunk) => { data += chunk })
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data)
                            let candles = []

                            if (json.chart && json.chart.result && json.chart.result[0]) {
                                let result = json.chart.result[0]
                                let timestamps = result.timestamp || []
                                let quote = result.indicators.quote[0]

                                for (let i = 0; i < timestamps.length; i++) {
                                    if (quote.open[i] !== null) {
                                        candles.push({
                                            timestamp: timestamps[i] * 1000,
                                            open: quote.open[i],
                                            high: quote.high[i],
                                            low: quote.low[i],
                                            close: quote.close[i],
                                            volume: quote.volume[i] || 0
                                        })
                                    }
                                }
                            }
                            resolve(candles)
                        } catch (parseErr) {
                            reject(parseErr)
                        }
                    })
                }).on('error', reject)
            })
        }

        throw new Error('Provider not supported: ' + provider)
    }

    async function searchStocks(query, provider, apiKey) {
        const https = SA.nodeModules.https

        if (!provider || provider === 'yahoo') {
            let url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`

            return new Promise((resolve, reject) => {
                https.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }, (res) => {
                    let data = ''
                    res.on('data', (chunk) => { data += chunk })
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data)
                            let results = []

                            if (json.quotes) {
                                for (let quote of json.quotes) {
                                    if (quote.quoteType === 'EQUITY') {
                                        results.push({
                                            symbol: quote.symbol,
                                            name: quote.shortname || quote.longname,
                                            exchange: quote.exchange,
                                            type: quote.quoteType
                                        })
                                    }
                                }
                            }
                            resolve(results)
                        } catch (parseErr) {
                            reject(parseErr)
                        }
                    })
                }).on('error', reject)
            })
        }

        throw new Error('Provider not supported: ' + provider)
    }

    function getPopularStocks() {
        return {
            technology: [
                { symbol: 'AAPL', name: 'Apple Inc.' },
                { symbol: 'MSFT', name: 'Microsoft Corporation' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.' },
                { symbol: 'AMZN', name: 'Amazon.com Inc.' },
                { symbol: 'META', name: 'Meta Platforms Inc.' },
                { symbol: 'NVDA', name: 'NVIDIA Corporation' },
                { symbol: 'TSLA', name: 'Tesla Inc.' }
            ],
            finance: [
                { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
                { symbol: 'BAC', name: 'Bank of America Corp.' },
                { symbol: 'WFC', name: 'Wells Fargo & Co.' },
                { symbol: 'GS', name: 'Goldman Sachs Group Inc.' },
                { symbol: 'V', name: 'Visa Inc.' },
                { symbol: 'MA', name: 'Mastercard Inc.' }
            ],
            healthcare: [
                { symbol: 'JNJ', name: 'Johnson & Johnson' },
                { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
                { symbol: 'PFE', name: 'Pfizer Inc.' },
                { symbol: 'ABBV', name: 'AbbVie Inc.' },
                { symbol: 'MRK', name: 'Merck & Co. Inc.' }
            ],
            indices: [
                { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
                { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
                { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF' },
                { symbol: 'IWM', name: 'iShares Russell 2000 ETF' }
            ]
        }
    }

    // ==================== FOREX DATA FUNCTIONS ====================

    async function fetchForexQuote(pair, provider, apiKey, accountId, practice) {
        const https = SA.nodeModules.https

        if (provider === 'oanda') {
            let hostname = practice ? 'api-fxpractice.oanda.com' : 'api-fxtrade.oanda.com'
            let instrument = pair.replace('/', '_')

            return new Promise((resolve, reject) => {
                let options = {
                    hostname: hostname,
                    path: `/v3/accounts/${accountId}/pricing?instruments=${instrument}`,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }

                https.get(options, (res) => {
                    let data = ''
                    res.on('data', (chunk) => { data += chunk })
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data)
                            if (json.prices && json.prices.length > 0) {
                                let price = json.prices[0]
                                let bid = parseFloat(price.bids[0].price)
                                let ask = parseFloat(price.asks[0].price)
                                let mid = (bid + ask) / 2

                                resolve({
                                    pair: pair,
                                    bid: bid,
                                    ask: ask,
                                    mid: mid,
                                    spread: ask - bid,
                                    timestamp: new Date(price.time).valueOf()
                                })
                            } else {
                                reject(new Error('Price not available'))
                            }
                        } catch (parseErr) {
                            reject(parseErr)
                        }
                    })
                }).on('error', reject)
            })
        }

        // Free forex data from exchangerate API
        let [base, quote] = pair.split('/')
        let url = `https://api.exchangerate.host/latest?base=${base}&symbols=${quote}`

        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = ''
                res.on('data', (chunk) => { data += chunk })
                res.on('end', () => {
                    try {
                        let json = JSON.parse(data)
                        if (json.success && json.rates) {
                            let rate = json.rates[quote]
                            resolve({
                                pair: pair,
                                bid: rate,
                                ask: rate,
                                mid: rate,
                                spread: 0,
                                timestamp: new Date(json.date).valueOf()
                            })
                        } else {
                            reject(new Error('Rate not available'))
                        }
                    } catch (parseErr) {
                        reject(parseErr)
                    }
                })
            }).on('error', reject)
        })
    }

    async function fetchForexCandles(pair, interval, from, count, provider, apiKey, accountId, practice) {
        const https = SA.nodeModules.https

        if (provider === 'oanda') {
            let hostname = practice ? 'api-fxpractice.oanda.com' : 'api-fxtrade.oanda.com'
            let instrument = pair.replace('/', '_')
            let fromTime = new Date(from).toISOString()

            return new Promise((resolve, reject) => {
                let options = {
                    hostname: hostname,
                    path: `/v3/instruments/${instrument}/candles?granularity=${interval || 'M1'}&from=${fromTime}&count=${count || 5000}`,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }

                https.get(options, (res) => {
                    let data = ''
                    res.on('data', (chunk) => { data += chunk })
                    res.on('end', () => {
                        try {
                            let json = JSON.parse(data)
                            let candles = []

                            if (json.candles) {
                                for (let candle of json.candles) {
                                    if (candle.complete) {
                                        let mid = candle.mid
                                        candles.push({
                                            timestamp: new Date(candle.time).valueOf(),
                                            open: parseFloat(mid.o),
                                            high: parseFloat(mid.h),
                                            low: parseFloat(mid.l),
                                            close: parseFloat(mid.c),
                                            volume: candle.volume || 0
                                        })
                                    }
                                }
                            }
                            resolve(candles)
                        } catch (parseErr) {
                            reject(parseErr)
                        }
                    })
                }).on('error', reject)
            })
        }

        throw new Error('Provider not supported for candles: ' + provider)
    }

    function getForexPairs() {
        return {
            preciousMetals: [
                { pair: 'XAU/USD', name: 'Gold/US Dollar', pipSize: 0.01 },
                { pair: 'XAG/USD', name: 'Silver/US Dollar', pipSize: 0.001 },
                { pair: 'XPT/USD', name: 'Platinum/US Dollar', pipSize: 0.01 },
                { pair: 'XPD/USD', name: 'Palladium/US Dollar', pipSize: 0.01 }
            ],
            majorPairs: [
                { pair: 'EUR/USD', name: 'Euro/US Dollar', pipSize: 0.0001 },
                { pair: 'GBP/USD', name: 'British Pound/US Dollar', pipSize: 0.0001 },
                { pair: 'USD/JPY', name: 'US Dollar/Japanese Yen', pipSize: 0.01 },
                { pair: 'USD/CHF', name: 'US Dollar/Swiss Franc', pipSize: 0.0001 },
                { pair: 'AUD/USD', name: 'Australian Dollar/US Dollar', pipSize: 0.0001 },
                { pair: 'NZD/USD', name: 'New Zealand Dollar/US Dollar', pipSize: 0.0001 },
                { pair: 'USD/CAD', name: 'US Dollar/Canadian Dollar', pipSize: 0.0001 }
            ],
            crosses: [
                { pair: 'EUR/GBP', name: 'Euro/British Pound', pipSize: 0.0001 },
                { pair: 'EUR/JPY', name: 'Euro/Japanese Yen', pipSize: 0.01 },
                { pair: 'GBP/JPY', name: 'British Pound/Japanese Yen', pipSize: 0.01 },
                { pair: 'EUR/CHF', name: 'Euro/Swiss Franc', pipSize: 0.0001 },
                { pair: 'AUD/JPY', name: 'Australian Dollar/Japanese Yen', pipSize: 0.01 }
            ]
        }
    }

    function getForexBrokers() {
        return [
            {
                id: 'oanda',
                name: 'OANDA',
                description: 'Popular forex broker with excellent API support',
                features: ['REST API', 'Practice accounts', 'XAU/USD', 'All major pairs'],
                hasPracticeMode: true
            },
            {
                id: 'forex-com',
                name: 'FOREX.com',
                description: 'Major forex broker',
                features: ['REST API', 'Demo accounts'],
                hasPracticeMode: true
            },
            {
                id: 'ig',
                name: 'IG',
                description: 'Global trading provider',
                features: ['REST API', 'Spread betting', 'CFDs'],
                hasPracticeMode: true
            },
            {
                id: 'fxcm',
                name: 'FXCM',
                description: 'Forex Capital Markets',
                features: ['REST API', 'Demo accounts'],
                hasPracticeMode: true
            }
        ]
    }

    function getStockBrokers() {
        return [
            {
                id: 'alpaca',
                name: 'Alpaca',
                description: 'Commission-free stock trading API',
                features: ['REST API', 'Paper trading', 'Fractional shares', 'Free real-time data'],
                hasPaperTrading: true,
                apiDocUrl: 'https://alpaca.markets/docs/'
            },
            {
                id: 'tradier',
                name: 'Tradier',
                description: 'Brokerage API for stocks and options',
                features: ['REST API', 'Sandbox mode', 'Options trading'],
                hasPaperTrading: true,
                apiDocUrl: 'https://documentation.tradier.com/'
            },
            {
                id: 'interactive-brokers',
                name: 'Interactive Brokers',
                description: 'Professional trading platform',
                features: ['Client Portal API', 'TWS API', 'Global markets'],
                hasPaperTrading: true,
                apiDocUrl: 'https://interactivebrokers.github.io/'
            },
            {
                id: 'td-ameritrade',
                name: 'TD Ameritrade',
                description: 'Major US brokerage',
                features: ['REST API', 'Paper trading'],
                hasPaperTrading: true,
                apiDocUrl: 'https://developer.tdameritrade.com/'
            }
        ]
    }
}
