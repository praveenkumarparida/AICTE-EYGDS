const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = 'my_super_secret_123!';

mongoose.connect('mongodb+srv://praveenlaehss1:praveenlaehss1@cluster0.9sclu.mongodb.net/auctionDB?retryWrites=true&w=majority&appName=Cluster0');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

const auctionItemSchema = new mongoose.Schema({
  itemName: String,
  description: String,
  currentBid: Number,
  highestBidder: String,
  closingTime: Date,
  isClosed: { type: Boolean, default: false },
  bidHistory: [
    {
      bidder: String,
      bidAmount: Number,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});
const AuctionItem = mongoose.model('AuctionItem', auctionItemSchema);

const activeTokens = new Set();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !activeTokens.has(token)) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

app.post('/signup', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ userId: user._id, username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    activeTokens.add(token);
    res.json({ message: 'Signin successful', token });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
});

app.post('/logout', authenticate, (req, res) => {
  activeTokens.delete(req.headers.authorization?.split(' ')[1]);
  res.json({ message: 'Logout successful' });
});

app.post('/auction', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { itemName, description, startingBid, closingTime } = req.body;
    if (!itemName || !description || !startingBid || !closingTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newItem = new AuctionItem({
      itemName,
      description,
      currentBid: startingBid,
      highestBidder: '',
      closingTime
    });
    await newItem.save();
    res.status(201).json({ message: 'Auction item created', item: newItem });
  } catch (error) {
    console.error('Auction Post Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/bid/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { bid } = req.body;
    const item = await AuctionItem.findById(id);

    if (!item) return res.status(404).json({ message: 'Auction item not found' });
    if (item.isClosed) return res.status(400).json({ message: 'Auction is closed' });
    if (new Date() > new Date(item.closingTime)) {
      item.isClosed = true;
      await item.save();
      return res.json({ message: 'Auction closed', winner: item.highestBidder });
    }
    if (bid > item.currentBid) {
      item.currentBid = bid;
      item.highestBidder = req.user.username;
      item.bidHistory.push({ bidder: req.user.username, bidAmount: bid });
      await item.save();
      res.json({ message: 'Bid successful', item });
    } else {
      res.status(400).json({ message: 'Bid too low' });
    }
  } catch (error) {
    console.error('Bidding Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/bid-history/:id', async (req, res) => {
  try {
    const item = await AuctionItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Auction item not found' });
    res.json({ bidHistory: item.bidHistory });
  } catch (error) {
    console.error('Fetching Bid History Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
