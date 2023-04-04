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
    info: [String],
    task: String,
    action: String,
});

const Capturas = mongoose.model('Captura', CapturasSchema);

module.exports = Capturas;