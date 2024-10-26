const mongoose = require("mongoose");

const RuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  ruleString: {
    type: String,
    required: true,
  },
  ast: {
    type: Object,
    required: true,
  },
});

module.exports = mongoose.model("Rule", RuleSchema);
