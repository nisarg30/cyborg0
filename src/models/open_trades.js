var mongoose = require('mongoose');
var Schema = mongoose.Schema;

openSchema = new Schema({

	username   : String,
    balance : Number,
    log : [{
        _id : false,
        stockname  : String,
        quantity   : Number,
        ex_price   : Number,
        direction  : String,
    }]
},{ collection: 'open_log'});

openschema = mongoose.model('open_lg', openSchema);

module.exports = openschema;