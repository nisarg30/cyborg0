var mongoose = require('mongoose');
var Schema = mongoose.Schema;

tradeSchema = new Schema({

	username   : String,
    delivery : [{
        _id : false,
        stockname  : String,
        quantity   : Number,
        ex_price   : Number,
        realised   : Number
    }],
    intraday : [{
            _id : false,
            date       : String,
            logos :[{
            _id : false,
            stockname  : String,
            quantity   : Number,
            ex_price   : Number,
            realised   : Number
            }]
    }]
},{ collection: 'trade_log'});

tradeschema = mongoose.model('trade_lg', tradeSchema);

module.exports = tradeschema;