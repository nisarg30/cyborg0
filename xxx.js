const fs = require('fs');
const mongoose = require('mongoose');
const Prices = require('./src/models/stockprice.js'); // Adjust the path to where your Prices model is located
const limit = require('./src/models/limit.js')

// MongoDB Connection URL
const mongoDB = 'mongodb+srv://nisargpatel0466:nn__4569@cluster0.lsqbqko.mongodb.net/cyborg0?retryWrites=true&w=majority'; // Change 'yourDatabase' to your actual database name

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Function to update the database
async function updateDatabase() {
  const rawData = fs.readFileSync('./tt.json'); // Change the path to your actual JSON file
  const data = JSON.parse(rawData);

  for (let item of data) {
    const { token, name } = item;

    const updatedData = new Prices({
        stockname: name,
        token: token,
        currentprice : 0,
        previousprice : 0,
        close : 0,
    });

    updatedData.save().then(() => {console.log("SUCCESS")});
  }

  console.log('Database has been updated with stock names.');
}

// Run the update function
updateDatabase().then(() => {
//   mongoose.disconnect(); // Disconnect from the database when done
});

async function fetchAndSaveData() {
    try {
      // Fetch all documents
      const allData = await Prices.find({});

      allData.map((item) => {
        const bod = new limit({
          stockname : item.stockname,
          log : []
        })

        bod.save().then(result => {
          console.log(result);
        })
      })
    //   let dataToSave = {};
  
    //   // Process data into token: stockname pairs
    //   allData.forEach(item => {
    //     dataToSave[item.token] = item.stockname;
    //   });
  
    //   // Save to file
    //   fs.writeFileSync('x.json', JSON.stringify(dataToSave, null, 2));
    //   console.log('Data has been saved to x.json');
    } catch (error) {
      console.error('Failed to fetch or save data:', error);
    } finally {
      // Disconnect from database
      // mongoose.disconnect();
    }
}
  
  // Run the function
  // fetchAndSaveData();
