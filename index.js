const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const fs = require('fs');

app.use(cors());
app.use(express.json());

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
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
  
app.post('/save', (req, res) => {
    console.log('Body', req.body)
    let info = req.body ? JSON.parse(req.body?.setup).postdata : {}

    console.log('Info', info.info)
    info.info.length ? console.log('Split', JSON.parse(info.info[0])) : console.log('vacio')
    res.send(JSON.stringify({"userToken": "asdasdasd"}));

    fs.writeFileSync('test.json', JSON.stringify(info))
});


