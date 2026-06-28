/**
 * Middleware to validate script generation input data.
 */
const validateGenerateInput = (req, res, next) => {
  const { 
    staff_name, 
    customer_name, 
    destination,
    current_package,
    current_vehicle,
    current_price
  } = req.body;

  if (!staff_name || typeof staff_name !== 'string' || !staff_name.trim()) {
    return res.status(400).json({ error: 'Staff name is required.' });
  }

  if (!customer_name || typeof customer_name !== 'string' || !customer_name.trim()) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  if (!destination || typeof destination !== 'string' || !destination.trim()) {
    return res.status(400).json({ error: 'Destination is required.' });
  }

  if (!current_package || typeof current_package !== 'string' || !current_package.trim()) {
    return res.status(400).json({ error: 'Current package description is required.' });
  }

  if (!current_vehicle || typeof current_vehicle !== 'string' || !current_vehicle.trim()) {
    return res.status(400).json({ error: 'Current vehicle is required.' });
  }

  if (!current_price || typeof current_price !== 'string' || !current_price.trim()) {
    return res.status(400).json({ error: 'Current price is required.' });
  }

  next();
};

/**
 * Middleware to validate feedback input data.
 */
const validateFeedbackInput = (req, res, next) => {
  const { generation_id, rating, comment } = req.body;

  if (generation_id === undefined || isNaN(parseInt(generation_id, 10))) {
    return res.status(400).json({ error: 'generation_id is required and must be an integer' });
  }

  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'rating is required and must be an integer between 1 and 5' });
  }

  if (comment !== undefined && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment must be a string' });
  }

  next();
};

module.exports = {
  validateGenerateInput,
  validateFeedbackInput
};
