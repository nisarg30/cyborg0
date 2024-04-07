const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const mongoose = require('mongoose');
const spp = require('./src/models/stockprice.js');
const auth = require('otplib');
const tokent_to_stock = require('./x.json');
const limit_execution = require('./src/utls/limitexe.js');

const { getIO } = require('./src/socket.js');

async function aaaa(){
  let smart_api = new SmartAPI({
    api_key: 'D5FRzqDP',
});
  const secret = 'TYNM4D6BQVQL63C6G3CISPCUOI';
  const token = auth.authenticator.generate(secret);
  const xyz = await smart_api.generateSession('G222234', '2580', token);
  return xyz.data;
}

var array1;

const getConnection = async () => {
      db = await spp.find({});
      var array = db.map(obj => obj.token);
      array1 = db;
      var x = db.slice(577, 1000);
      console.log(x);
      var bbb = array.slice(1000,);
      const rtg = await aaaa();
      abc(bbb, rtg);
  };
  
module.exports = getConnection;

function abc(array, data) {
  // const array = array1.map(obj => obj.token);
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
      "mode": 2,
      "exchangeType": 1,
      "tokens": array
    };

    web_socket.fetchData(json_req);
    web_socket.on('tick', receiveTick);
    var x = 0;
    async function receiveTick(data) {
      if (data.token !== undefined) {
        
        const io = getIO();
        const tokenWithQuotes = data.token;
        const tokenWithoutQuotes = tokenWithQuotes.replace(/['"]+/g, '');
        
        const price = parseInt(data.last_traded_price, 10) / 100;
        // console.log(tokent_to_stock[tokenWithoutQuotes],price);
        if(price == 0) {
          x++;
          // console.log(tokent_to_stock[tokenWithoutQuotes], x);
          // for(var i=0; i<1000; i++) {
          //   // console.log(array1[i].stockname, tokent_to_stock[tokenWithoutQuotes]);
          //   if(array1[i].stockname == tokent_to_stock[tokenWithoutQuotes]) {
          //     console.log(i);
          //   }
          // }
        }
          io.to(tokent_to_stock[tokenWithoutQuotes]).emit('update', {
            stock: tokent_to_stock[tokenWithoutQuotes],
            price: price
          });

          await spp.updateOne(
            { token: tokenWithoutQuotes },
            [{
              $set: {
                previousprice: "$currentprice",
                currentprice: price
              }
            }]
          );
      }
    }
  });
}
