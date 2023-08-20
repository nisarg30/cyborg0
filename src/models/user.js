var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const userSchema = new Schema({
	
	email: String,
	username: String,
	password: String,
	passwordConf: String,
	balance : Number,
	limitcount : Number,
	portfolio: [{
		_id : false,
		stockname  : String,
        quantity   : Number,
        buy_price   : Number
	}]
},{ collection: 'user'});

userSchema.pre('save', function (next) {
	if (this.isModified('valueToRound')) {
	  this.valueToRound = Math.round(this.valueToRound * 100) / 100; // Round to 2 decimal places
	}
	next();
});

User = mongoose.model('Users', userSchema);

module.exports = User;