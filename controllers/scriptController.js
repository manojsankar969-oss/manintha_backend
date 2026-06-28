const geminiService = require('../services/geminiService');
const dbService = require('../services/dbService');

/**
 * Handles POST /api/generate
 */
const generateScript = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const inputs = req.body;

    console.log(`Generating script for staff: "${inputs.staff_name}" (User ID: ${userId})`);

    // Generate AI script (returns structured JSON)
    const aiOutput = await geminiService.generateUpsellScript(inputs);

    // Estimate token usage (roughly 4 characters per token)
    const inputLength = JSON.stringify(inputs).length;
    const outputLength = JSON.stringify(aiOutput).length;
    const estimatedTokens = Math.ceil((inputLength + outputLength) / 4);

    // Combine inputs and AI output
    const generationData = {
      ...inputs,
      recommended_upgrade: aiOutput.recommended_upgrade,
      upgrade_price: aiOutput.upgrade_price,
      why_upgrade: aiOutput.why_upgrade,
      suggested_script: aiOutput.suggested_script,
      pricing_comparison: aiOutput.pricing_comparison,
      expected_benefits: aiOutput.expected_benefits,
      objection_handling: aiOutput.objection_handling,
      confidence_score: aiOutput.confidence_score,
      token_cost: estimatedTokens
    };

    // Save into database
    const dbRecord = await dbService.createGeneration(userId, generationData);

    // Record audit log
    await dbService.createAuditLog(
      userId,
      'GENERATE_SCRIPT',
      `Generated upsell script (ID: ${dbRecord.id}) for customer "${inputs.customer_name}" to "${inputs.destination}". Upgrade: "${aiOutput.recommended_upgrade}"`,
      req.ip
    );

    console.log(`✅ AI Response generated successfully. ID: ${dbRecord.id}`);
    return res.status(201).json(dbRecord);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateScript
};
