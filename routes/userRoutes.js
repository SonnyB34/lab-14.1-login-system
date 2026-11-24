import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Username, email, and password are required!' });
    }

    // Is email taken?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'A user with this email exists already!' });
    }

    const user = new User({ username, email, password });
    await user.save();

    // Send back user without password
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Same message for every error
    const generalError = { message: 'Incorrect email or password!' };

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json(generalError);
    }

    const passwordMatch = await user.isCorrectPassword(password);
    if (!passwordMatch) {
      return res.status(400).json(generalError);
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.json({
      token,
      user: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
