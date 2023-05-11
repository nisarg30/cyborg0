var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSchema = new Schema({
	
	email: String,
	username: String,
	password: String,
	passwordConf: String,
	balance : Number,
	portfolio: [{
		_id : false,
		stockname  : String,
        quantity   : Number,
        buy_price   : Number
	}]
},{ collection: 'user'});

User = mongoose.model('Users', userSchema);

module.exports = User;