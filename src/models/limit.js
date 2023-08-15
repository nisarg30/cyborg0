var mongoose = require('mongoose');
var Schema = mongoose.Schema;

limitSchema = new Schema({

	stockname   : String,
    log : [{
        _id : false,
        time : String,
        username   : String,
        quantity   : Number,
        ex_price   : Number,
        ordertime  : String,
        direction  : String
    }]
},{ collection: 'limit'});

limitschema = mongoose.model('limit_lg', limitSchema);

module.exports = limitschema;