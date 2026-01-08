# Superalgos Stock & Forex Trading Manual

## Complete Guide for Stocks, Options, Forex, and Precious Metals Trading

**Version 1.0 | January 2025**

---

# Table of Contents

1. [Introduction to Superalgos](#1-introduction-to-superalgos)
2. [System Requirements & Installation](#2-system-requirements--installation)
3. [Understanding the Superalgos Interface](#3-understanding-the-superalgos-interface)
4. [Stock-Forex-Trading Project Overview](#4-stock-forex-trading-project-overview)
5. [Setting Up Your Broker Accounts](#5-setting-up-your-broker-accounts)
6. [Mining Historical Data](#6-mining-historical-data)
7. [Building Your First Trading Strategy](#7-building-your-first-trading-strategy)
8. [Backtesting Your Strategy](#8-backtesting-your-strategy)
9. [Live Trading](#9-live-trading)
10. [Tracking Your Models & Performance](#10-tracking-your-models--performance)
11. [Broker Configuration Reference](#11-broker-configuration-reference)
12. [Troubleshooting](#12-troubleshooting)

---

# 1. Introduction to Superalgos

## What is Superalgos?

Superalgos is a free, open-source platform for building, testing, and deploying algorithmic trading strategies. Originally designed for cryptocurrency trading, we have now extended it to support:

- **Stocks** (AAPL, TSLA, MSFT, etc.)
- **Options** (via compatible brokers)
- **Forex** (EUR/USD, GBP/USD, etc.)
- **Precious Metals** (XAU/USD Gold, XAG/USD Silver)

## Key Features

| Feature | Description |
|---------|-------------|
| Visual Strategy Builder | Build strategies without coding using a node-based interface |
| Data Mining | Automatically fetch and store historical market data |
| Backtesting | Test your strategies against historical data |
| Paper Trading | Practice with simulated money before going live |
| Live Trading | Execute real trades through supported brokers |
| Multi-Market | Trade stocks, forex, crypto, and commodities |

## How Superalgos Works

Superalgos uses a **node-based visual programming paradigm**. Everything is represented as nodes that you can connect, configure, and organize on a canvas.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Data Mining   │ --> │   Indicators    │ --> │    Strategy     │
│   (Fetch Data)  │     │   (Analysis)    │     │   (Decisions)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Execution     │ <-- │  Trading Bot    │ <-- │   Conditions    │
│   (Broker API)  │     │   (Orders)      │     │   (Rules)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Superalgos Architecture Overview

### The Node System

Everything in Superalgos is a **Node**. Nodes are connected to form **Hierarchies** (tree structures):

```
Root Node (Parent)
├── Child Node 1
│   ├── Grandchild Node A
│   └── Grandchild Node B
└── Child Node 2
    └── Grandchild Node C
```

**Node Types:**
1. **Container Nodes** - Hold other nodes (like folders)
2. **Definition Nodes** - Define properties/settings
3. **Reference Nodes** - Point to other nodes
4. **Execution Nodes** - Trigger actions (run tasks, bots)

### The Project System

Superalgos organizes features into **Projects**:

| Project | Purpose |
|---------|---------|
| **Foundations** | Core platform functionality |
| **Algorithmic-Trading** | Trading bots and strategies |
| **Data-Mining** | Fetching and storing market data |
| **Superalgos** | Main workspace templates |
| **Stock-Forex-Trading** | Stocks, forex, and commodities (NEW!) |

### How Bots Work

Superalgos uses a **multi-bot architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                      TASK MANAGER                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Sensor Bot  │  │ Indicator   │  │ Trading Bot         │ │
│  │ (Fetch Data)│  │ Bot         │  │ (Execute Strategy)  │ │
│  └─────────────┘  │ (Calculate) │  └─────────────────────┘ │
│        │          └─────────────┘            │              │
│        v                │                    v              │
│  ┌──────────┐           v             ┌──────────────┐     │
│  │ Raw Data │    ┌───────────┐        │ Orders/      │     │
│  │ Storage  │    │ Indicator │        │ Positions    │     │
│  └──────────┘    │ Output    │        └──────────────┘     │
│                  └───────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

**Sensor Bot:** Fetches raw price data from exchanges/brokers
**Indicator Bot:** Calculates technical indicators (EMA, RSI, etc.)
**Trading Bot:** Executes your strategy rules and places orders

---

# 2. System Requirements & Installation

## Minimum Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 8 GB minimum, 16 GB recommended
- **Storage**: 10 GB free space
- **Node.js**: Version 18.x or higher
- **Git**: Latest version

## Installation Steps

### Step 1: Install Node.js

Download from: https://nodejs.org/

Verify installation:
```bash
node --version   # Should show v18.x or higher
npm --version    # Should show 9.x or higher
```

### Step 2: Install Git

Download from: https://git-scm.com/

Verify installation:
```bash
git --version
```

### Step 3: Clone Superalgos

```bash
git clone https://github.com/Superalgos/Superalgos.git
cd Superalgos
```

### Step 4: Install Dependencies

```bash
node setup
```

### Step 5: Start Superalgos

```bash
node platform
```

The platform will open in your browser at: `http://localhost:34248`

---

# 3. Understanding the Superalgos Interface

## The Design Space

When you open Superalgos, you'll see a large canvas called the **Design Space**. This is where you build and organize your trading system.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Nodes** | Building blocks that represent different components |
| **Hierarchies** | Tree structures that organize nodes |
| **References** | Connections between nodes in different hierarchies |
| **Workspaces** | Saved configurations of your entire setup |

### Main Hierarchies

1. **Network** - Manages tasks, bots, and processes
2. **Crypto Ecosystem** - For cryptocurrency exchanges
3. **Stock-Forex Ecosystem** - For stocks and forex (NEW!)
4. **Trading System** - Your trading strategy rules
5. **Trading Engine** - Execution and tracking
6. **Data Mine** - Indicators and data processing

### Navigation

- **Scroll Wheel**: Zoom in/out
- **Click + Drag**: Pan around the canvas
- **Right Click**: Open node menus
- **Double Click**: Expand/collapse nodes

---

# 4. Stock-Forex-Trading Project Overview

## What's New

The Stock-Forex-Trading project adds support for traditional markets:

### Supported Brokers

#### For Stocks:
| Broker | Best For | Paper Trading |
|--------|----------|---------------|
| **Alpaca** | Beginners, Free API | Yes |
| **Interactive Brokers** | HFT, Professional | Yes |
| **TradeStation** | Active Traders | Yes |
| **Tradier** | Options | Yes |

#### For Forex/Precious Metals:
| Broker | XAU/USD | EUR/USD | Paper Trading |
|--------|---------|---------|---------------|
| **OANDA** | Yes | Yes | Yes |
| **MetaTrader 4/5** | Yes | Yes | Yes |
| **FXCM** | Yes | Yes | Yes |

### Supported Markets

**Stocks:**
- US Stocks: AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META
- ETFs: SPY, QQQ, DIA, IWM

**Forex:**
- Major Pairs: EUR/USD, GBP/USD, USD/JPY, USD/CHF
- Crosses: EUR/GBP, EUR/JPY, GBP/JPY

**Precious Metals:**
- Gold: XAU/USD
- Silver: XAG/USD
- Platinum: XPT/USD

---

# 5. Setting Up Your Broker Accounts

## Step-by-Step: Creating Your First Exchange

### Step 1: Add the Stock-Forex Ecosystem

1. Right-click on an empty area of the canvas
2. Select **"Add UI Object"**
3. Choose **"Stock Forex Ecosystem"**

A new hierarchy will appear with:
- Stock Exchanges (container)
- Forex Exchanges (container)

### Step 2: Add a Stock Exchange (Example: Alpaca)

1. Click on **"Stock Exchanges"**
2. Right-click and select **"Add Stock Exchange"**
3. A new Stock Exchange node appears

### Step 3: Configure Your Broker

1. Click on the Stock Exchange node
2. Click the **"Configure"** button (gear icon)
3. Enter your configuration:

```json
{
    "codeName": "alpaca",
    "apiKey": "YOUR_ALPACA_API_KEY",
    "apiSecret": "YOUR_ALPACA_SECRET_KEY",
    "paperTrading": true,
    "dataProvider": "yahoo"
}
```

---

## Broker-Specific Setup Instructions

### ALPACA (Recommended for Beginners)

**Why Alpaca?**
- Free API access
- Commission-free trading
- Paper trading included
- Real-time data included

**Getting Your API Keys:**

1. Go to https://alpaca.markets/
2. Create a free account
3. Go to **Paper Trading** section
4. Click **"View API Keys"**
5. Generate new keys
6. Copy both the API Key ID and Secret Key

**Configuration:**
```json
{
    "codeName": "alpaca",
    "apiKey": "PKXXXXXXXXXXXXXXXX",
    "apiSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "paperTrading": true,
    "dataProvider": "yahoo"
}
```

**Important Settings:**
| Setting | Value | Description |
|---------|-------|-------------|
| `paperTrading` | `true` | Use paper money (recommended to start) |
| `paperTrading` | `false` | Use real money (be careful!) |
| `dataProvider` | `"yahoo"` | Free historical data |
| `dataProvider` | `"polygon"` | Requires paid API key |

---

### INTERACTIVE BROKERS (Best for HFT)

**Why Interactive Brokers?**
- Lowest latency for HFT
- Professional-grade platform
- Access to global markets
- Advanced order types

**Prerequisites:**
1. Active IBKR account (or Paper Trading account)
2. TWS (Trader Workstation) or IB Gateway installed
3. API access enabled

**Step 1: Download TWS or IB Gateway**

Go to: https://www.interactivebrokers.com/en/trading/tws.php

Download and install either:
- **TWS** - Full trading platform with API
- **IB Gateway** - Lightweight API-only version

**Step 2: Enable API Access**

1. Open TWS
2. Go to **Edit** → **Global Configuration**
3. Navigate to **API** → **Settings**
4. Check **"Enable ActiveX and Socket Clients"**
5. Set Socket Port to **7497** (paper) or **7496** (live)
6. Check **"Allow connections from localhost only"**

**Step 3: Configure in Superalgos**
```json
{
    "codeName": "interactive-brokers",
    "gatewayUrl": "https://localhost:5000",
    "accountId": "YOUR_IBKR_ACCOUNT_ID",
    "paperTrading": true
}
```

**Finding Your Account ID:**
- In TWS, look at the top right corner
- Format: `UXXXXXXX` or `DFXXXXXXX`

---

### TRADESTATION

**Getting Started:**

1. Create account at https://www.tradestation.com/
2. Apply for API access at https://developer.tradestation.com/
3. Create an application to get credentials

**Configuration:**
```json
{
    "codeName": "tradestation",
    "apiKey": "YOUR_API_KEY",
    "apiSecret": "YOUR_API_SECRET",
    "accessToken": "YOUR_ACCESS_TOKEN",
    "accountId": "YOUR_ACCOUNT_ID",
    "paperTrading": true
}
```

**OAuth2 Authentication:**
TradeStation uses OAuth2. You'll need to:
1. Redirect user to authorization URL
2. Get authorization code
3. Exchange for access token
4. Refresh token periodically

---

### OANDA (For Forex & XAU/USD)

**Why OANDA?**
- Excellent forex API
- XAU/USD (Gold) trading
- Practice accounts available
- No minimum deposit

**Getting Your API Key:**

1. Sign up at https://www.oanda.com/
2. Go to **Manage API Access**
3. Click **"Generate"** to create a new token
4. Copy your API token
5. Note your Account ID (format: XXX-XXX-XXXXXXXX-XXX)

**Configuration:**
```json
{
    "codeName": "oanda",
    "apiKey": "your-api-token-here",
    "accountId": "XXX-XXX-XXXXXXXX-XXX",
    "practice": true
}
```

**Important:**
| Setting | Value | Description |
|---------|-------|-------------|
| `practice` | `true` | Use practice server (fxpractice) |
| `practice` | `false` | Use live server (fxtrade) |

---

### METATRADER 4/5 (For Your Existing MT4/5)

**Why MetaTrader Bridge?**
- Use your existing MT4/5 broker
- Keep your current account
- Trade XAU/USD and forex
- Works with any MT4/5 broker

**Requirements:**
- MetaTrader 4 or MetaTrader 5 installed
- A bridge Expert Advisor (EA) installed

**Step 1: Install a Bridge EA**

Download one of these free bridge solutions:

1. **DWX ZeroMQ Connector** (Recommended)
   - GitHub: https://github.com/darwinex/dwx-zeromq-connector
   - Uses ZeroMQ for fast communication

2. **MT4/5 REST Bridge**
   - Various open-source options available
   - Exposes REST API on localhost

**Step 2: Install the EA**

1. Copy the EA file to:
   - MT4: `C:\Users\[User]\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL4\Experts\`
   - MT5: `C:\Users\[User]\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL5\Experts\`
2. Restart MetaTrader
3. Attach EA to a chart
4. Allow DLL imports in settings

**Step 3: Configure in Superalgos**

For REST Bridge:
```json
{
    "codeName": "metatrader",
    "platform": "mt5",
    "bridgeType": "rest",
    "host": "localhost",
    "port": 8080,
    "accountId": "YOUR_MT_ACCOUNT"
}
```

For ZeroMQ Bridge:
```json
{
    "codeName": "metatrader",
    "platform": "mt5",
    "bridgeType": "zeromq",
    "host": "localhost",
    "port": 32768,
    "accountId": "YOUR_MT_ACCOUNT"
}
```

---

# 6. Mining Historical Data

## Why Mine Data?

Before you can backtest a strategy, you need historical price data. Data mining fetches this data from your broker or data provider and stores it locally.

## Step-by-Step: Setting Up Data Mining

### Step 1: Create Market Nodes

1. Expand your Stock/Forex Exchange node
2. Click on **"Stock Markets"** or **"Forex Markets"**
3. Right-click and **"Add Stock Market"** or **"Add Forex Market"**

### Step 2: Configure the Market

Click on the market node and configure:

**For Stocks:**
```json
{
    "codeName": "AAPL/USD",
    "type": "stock"
}
```

**For Forex:**
```json
{
    "codeName": "XAU/USD",
    "type": "precious-metal",
    "pipSize": 0.01,
    "lotSize": 100
}
```

### Step 3: Set Up Data Mining Task

1. Go to your **Network** hierarchy
2. Create a **Task Manager**
3. Add a **Task** node
4. Configure the task to reference your market

### Step 4: Run the Data Miner

1. Right-click on the Task
2. Select **"Run"**
3. Watch the progress in the console

**Data is stored in:**
```
/Data-Storage/
├── [Exchange]/
│   ├── [Market]/
│   │   ├── Candles/
│   │   │   └── One-Min/
│   │   │       └── [YYYY]/[MM]/[DD]/Data.json
│   │   └── Volumes/
│   │       └── One-Min/
│   │           └── [YYYY]/[MM]/[DD]/Data.json
```

## Data Providers

| Provider | Cost | Stocks | Forex | Historical |
|----------|------|--------|-------|------------|
| Yahoo Finance | Free | Yes | Limited | 7 days 1-min |
| Alpha Vantage | Free* | Yes | Yes | Limited |
| Polygon | Paid | Yes | No | Full |
| OANDA | Free** | No | Yes | Full |
| Twelve Data | Free* | Yes | Yes | Limited |

*Free tier with rate limits
**With account

---

# 7. Building Your First Trading Strategy

## Understanding the Trading System Hierarchy

```
Trading System
├── Trading Strategies (array of strategies)
│   └── Trading Strategy
│       ├── Trigger Stage (when to start looking)
│       ├── Open Stage (when to enter)
│       ├── Manage Stage (while in position)
│       └── Close Stage (when to exit)
├── Dynamic Indicators (custom indicators)
└── Parameters (configuration)
```

## Step-by-Step: Creating a Simple Moving Average Strategy

We'll create a strategy that:
- **Buys** when price crosses above the 20 EMA
- **Sells** when price crosses below the 20 EMA

### Step 1: Create the Trading System

1. Right-click on the canvas
2. Add **"Trading System"**
3. Name it "My Stock Trading System"

### Step 2: Add a Trading Strategy

1. Expand the Trading System
2. Click on **"Trading Strategies"**
3. Right-click and **"Add Trading Strategy"**
4. Name it "EMA Crossover Strategy"

### Step 3: Configure the Trigger Stage

The Trigger Stage defines WHEN the strategy starts looking for trades.

1. Click on **"Trigger Stage"**
2. Add a **"Trigger On Event"**
3. Add a **"Situation"** under the event
4. Add a **"Condition"** under the situation
5. Configure the condition:

```javascript
// Trigger when we have enough data
chart.at01hs.candle.close > 0
```

### Step 4: Configure the Open Stage

The Open Stage defines WHEN to enter a trade.

**For Buy Signal:**
1. Click on **"Open Stage"**
2. Add **"Open Execution"**
3. Add a **"Situation"**
4. Add a **"Condition"**
5. Configure:

```javascript
// Buy when price crosses above EMA 20
chart.at01hs.candle.close > chart.at01hs.ema020.ema &&
chart.at01hs.candle.previous.close < chart.at01hs.ema020.previous.ema
```

### Step 5: Configure Position Size

Under Open Execution, add:

**For Stocks (number of shares):**
```javascript
// Buy 10 shares
10
```

**For Forex (lot size):**
```javascript
// Trade 0.1 lots
0.1
```

### Step 6: Configure the Close Stage

**For Sell Signal:**
1. Click on **"Close Stage"**
2. Add **"Close Execution"**
3. Add a **"Situation"** and **"Condition"**
4. Configure:

```javascript
// Sell when price crosses below EMA 20
chart.at01hs.candle.close < chart.at01hs.ema020.ema &&
chart.at01hs.candle.previous.close > chart.at01hs.ema020.previous.ema
```

### Step 7: Add Stop Loss (Manage Stage)

1. Click on **"Manage Stage"**
2. Add **"Stop Loss"**
3. Add **"Phase 1"**
4. Configure:

```javascript
// Stop loss at 2% below entry
tradingEngine.tradingCurrent.position.entryTargetRate.value * 0.98
```

### Step 8: Add Take Profit

1. Under Manage Stage, add **"Take Profit"**
2. Add **"Phase 1"**
3. Configure:

```javascript
// Take profit at 5% above entry
tradingEngine.tradingCurrent.position.entryTargetRate.value * 1.05
```

---

## Example Strategy Configurations

### Strategy 1: Simple Buy and Hold

**Condition to Buy:**
```javascript
// Buy at the start and hold
tradingEngine.tradingCurrent.strategy.stageType.value === "No Stage"
```

**Condition to Sell:**
```javascript
// Never sell (hold forever)
false
```

### Strategy 2: RSI Oversold/Overbought

**Buy Condition:**
```javascript
// Buy when RSI below 30 (oversold)
chart.at01hs.rsi.rsi < 30
```

**Sell Condition:**
```javascript
// Sell when RSI above 70 (overbought)
chart.at01hs.rsi.rsi > 70
```

### Strategy 3: XAU/USD Breakout Strategy

**Buy Condition:**
```javascript
// Buy when gold breaks above previous high
chart.at01hs.candle.close > chart.at01hs.candle.previous.max &&
chart.at01hs.volume.current > chart.at01hs.volume.previous * 1.5
```

**Sell Condition:**
```javascript
// Sell when gold breaks below previous low
chart.at01hs.candle.close < chart.at01hs.candle.previous.min
```

---

# 8. Backtesting Your Strategy

## What is Backtesting?

Backtesting runs your strategy against historical data to see how it would have performed.

## Step-by-Step: Running a Backtest

### Step 1: Create a Backtesting Session

1. Go to your **Network** hierarchy
2. Under your Trading Task, find **"Backtesting Session"**
3. Configure the session:

```json
{
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "initialBalance": 10000,
    "slippage": 0.001,
    "feePerOrder": 0
}
```

### Step 2: Connect References

Make sure your backtesting session references:
- Your Trading System
- Your Trading Engine
- Your Data Mine

### Step 3: Run the Backtest

1. Right-click on the Backtesting Session
2. Select **"Run"**
3. Wait for completion

### Step 4: Analyze Results

After the backtest completes, check:

| Metric | Description | Good Value |
|--------|-------------|------------|
| Total Profit/Loss | Net profit or loss | Positive |
| Win Rate | Percentage of winning trades | > 50% |
| Profit Factor | Gross profit / Gross loss | > 1.5 |
| Max Drawdown | Largest peak-to-trough decline | < 20% |
| Sharpe Ratio | Risk-adjusted return | > 1.0 |

---

# 9. Live Trading

## Before Going Live

**Checklist:**
- [ ] Strategy thoroughly backtested
- [ ] Paper traded for at least 2 weeks
- [ ] Stop loss and take profit set
- [ ] Risk per trade defined (max 1-2%)
- [ ] API keys secured
- [ ] Broker account funded

## Step-by-Step: Starting Live Trading

### Step 1: Switch to Live Mode

Update your exchange configuration:

```json
{
    "codeName": "alpaca",
    "apiKey": "YOUR_LIVE_API_KEY",
    "apiSecret": "YOUR_LIVE_SECRET",
    "paperTrading": false
}
```

### Step 2: Create a Live Trading Session

1. In your Network hierarchy
2. Add a **"Live Trading Session"**
3. Configure session parameters:

```json
{
    "startDate": "2025-01-01",
    "initialBalance": 10000,
    "slippage": 0.001
}
```

### Step 3: Risk Management Settings

Configure your Trading System's parameters:

```json
{
    "riskPercentage": 1,
    "maxOpenPositions": 3,
    "maxDailyLoss": 500
}
```

### Step 4: Start the Bot

1. Right-click on Live Trading Session
2. Select **"Run"**
3. Monitor in the console

## Monitoring Your Bot

### Key Things to Watch

1. **Order Execution** - Are orders being filled?
2. **Position Size** - Is sizing correct?
3. **P&L** - Track profit/loss in real-time
4. **Errors** - Watch for API errors

### Emergency Stop

To stop the bot immediately:
1. Right-click on the session
2. Select **"Stop"**

Or press `Ctrl+C` in the terminal.

---

# 10. Tracking Your Models & Performance

## What is a "Model" in Superalgos?

A **Model** in Superalgos is your complete trading setup, which includes:
- Your **Trading System** (strategy logic)
- Your **Trading Engine** (execution tracking)
- Your **Session** (backtesting, paper, or live)

## Creating and Saving Models

### Step 1: Build Your Trading System

Your Trading System IS your model. It contains all your trading rules:

```
My Trading System (MODEL)
├── Trading Strategies
│   └── Strategy 1: "Gold Breakout"
│       ├── Trigger Stage (when to watch)
│       ├── Open Stage (when to buy/sell)
│       ├── Manage Stage (stop loss, take profit)
│       └── Close Stage (when to exit)
└── Parameters
    ├── Risk Percentage: 1%
    └── Max Positions: 3
```

### Step 2: Save Your Model as a Workspace

1. **Right-click** on an empty area of the canvas
2. Select **"Workspace"** → **"Save Workspace As"**
3. Enter a name like `my-xauusd-breakout-model`
4. Click **Save**

Your entire setup is now saved and can be reloaded anytime!

### Step 3: Create Multiple Model Versions

To track different versions of your strategy:

1. Save your current workspace: `gold-strategy-v1`
2. Make changes to your strategy
3. Save again: `gold-strategy-v2`
4. Compare backtest results between versions

## Tracking Performance Metrics

### Trading Engine Performance Data

The **Trading Engine** node automatically tracks your performance:

```
Trading Engine
└── Trading Current
    ├── Strategy
    │   ├── Begin
    │   ├── End
    │   └── Begin-End
    ├── Position
    │   ├── Entry Rate
    │   ├── Exit Rate
    │   ├── Profit/Loss
    │   └── ROI
    └── Episode
        ├── Days Traded
        ├── Hit Ratio
        ├── Total Profit/Loss
        └── Annualized ROI
```

### Key Metrics to Track

| Metric | Where to Find | What It Means |
|--------|---------------|---------------|
| **Hit Ratio** | Trading Engine → Episode → Hit Ratio | Win rate (% of winning trades) |
| **Profit Factor** | Trading Engine → Episode | Gross profit / Gross loss |
| **Total P&L** | Trading Engine → Episode → Profit Loss | Net profit or loss |
| **ROI** | Trading Engine → Episode → ROI | Return on investment |
| **Max Drawdown** | Trading Engine → Episode | Largest peak-to-trough drop |
| **Days Traded** | Trading Engine → Episode | Trading days in session |

### Viewing Performance in Real-Time

During a trading session (backtest or live):

1. **Expand the Trading Engine** node in your workspace
2. Navigate to **Trading Current** → **Episode**
3. **Right-click** → **"Watch Value"** on any metric
4. The value will update in real-time on the canvas

### Exporting Performance Data

Performance data is saved to files after each session:

```
/Data-Storage/
└── [Exchange]/
    └── [Market]/
        └── Output/
            └── Trading-Engine/
                └── [Session-Name]/
                    ├── Episode.json       (overall performance)
                    ├── Positions.json     (each trade)
                    └── Strategies.json    (strategy stats)
```

## Comparing Multiple Models

### Method 1: Side-by-Side Backtests

1. Create **multiple backtesting sessions** for different strategies
2. Run them on the **same date range**
3. Compare the Episode metrics

### Method 2: Model Journal

Keep a simple log:

| Model Name | Date | Win Rate | Profit Factor | Total P&L | Notes |
|------------|------|----------|---------------|-----------|-------|
| Gold-Breakout-v1 | 2025-01-01 | 45% | 1.2 | +$500 | Basic breakout |
| Gold-Breakout-v2 | 2025-01-02 | 52% | 1.5 | +$800 | Added volume filter |
| Gold-Breakout-v3 | 2025-01-03 | 48% | 1.8 | +$1200 | Improved stop loss |

### Method 3: Using Different Workspaces

```bash
# Save different models as different workspaces
Workspaces/
├── stock-ema-crossover.json
├── forex-rsi-strategy.json
├── gold-breakout-model.json
└── options-iron-condor.json
```

Load and switch between them from the menu:
1. Click **Workspace** → **Load Workspace**
2. Select the model you want to use

## Quick Start: Track Your First Model

### Complete Example: XAU/USD Gold Trading Model

**Step 1: Create Trading System**
```
Trading System: "Gold Day Trading"
├── Strategy: "Buy Low, Sell High"
│   ├── Trigger: Always active during market hours
│   ├── Open: Buy when RSI < 30
│   ├── Manage:
│   │   ├── Stop Loss: -1%
│   │   └── Take Profit: +2%
│   └── Close: Sell when RSI > 70
└── Parameters:
    ├── riskPercentage: 1
    └── maxOpenPositions: 1
```

**Step 2: Backtest on Historical Data**
- Date range: Last 3 months
- Initial balance: $10,000
- Record the results

**Step 3: Save Your Model**
- Save workspace as `gold-rsi-strategy-v1`

**Step 4: Iterate and Improve**
- Adjust parameters
- Backtest again
- Compare results
- Save as `gold-rsi-strategy-v2`

**Step 5: Paper Trade Best Model**
- Run paper trading for 1-2 weeks
- Monitor real-time performance
- Confirm strategy works in live conditions

**Step 6: Go Live**
- Switch to live trading
- Track performance daily
- Keep your model journal updated

---

# 11. Broker Configuration Reference

## Complete Configuration Examples

### Alpaca
```json
{
    "codeName": "alpaca",
    "apiKey": "PKXXXXXXXXXXXXXXXX",
    "apiSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "paperTrading": true,
    "dataProvider": "yahoo"
}
```

### Interactive Brokers
```json
{
    "codeName": "interactive-brokers",
    "gatewayUrl": "https://localhost:5000",
    "accountId": "UXXXXXXX",
    "paperTrading": true
}
```

### TradeStation
```json
{
    "codeName": "tradestation",
    "apiKey": "YOUR_API_KEY",
    "apiSecret": "YOUR_API_SECRET",
    "accessToken": "YOUR_ACCESS_TOKEN",
    "refreshToken": "YOUR_REFRESH_TOKEN",
    "accountId": "YOUR_ACCOUNT_ID",
    "paperTrading": true
}
```

### Tradier
```json
{
    "codeName": "tradier",
    "apiKey": "YOUR_ACCESS_TOKEN",
    "accountId": "YOUR_ACCOUNT_ID",
    "paperTrading": true
}
```

### OANDA
```json
{
    "codeName": "oanda",
    "apiKey": "your-api-token-here",
    "accountId": "XXX-XXX-XXXXXXXX-XXX",
    "practice": true
}
```

### MetaTrader 4
```json
{
    "codeName": "mt4",
    "platform": "mt4",
    "bridgeType": "rest",
    "host": "localhost",
    "port": 8080,
    "accountId": "12345678"
}
```

### MetaTrader 5
```json
{
    "codeName": "mt5",
    "platform": "mt5",
    "bridgeType": "zeromq",
    "host": "localhost",
    "port": 32768,
    "accountId": "12345678"
}
```

---

# 12. Troubleshooting

## Common Issues and Solutions

### Issue: "Unsupported broker" Error

**Cause:** The `codeName` doesn't match a supported broker.

**Solution:** Check the spelling and use one of:
- `alpaca`
- `interactive-brokers` or `ibkr`
- `tradestation`
- `tradier`
- `oanda`
- `metatrader` or `mt4` or `mt5`

### Issue: "API Key Invalid"

**Cause:** Wrong API credentials.

**Solution:**
1. Verify you're using the correct keys
2. Check if paper trading keys vs live keys
3. Regenerate keys if needed

### Issue: "Connection Refused" (IBKR)

**Cause:** TWS/IB Gateway not running or API not enabled.

**Solution:**
1. Make sure TWS or IB Gateway is running
2. Check API is enabled in settings
3. Verify the port number (7497 for paper, 7496 for live)
4. Allow localhost connections

### Issue: "No Data" in Charts

**Cause:** Data mining hasn't been run.

**Solution:**
1. Set up data mining tasks
2. Run the sensor bot to fetch data
3. Wait for data to be saved

### Issue: MetaTrader Not Connecting

**Cause:** Bridge EA not properly installed.

**Solution:**
1. Verify EA is attached to a chart
2. Check "Allow DLL imports" is enabled
3. Verify port numbers match
4. Check Windows Firewall settings

### Issue: "Insufficient Buying Power"

**Cause:** Not enough funds in account.

**Solution:**
1. Reduce position size
2. Add funds to account
3. Close existing positions

## Getting Help

1. **Documentation:** https://docs.superalgos.org/
2. **GitHub Issues:** https://github.com/Superalgos/Superalgos/issues
3. **Telegram Community:** https://t.me/superalgos

---

# Appendix A: Popular Stock Symbols

| Symbol | Company | Sector |
|--------|---------|--------|
| AAPL | Apple Inc. | Technology |
| MSFT | Microsoft | Technology |
| GOOGL | Alphabet | Technology |
| AMZN | Amazon | Consumer |
| TSLA | Tesla | Automotive |
| NVDA | NVIDIA | Semiconductors |
| META | Meta Platforms | Technology |
| JPM | JPMorgan Chase | Finance |
| V | Visa | Finance |
| JNJ | Johnson & Johnson | Healthcare |

---

# Appendix B: Forex Pair Reference

## Major Pairs
| Pair | Name | Pip Size |
|------|------|----------|
| EUR/USD | Euro/US Dollar | 0.0001 |
| GBP/USD | British Pound/USD | 0.0001 |
| USD/JPY | US Dollar/Yen | 0.01 |
| USD/CHF | US Dollar/Swiss Franc | 0.0001 |

## Precious Metals
| Pair | Name | Pip Size |
|------|------|----------|
| XAU/USD | Gold/US Dollar | 0.01 |
| XAG/USD | Silver/US Dollar | 0.001 |

---

# Appendix C: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Scroll Wheel | Zoom in/out |
| Click + Drag | Pan canvas |
| Right Click | Open menu |
| Double Click | Expand/collapse |
| Ctrl + S | Save workspace |
| Ctrl + Z | Undo |
| Escape | Cancel action |

---

# Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Backtesting** | Testing a strategy on historical data |
| **Paper Trading** | Trading with simulated money |
| **Stop Loss** | Order to limit losses |
| **Take Profit** | Order to secure profits |
| **Pip** | Smallest price movement |
| **Lot** | Standard trading unit (forex) |
| **Drawdown** | Peak-to-trough decline |
| **Slippage** | Difference between expected and executed price |
| **API** | Application Programming Interface |
| **HFT** | High-Frequency Trading |

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Author:** Stock-Forex-Trading Project Contributors

---

*This manual is part of the Superalgos open-source project. For the latest updates, visit https://github.com/Superalgos/Superalgos*
