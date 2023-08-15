const fs = require('fs').promises;
const path = require('path');

async function read(stockname) {

    var obj = {
        ADANIENT: '0',
        ADANIPORTS: '1',
        APOLLOHOSP: '2',
        ASIANPAINT: '3',
        AXISBANK: '4',
        BAJAJ_AUTO: '5',
        BAJAJFINSV: '6',
        BAJFINANCE: '7',
        BHARTIARTL: '8',
        BPCL: '9',
        BRITANNIA: '10',
        CIPLA: '11',
        COALINDIA: '12',
        DIVISLAB: '13',
        DRREDDY: '14',
        EICHERMOT: '15',
        GRASIM: '16',
        HCLTECH: '17',
        HDFCBANK: '18',
        HDFCLIFE: '19',
        HEROMOTOCO: '20',
        HINDALCO: '21',
        HINDUNILVR: '22',
        ICICIBANK: '23',
        INDUSINDBK: '24',
        INFY: '25',
        ITC: '26',
        JSWSTEEL: '27',
        KOTAKBANK: '28',
        LT: '29',
        LTIM: '30',
        MARUTI: '31',
        'M_M': '32',
        NESTLEIND: '33',
        NTPC: '34',
        ONGC: '35',
        POWERGRID: '36',
        RELIANCE: '37',
        SBILIFE: '38',
        SBIN: '39',
        SUNPHARMA: '40',
        TATACONSUM: '41',
        TATAMOTORS: '42',
        TATASTEEL: '43',
        TCS: '44',
        TECHM: '45',
        TITAN: '46',
        ULTRACEMCO: '47',
        UPL: '48',
        WIPRO: '49'
    }
    try {
        const query = stockname.toUpperCase();
        const data = await fs.readFile(path.resolve('src/utls/data.csv'), 'utf8');
        const rows = data.split('\n');
        rows[obj[query]] = rows[obj[query]].split(',');
        return rows[obj[query]][1];
    } catch (error) {
        throw error;
    }
}

module.exports = async function call(stockname) {
    try {
        const data = await read(stockname);
        return data;
    } catch (error) {
        console.error('Error:', error);
        console.log('Rerunning...');
        return call(stockname); // Recursively rerun the function
    }
};








