const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer');  // Import Nodemailer
const app = express();

app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));

app.use(express.json());
mongoose.connect('mongodb://127.0.0.1:27017/Main_Blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema);


const EmailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});
const Email = mongoose.model('Email', EmailSchema);

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Post Route
app.post('/posts', async (req, res) => {
    const { author, category, content, url } = req.body;

    try {
        const newPost = new Post({
            author,
            category,
            content,
            url,
        });

        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(500).json({ message: 'Failed to create post' });
    }
});

// Get Posts Route
app.get('/posts', async (req, res) => {
    try {
      const posts = await Post.find(); 
      res.status(200).json(posts); 
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  });

// Subscribe Route
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if email is already in the database
        const existingEmail = await Email.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email is already subscribed' });
        }

        // Save the email to the database
        const newEmail = new Email({ email });
        await newEmail.save();

        // Send the email using Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: 'nisasiva17@gmail.com', 
                pass: 'dqdr norl ynxh bznf'   
            }
        });

        const mailOptions = {
            from: 'nisasiva17@gmail.com',
            to: email,
            subject: 'Subscription message',
            text: `Thanks For Subscription!!:)`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Error sending email:", err);
                return res.status(500).json({ message: 'Failed to send email notification' });
            }
            console.log('Email sent:', info.response);
        });

        res.status(200).json({ message: 'Subscription successful' });
    } catch (err) {
        console.error("Error subscribing:", err);
        res.status(500).json({ message: 'Subscription failed' });
    }
});

const PostSchema = new mongoose.Schema({
    author: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    url: { type: String, required: false },
});

const Post = mongoose.model('Post', PostSchema);

// Update Post Route
app.put('/posts/:id', async (req, res) => {
    const { id } = req.params;
    const { author, category, content, url } = req.body;

    try {
        const updatedPost = await Post.findByIdAndUpdate(id, {
            author,
            category,
            content,
            url
        }, { new: true });

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ message: 'Error updating post' });
    }
});

// Delete Post Route
app.delete('/posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPost = await Post.findByIdAndDelete(id);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Error deleting post' });
    }
});



// Start the server
app.listen(4000, () => {
    console.log('Server is running on port http://localhost:4000');
});