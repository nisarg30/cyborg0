const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const mongoose = require('mongoose');
const spp = require('./src/models/stockprice.js');
const auth = require('otplib');
const tokent_to_stock = require('./x.json');
const limit_execution = require('./src/utls/limitexe.js');
async function aaaa(){
  let smart_api = new SmartAPI({
    api_key: 'D5FRzqDP',
});
  const secret = 'TYNM4D6BQVQL63C6G3CISPCUOI';
  const token = auth.authenticator.generate(secret);
  const xyz = await smart_api.generateSession('G222234', '2580', token);
  return xyz.data;
}

var db = [];
const getConnection = async () => {
    try {
      mongoose.set('strictQuery', false);
  
      await mongoose.connect(
        'mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority',
        { useNewUrlParser: true, useUnifiedTopology: true }
      );
  
      console.log('Connection to DB Successful');
  
      db = await spp.find({});
      var array = db.map(obj => obj.token);
      var aaa = array.slice(1,1000);
      const rtg = await aaaa();
      abc(aaa, rtg);
    } catch (err) {
      console.error('Connection to DB Failed:', err);
    }
  };
  
getConnection();


function abc(array, data){
    const web_socket = new WebSocketV2({
      jwttoken: data.jwtToken,
	    apikey: 'D5FRzqDP',
	    clientcode: "G222234",
	    feedtype: data.feedToken,
    });
    
    web_socket.connect().then((res) => {
        let json_req = {
            "correlationID": "abcde12345",
            "action": 1,
            "mode": 1,
            "exchangeType": 1,
            "tokens": array
        };
    
        web_socket.fetchData(json_req);
        web_socket.on('tick', receiveTick);
    
        async function receiveTick(data) {
            console.log('receiveTick:::::', data.last_traded_price) ;
            if(data.token !== undefined) {
              const tokenWithQuotes = data.token;
              const tokenWithoutQuotes = tokenWithQuotes.replace(/['"]+/g, '');
                const price = parseInt(data.last_traded_price, 10)/100;
                const x = await spp.updateOne(
                  { token : tokenWithoutQuotes},
                  [{
                      $set: {
                          previousprice: "$currentprice",
                          currentprice: price
                      }
                  }]
              );
              limit_execution(tokent_to_stock[tokenWithoutQuotes]).then(() => {
                  console.log("limit_exe");
              });
                // console.log(x);
            }
        }
    });
}