const mongoose = require('mongoose'), Schema = mongoose.Schema;
const Document = require('./Document');

var subDoc = Document.clone().set('_id',false);

var Contribution = mongoose.Schema({
    doc: subDoc,
    meta: { type: Map, of: String }
});

module.exports = Contribution;