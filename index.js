const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');
const Capturas = require('./models/Capturas');
const mongoURI = process.env.MONGODB_URL;
mongoose.connect(mongoURI).then(() => console.log('db connected'));

const app = express();
app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});

const alphabet = "qwertyuiopasdfghjklñzxcvbnmQWERTYUIOPASDFGHJKLÑZXCVBNM";
const numbers = "0123456789";
function itsLetterOrNumber(text) {
  if (alphabet.includes(text)) {
    return 'a';
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
        postServer: "http://localhost:3000/save",
        postInterval: 5,
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

    let data = req.body ? JSON.parse(req.body?.setup).postdata : {};
    data.info = data.info.map((value) => JSON.parse(value));
    importData(data);
});


