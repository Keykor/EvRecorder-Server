const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');
const Capturas = require('./models/Capturas');
const mongoURI = process.env.MONGODB_URL;
const postServerURL = process.env.POSTSERVER_URL
mongoose.connect(mongoURI).then(() => console.log('db connected'));

const app = express();
app.use(cors());
app.use(express.json({limit: '25mb'}));

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});

const alphabet = "qwertyuiopasdfghjklñzxcvbnm";
const alphabetCaps = "QWERTYUIOPASDFGHJKLÑZXCVBNM";
const numbers = "0123456789";
function itsLetterOrNumber(text) {
  if (alphabet.includes(text)) {
    return 'a';
  }
  if (alphabetCaps.includes(text)) {
    return 'A';
  }
  if (numbers.includes(text)) {
    return '1';
  }
  return text;
}


app.get('/start', (req, res) => {
    console.log('Me pidieron settings');
    let settings = {
        sendDataMode: 'JSON',
        completionMode : {type:'postQuantity', params: 1},
        userToken:'asdasdasd',
        windowCaptured: { timelapse: 5, max:60 },
        debug: true,
        regularEvents: "click keydown",
        pollingEvents: "mousemove scroll",
        pollingMs: 150,
        postServer: postServerURL,
        postInterval: 60,
        saveAttributes: false,
        callback: (e) => {
            if (e.key) {
                return itsLetterOrNumber(e.key)
            }
        },
    }

    res.send(settings)
})
  
const importData = async (data) => {
  try {
    await Capturas.create(data);
    console.log('EXITO al importar captura.');
  } catch (error) {
    console.log('ERROR al importar captura.', error);
  }
}

app.post('/save', (req, res) => {
    res.send(JSON.stringify({"userToken": "si"}));

    let data = req.body ? JSON.parse(req.body.setup).postdata : {};
    console.log(data.info)
    data.info = data.info.map((value) => {
      let newValue = JSON.parse(value);
      newValue.extraInfo = JSON.parse(newValue.extraInfo);
      return newValue;
    });
    console.log(data.info)
    importData(data);
});


