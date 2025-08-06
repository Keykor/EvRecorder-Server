const mongoose = require('mongoose');
const Schema = mongoose.Schema

const RecordSchema = new Schema({
    userId: String,
    tabId: Number,
    url: String,
    startTime: Number,
    endTime: Number,
    events: [Schema.Types.Mixed]
});

const Record = mongoose.model('Record', RecordSchema);

module.exports = Record;