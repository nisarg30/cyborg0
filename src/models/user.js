var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const userSchema = new Schema({
	
	email: String,
	username: String,
	password: String,
	balance : Number,
	limitcount : Number,
	watchlists : [{
		_id : false,
		watchlist : {
			_id : false,
			name : String,
			array : [{
				_id : false,
				stockname : String,
			}]
		}}
	],
	portfolio: [{
		_id : false,
		stockname  : String,
        quantity   : Number,
        buy_price   : Number
	}]
},{ collection: 'user'});

User = mongoose.model('Users', userSchema);

module.exports = User;