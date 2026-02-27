// Central ticker configuration — edit this file to change symbols
module.exports = {
  sectors: [
    { id: 'ai',            label: 'AI',            tickers: ['NVDA', 'GOOGL', 'AMD', 'PLTR'] },
    { id: 'energy',        label: 'Energy',        tickers: ['XOM', 'CVX', 'BP', 'SLB'] },
    { id: 'technology',    label: 'Technology',     tickers: ['MSFT', 'AAPL', 'META', 'AMZN'] },
    { id: 'leading_index', label: 'Leading Index',  tickers: ['SPY', 'QQQ', 'DIA', 'IWM'] },
  ],
};
