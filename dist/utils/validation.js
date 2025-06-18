// Phone validation middleware
export const validatePhone = (req, res, next) => {
    // Skip validation if phone is not provided or empty string
    if (!req.body.phone && req.body.phone !== '') {
        // If phone is not provided in update operation, allow it to proceed
        next();
        return;
    }
    // Empty string is valid (to clear a phone number)
    if (req.body.phone === '') {
        next();
        return;
    }
    // International phone number format: optional + followed by 10-15 digits
    // This allows formats like: +12345678901, 1234567890
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(req.body.phone)) {
        res.status(400).json({
            error: "Invalid phone number format. Phone should be 10-15 digits and may include a '+' prefix."
        });
        return;
    }
    next();
};
