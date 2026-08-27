const mongoose = require('mongoose');

const boxOfficeSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  collection: { type: String, required: true },
  budget: { type: String, required: true },
  status: { type: String, required: true },
  percent: { type: Number, required: true }
}, { suppressReservedKeysWarning: true });

module.exports = mongoose.model('BoxOffice', boxOfficeSchema);
