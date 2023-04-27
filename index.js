const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

require('dotenv').config()
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

app.get('/start', (req, res) => {
    console.log('Me pidieron settings');
    let settings = {
        sendDataMode: 'JSON',
        completionMode : {type:'postQuantity', params: 1},
        userToken:'asdasdasd',
        windowCaptured: { timelapse: 0, max:60 },
        debug: true,
        regularEvents: "click keydown",
        pollingEvents: "mousemove scroll",
        pollingMs: 150,
        postServer: postServerURL,
        postInterval: 60,
        saveAttributes: false,
        anonymizationTechnique: "replaceCharForConstant",
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
    try {
      let data = req.body ? JSON.parse(req.body.setup).postdata : {};
      data.info = data.info.map((value) => {
        return JSON.parse(value);
      });
      importData(data);
      res.status(201).send({
        message:'La captura se ha procesado correctamente'
      });
    } 
    catch (error) {
      res.status(422).send({
        message:'Formato de captura incorrecta'
      });
    }
});

app.get('/', function(req,res) {
  res.send('i live');
});

const DATA_PASS = process.env.DATA_PASS
app.get("/fetchall",(req,res) => {
  if (req.body.pass === DATA_PASS) {
    Capturas.find({}).exec(function(err, data) {
      res.send(data);
    })
  }
  else {
    res.status(401).send({
      message:'No tienes acceso'
    });
  }
})
