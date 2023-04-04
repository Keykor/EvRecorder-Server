const mongoose = require('mongoose');
const Schema = mongoose.Schema

const CapturasSchema = new Schema({
    url: String,
    screenw: Number,
    screenh: Number,
    winw: Number,
    winh: Number,
    docw: Number,
    doch: Number,
    info: [{
        id: Number,
        timeNow: Date,
        cursorPosX: Number,
        cursorPosY: Number,
        eventName: String,
        elemXpath: String,
        elemAttrs: String,
        extraInfo: Object,
    }],
    task: String,
    action: String,
});

const Capturas = mongoose.model('Captura', CapturasSchema);

module.exports = Capturas;