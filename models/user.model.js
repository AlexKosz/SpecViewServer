const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // this will trigger Mongoose to try to create a unique index
      validate: {
        validator: (val) => /^([\w-.]+@([\w-]+\.)+[\w-]+)?$/.test(val),
        message: 'Please enter a valid email',
      },
    },
    phoneNumber: {
      type: Number,
      required: false,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be 8 characters or longer'],
    },
  },
  { timestamps: true },
);

// Ensure index creation
UserSchema.index({ email: 1 }, { unique: true });

UserSchema.virtual('confirmPassword')
  .get(() => this._confirmPassword)
  .set((value) => {
    this._confirmPassword = value;
  });

UserSchema.pre('validate', function (next) {
  if (this.password !== this.confirmPassword) {
    this.invalidate('confirmPassword', 'Password must match confirm password');
  }
  next();
});

UserSchema.pre('save', async function hashPasswordBeforeSave() {
  if (!this.isModified('password')) return;

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
});

module.exports = mongoose.model('User', UserSchema);
