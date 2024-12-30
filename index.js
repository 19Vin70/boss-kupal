const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", upload.single('profile'), (req, res) => {
    const { fullname, email, password } = req.body;
    const profilePic = req.file;

    if (!fullname || !email || !password || !profilePic) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const profilePicUrl = `/uploads/${profilePic.originalname}`;

    const userData = {
        fullname,
        email,
        password,
        profilePic: profilePicUrl
    };

    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ success: false, message: 'Error reading users file.' });
        }

        const users = data ? JSON.parse(data) : [];

        users.push(userData);

        fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error saving user data.' });
            }
            res.json({ success: true, message: 'User registered successfully!' });
        });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error reading users file.' });
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            return res.json({ success: true, message: 'Login successful!' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
    });
});

app.get("/users", (req, res) => {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error reading users file.' });
        }

        const users = JSON.parse(data);
        res.json({ success: true, users });
    });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));