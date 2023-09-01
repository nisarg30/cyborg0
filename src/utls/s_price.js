const spp = require('../models/stockprice');

async function read(stockname) {
    try {
        const query = stockname.toUpperCase();
        const data = await spp.findOne({ stockname : query });
        return data.currentprice;
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








