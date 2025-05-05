const Ajv = require('ajv');

const ajv = new Ajv();

const validateSchema = (schema) => {
  const validate = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validate(req.body);

    if (!valid) {
      console.log(validate.errors);
      //   return res.status(400).json({ errors: validate.errors });
    }
    next();
  };
};

module.exports = validateSchema;
