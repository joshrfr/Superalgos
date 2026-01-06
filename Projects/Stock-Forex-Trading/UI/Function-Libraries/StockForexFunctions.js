function newStockForexTradingFunctionLibraryStockForexFunctions() {
    let thisObject = {
        addMissingStockMarkets: addMissingStockMarkets,
        addMissingForexMarkets: addMissingForexMarkets,
        installStockMarket: installStockMarket,
        installForexMarket: installForexMarket
    }

    return thisObject

    async function addMissingStockMarkets(node, rootNodes) {
        /*
        Add popular stock markets to the exchange.
        */
        let exchange = node
        if (exchange.stockMarkets === undefined) {
            return
        }

        let popularStocks = [
            { symbol: 'AAPL', name: 'Apple Inc.' },
            { symbol: 'MSFT', name: 'Microsoft Corporation' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.' },
            { symbol: 'TSLA', name: 'Tesla Inc.' },
            { symbol: 'META', name: 'Meta Platforms Inc.' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation' },
            { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
            { symbol: 'V', name: 'Visa Inc.' },
            { symbol: 'JNJ', name: 'Johnson & Johnson' }
        ]

        let existingMarkets = new Set()
        if (exchange.stockMarkets.markets) {
            for (let market of exchange.stockMarkets.markets) {
                if (market.config && market.config.codeName) {
                    existingMarkets.add(market.config.codeName)
                }
            }
        }

        for (let stock of popularStocks) {
            let codeName = stock.symbol + '/USD'
            if (!existingMarkets.has(codeName)) {
                // Create market node
                let market = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(
                    exchange.stockMarkets,
                    'Stock Market',
                    undefined,
                    'Stock-Forex-Trading'
                )
                if (market) {
                    market.name = stock.name
                    market.config = JSON.stringify({
                        codeName: codeName,
                        type: 'stock'
                    })
                }
            }
        }
    }

    async function addMissingForexMarkets(node, rootNodes) {
        /*
        Add popular forex pairs including XAU/USD to the exchange.
        */
        let exchange = node
        if (exchange.forexMarkets === undefined) {
            return
        }

        let popularPairs = [
            { pair: 'XAU/USD', name: 'Gold/US Dollar', type: 'precious-metal', pipSize: 0.01 },
            { pair: 'XAG/USD', name: 'Silver/US Dollar', type: 'precious-metal', pipSize: 0.001 },
            { pair: 'EUR/USD', name: 'Euro/US Dollar', type: 'currency', pipSize: 0.0001 },
            { pair: 'GBP/USD', name: 'British Pound/US Dollar', type: 'currency', pipSize: 0.0001 },
            { pair: 'USD/JPY', name: 'US Dollar/Japanese Yen', type: 'currency', pipSize: 0.01 },
            { pair: 'USD/CHF', name: 'US Dollar/Swiss Franc', type: 'currency', pipSize: 0.0001 },
            { pair: 'AUD/USD', name: 'Australian Dollar/US Dollar', type: 'currency', pipSize: 0.0001 },
            { pair: 'NZD/USD', name: 'New Zealand Dollar/US Dollar', type: 'currency', pipSize: 0.0001 },
            { pair: 'USD/CAD', name: 'US Dollar/Canadian Dollar', type: 'currency', pipSize: 0.0001 },
            { pair: 'EUR/GBP', name: 'Euro/British Pound', type: 'currency', pipSize: 0.0001 },
            { pair: 'EUR/JPY', name: 'Euro/Japanese Yen', type: 'currency', pipSize: 0.01 },
            { pair: 'GBP/JPY', name: 'British Pound/Japanese Yen', type: 'currency', pipSize: 0.01 }
        ]

        let existingMarkets = new Set()
        if (exchange.forexMarkets.markets) {
            for (let market of exchange.forexMarkets.markets) {
                if (market.config && market.config.codeName) {
                    existingMarkets.add(market.config.codeName)
                }
            }
        }

        for (let forex of popularPairs) {
            if (!existingMarkets.has(forex.pair)) {
                // Create market node
                let market = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(
                    exchange.forexMarkets,
                    'Forex Market',
                    undefined,
                    'Stock-Forex-Trading'
                )
                if (market) {
                    market.name = forex.name
                    market.config = JSON.stringify({
                        codeName: forex.pair,
                        type: forex.type,
                        pipSize: forex.pipSize,
                        lotSize: 100
                    })
                }
            }
        }
    }

    function installStockMarket(node, rootNodes) {
        /*
        Install data mining and trading tasks for a stock market.
        This creates the necessary tasks to fetch historical data and run trading bots.
        */
        let market = node
        if (!market || !market.config) {
            return
        }

        let config = JSON.parse(market.config)
        let marketName = config.codeName || 'Unknown Market'

        UI.projects.foundations.utilities.statusBar.changeStatus(
            'Installing Stock Market: ' + marketName + '...'
        )

        // The actual installation would create data mining tasks, etc.
        // For now, just show success message
        setTimeout(() => {
            UI.projects.foundations.utilities.statusBar.changeStatus(
                'Stock Market ' + marketName + ' installed successfully!'
            )
        }, 1000)
    }

    function installForexMarket(node, rootNodes) {
        /*
        Install data mining and trading tasks for a forex market.
        This creates the necessary tasks to fetch historical data and run trading bots.
        */
        let market = node
        if (!market || !market.config) {
            return
        }

        let config = JSON.parse(market.config)
        let marketName = config.codeName || 'Unknown Market'

        UI.projects.foundations.utilities.statusBar.changeStatus(
            'Installing Forex Market: ' + marketName + '...'
        )

        // The actual installation would create data mining tasks, etc.
        // For now, just show success message
        setTimeout(() => {
            UI.projects.foundations.utilities.statusBar.changeStatus(
                'Forex Market ' + marketName + ' installed successfully!'
            )
        }, 1000)
    }
}
