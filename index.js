const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');
const Capturas = require('./models/Capturas');
const mongoURI = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017";
const postServerURL = process.env.POSTSERVER_URL || "http://localhost:3000/save"
mongoose.connect(mongoURI).then(() => console.log('db connected'));

const postInterval = process.env.POSTINTERVAL || 60;

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
        windowCaptured: { timelapse: 0, max:60 },
        debug: true,
        regularEvents: "click keydown",
        pollingEvents: "mousemove scroll",
        pollingMs: 150,
        postServer: postServerURL,
        postInterval: postInterval,
        saveAttributes: false,
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
    let data;
    try {
      data = req.body ? JSON.parse(req.body.setup).postdata : {};
    } 
    catch (error) {
      res.status(422).send({
        message:'Formato de captura incorrecta'
      });
      return
    }
    try {
      data.info = data.info.map((actualData) => {
        let parsed = JSON.parse(actualData);
        parsed["extraInfo"] = JSON.parse(parsed["extraInfo"]);
        return parsed;
      });
      importData(data);
      res.status(201).send({
      	message:'La captura se ha procesado correctamente'
      });
    }
    catch (error) {
      res.status(422).send({
        message:'Formato de eventos incorrecto'
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

const ITEMS_PER_PAGE = 10;
app.get("/fetchall", async (req, res) => {
  const providedPassword = req.query.pass;

  if (providedPassword !== DATA_PASS) {
    return res.status(401).send({ message: 'No tienes acceso' });
  }

  const page = parseInt(req.query.page) || 1;

  try {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const data = await Capturas.find({}).skip(skip).limit(ITEMS_PER_PAGE).exec();
    res.json(data);
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.status(500).send({ message: 'Error interno del servidor' });
  }
});
