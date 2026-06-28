const { model } = require('../config/gemini');

/**
 * Formulates the prompt and generates a structured upsell script from Gemini.
 * @param {Object} inputs - The detailed customer and booking inputs.
 * @returns {Promise<Object>} The generated script structure.
 */
const generateUpsellScript = async (inputs) => {
  const prompt = `
    You are a senior sales excellence coach for Manivtha Tours & Travels, a premium car rental and tour operator in Hyderabad, India.
    Your task is to craft a highly persuasive, professional upsell conversation script that staff can deliver naturally to the customer.

    CUSTOMER PROFILE & TRIP CONTEXT:
    - Sales Staff: ${inputs.staff_name}
    - Customer Name: ${inputs.customer_name}
    - Destination: ${inputs.destination}
    - Travel Date: ${inputs.travel_date || 'Not specified'}
    - Trip Duration: ${inputs.trip_duration || 'Not specified'}
    - Budget Level: ${inputs.budget || 'Medium'}
    - Vehicle Type Preferred: ${inputs.vehicle_type || 'Any'}
    - Number of Passengers: ${inputs.num_passengers || 1}
    - Trip Purpose: ${inputs.purpose || 'Tourism'} (e.g. Family, Business, Wedding, Tourism)
    - Luxury Level: ${inputs.luxury_level || 'Premium'} (Basic, Premium, Luxury)
    - Special Requests: ${inputs.special_requests || 'None'}
    - Desired Add-ons: ${Array.isArray(inputs.addons) ? inputs.addons.join(', ') : inputs.addons || 'None'}

    CURRENT BOOKING DETAILS:
    - Booked Package: ${inputs.current_package || 'Standard Rental'}
    - Booked Vehicle: ${inputs.current_vehicle || 'Standard'}
    - Base Price: INR ${inputs.current_price || 'N/A'}
    - Booked Add-ons: ${inputs.current_addons || 'None'}

    UPSELL STRATEGY:
    Recommend a logical, high-value upgrade tailored to the customer's specific trip purpose and passenger count.
    If the trip is family-oriented, emphasize space, safety, and comfort. For business, focus on impression, Wi-Fi, and reliability. For weddings, highlight style, elegance, and VIP treatment. For tourism, stress sightseeing value, guide availability, and hotel tie-ups.
    Always suggest a realistic upgrade (one class above current vehicle) along with relevant add-ons.

    RESPONSE STRUCTURE — Split the suggested_script into these four clear parts:
    1. Personalised Greeting: Warm opening that mentions the customer's name and their specific trip.
    2. Value Proposition: Why the upgrade fits their needs (referencing their purpose, passengers, special requests).
    3. Pricing Comparison: Transparent cost comparison — current price vs upgrade price, highlighting the added value.
    4. Objection Handling & Closing: Address likely concerns and end with a confident call to action.

    For objection_handling, provide 2-3 likely customer objections (like "It's over my budget", "I don't think I need it", "I'll think about it") along with ready-to-use professional rebuttals for each.

    Provide your response in a structured JSON format matching the schema.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            recommended_upgrade: { 
              type: "string", 
              description: "The name of the suggested upgraded package or vehicle (e.g. 'Premium Toyota Fortuner SUV Package')" 
            },
            upgrade_price: {
              type: "string",
              description: "Estimated price of the upgraded package in INR (e.g. 'INR 18,000')."
            },
            why_upgrade: {
              type: "array",
              items: { type: "string" },
              description: "3-4 concise bullet points explaining why the customer should upgrade based on their profile."
            },
            suggested_script: { 
              type: "string", 
              description: "Complete sales script split into: 1) Personalised Greeting, 2) Value Proposition, 3) Pricing Comparison, 4) Objection Handling & Closing. Natural, persuasive, ready to speak." 
            },
            pricing_comparison: {
              type: "string",
              description: "A clear cost comparison showing current price vs upgrade price with the added value highlighted (e.g. 'Current: INR 6,000 | Upgrade: INR 11,000 | Extra value: 5-star hotel + guide + 40% more space')."
            },
            expected_benefits: {
              type: "array",
              items: { type: "string" },
              description: "3-4 short phrases of benefits (e.g. '✓ 40% Extra Legroom', '✓ Luggage Space', '✓ VIP Chauffeur')"
            },
            objection_handling: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  objection: { type: "string", description: "The customer's likely concern (e.g. 'This seems expensive')" },
                  rebuttal: { type: "string", description: "A professional, empathetic response the staff can use" }
                },
                required: ["objection", "rebuttal"]
              },
              description: "2-3 likely customer objections with ready-to-use rebuttals."
            },
            confidence_score: { 
              type: "string", 
              enum: ["High", "Medium", "Low"],
              description: "Assessment of upsell acceptance probability." 
            }
          },
          required: ["recommended_upgrade", "upgrade_price", "why_upgrade", "suggested_script", "pricing_comparison", "expected_benefits", "objection_handling", "confidence_score"]
        }
      }
    });

    if (!result || !result.response) {
      throw new Error('Did not receive a response from the Gemini API.');
    }

    const text = result.response.text();
    const parsedData = JSON.parse(text);
    return parsedData;
  } catch (err) {
    console.error('❌ Gemini generation error:', err);
    throw new Error(`Failed to generate AI upsell script: ${err.message}`);
  }
};

module.exports = {
  generateUpsellScript
};
