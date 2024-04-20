var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const priceSchema = new Schema({
	
	stockname : String,
    currentprice : Number,
    previousprice : Number,
    close : Number,
    token : String,
},{ collection: 'stockprice'});

Prices = mongoose.model('Prices', priceSchema);

module.exports = Prices;