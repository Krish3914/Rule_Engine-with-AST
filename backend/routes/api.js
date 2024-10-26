const express = require("express");
const router = express.Router();
const Rule = require("../models/Rule");
const { createRule, combineRules, evaluateRule } = require("../utils/astUtils");

router.post("/create-rule", async (req, res) => {
  try {
    const { name, ruleString } = req.body;
    const ast = createRule(ruleString);
    const newRule = new Rule({ name, ruleString, ast });
    await newRule.save();
    res.json({ success: true, rule: newRule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/combine-rules", async (req, res) => {
  try {
    const { ruleStrings } = req.body;
    if (!Array.isArray(ruleStrings) || ruleStrings.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid input: expected non-empty array of rule strings",
      });
    }

    const combinedAst = combineRules(ruleStrings);
    res.json({ success: true, combinedAst });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/evaluate-rule", async (req, res) => {
  try {
    const { ast, data } = req.body;
    if (!ast || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing ast or data in the request body",
      });
    }
    const result = evaluateRule(ast, data);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
