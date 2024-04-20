var mongoose = require('mongoose');
var Schema = mongoose.Schema;

tradeSchema = new Schema({

	username   : String,
    limit : [{
        _id : false,
        time : String,
        stockname : String,
        quantity : Number,
        direction : Number,
        ex_price : Number,
        ordertime : Number,
    }],
    delivery : [{
        _id : false,
        stockname  : String,
        realised : Number,
        dlog : [{
            _id : false,
            date : String,
            ex_price : Number,
            direction : Number,
            quantity : Number,
        }]
    }],
    intraday : [{
            _id : false,
            date       : String,
            logos :[{
            _id : false,
                stockname  : String,
                quantity   : Number,
                buy_price  : Number,
                sell_price : Number,
                realised   : Number
            }]
    }]
},{ collection: 'trade_log'});

tradeschema = mongoose.model('trade_lg', tradeSchema);

module.exports = tradeschema;