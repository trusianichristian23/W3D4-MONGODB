// import express from 'express';
// import Author from '../models/author.js';
// import BlogPost from '../models/blogPost.js';
// import uploadCloud from '../config/cloudinaryConfig.js';
// import jwt from 'jsonwebtoken';
// import { authMiddleware } from './authMiddleware.js';

// const router = express.Router();

// // 🔑 COMPITO: POST /authors/login => Controlla credenziali e restituisce il token
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const author = await Author.findOne({ email });
//     if (!author) {
//       return res.status(401).json({ message: "Credenziali errate (Email non trovata)" });
//     }

//     const isMatch = await author.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Credenziali errate (Password errata)" });
//     }

//     // Genera il Token firmato
//     const token = jwt.sign({ id: author._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     res.status(200).json({ token });
//   } catch (error) {
//     res.status(500).json({ message: "Errore nel server durante il login", error: error.message });
//   }
// });

// // 🔑 COMPITO: GET /authors/me => Restituisce i dati dell'utente loggato usando il token
// router.get('/me', authMiddleware, async (req, res) => {
//   try {
//     res.status(200).json(req.author);
//   } catch (error) {
//     res.status(500).json({ message: "Errore nel recupero del profilo", error: error.message });
//   }
// });

// // GET /authors - Ottiene tutti gli autori con paginazione
// router.get('/', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skipIndex = (page - 1) * limit;

//     const totalAuthors = await Author.countDocuments();
//     const results = await Author.find().select('-password') 
//       .skip(skipIndex)
//       .limit(limit);

//     res.status(200).json({
//       authors: results,
//       currentPage: page,
//       totalPages: Math.ceil(totalAuthors / limit),
//       totalAuthors: totalAuthors
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Errore nel recupero degli autori", error: error.message });
//   }
// });

// // GET /authors/:id - Singolo autore
// router.get('/:id', async (req, res) => {
//   try {
//     const author = await Author.findById(req.params.id).select('-password');
//     if (!author) return res.status(404).json({ message: "Autore non trovato" });
//     res.status(200).json(author);
//   } catch (error) {
//     res.status(500).json({ message: "Errore nel recupero dell'autore", error: error.message });
//   }
// });

// // POST /authors - MODIFICATO PER IL COMPITO: Crea utente con password criptata
// router.post('/', async (req, res) => {
//   try {
//     const newAuthor = new Author(req.body);
//     const savedAuthor = await newAuthor.save();
    
//     const authorResponse = savedAuthor.toObject();
//     delete authorResponse.password; // Non mostriamo l'hash nel JSON di risposta

//     res.status(201).json(authorResponse);
//   } catch (error) {
//     res.status(400).json({ message: "Errore nella creazione dell'autore", error: error.message });
//   }
// });

// // PUT /authors/:id
// router.put('/:id', async (req, res) => {
//   try {
//     const updatedAuthor = await Author.findByIdAndUpdate(
//       req.params.id, 
//       req.body, 
//       { new: true, runValidators: true }
//     ).select('-password');
//     if (!updatedAuthor) return res.status(404).json({ message: "Autore non trovato" });
//     res.status(200).json(updatedAuthor);
//   } catch (error) {
//     res.status(400).json({ message: "Errore nell'aggiornamento dell'autore", error: error.message });
//   }
// });

// // DELETE /authors/:id
// router.delete('/:id', async (req, res) => {
//   try {
//     const deletedAuthor = await Author.findByIdAndDelete(req.params.id);
//     if (!deletedAuthor) return res.status(404).json({ message: "Autore non trovato" });
//     res.status(200).json({ message: "Autore eliminato con successo" });
//   } catch (error) {
//     res.status(500).json({ message: "Errore nella cancellazione dell'autore", error: error.message });
//   }
// });

// // GET /authors/:id/blogPosts
// router.get('/:id/blogPosts', async (req, res) => {
//   try {
//     const author = await Author.findById(req.params.id);
//     if (!author) return res.status(404).json({ message: "Autore non trovato" });

//     const authorPosts = await BlogPost.find({ author: author.email });
//     res.status(200).json(authorPosts);
//   } catch (error) {
//     res.status(500).json({ message: "Errore nel recupero dei post dell'autore", error: error.message });
//   }
// });

// // PATCH /authors/:authorId/avatar
// router.patch('/:authorId/avatar', uploadCloud.single('avatar'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "Nessun file caricato" });

//     const updatedAuthor = await Author.findByIdAndUpdate(
//       req.params.authorId,
//       { avatar: req.file.path },
//       { new: true }
//     ).select('-password');

//     if (!updatedAuthor) return res.status(404).json({ message: "Autore non trovato" });

//     res.status(200).json({ message: "Avatar aggiornato!", author: updatedAuthor });
//   } catch (error) {
//     res.status(500).json({ message: "Errore durante l'upload dell'avatar", error: error.message });
//   }
// });

// export default router;
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Author from '../models/author.js'; // Ricorda di includere l'estensione .js se usi ES Modules

const router = express.Router();

// 🔒 MIDDLEWARE DI AUTENTICAZIONE JWT
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token mancante o non valido.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Sessione scaduta o Token alterato.' });
    }
};

// 1. GET /authors -> Ritorna la lista per il frontend
router.get('/', async (req, res) => {
    try {
        const allAuthors = await Author.find({});
        // Invia la chiave "authors" esatta cercata dallo script.js
        res.json({ authors: allAuthors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. POST /authors -> Registrazione con password criptata
router.post('/', async (req, res) => {
    try {
        const { nome, cognome, email, password, dataDiNascita, avatar } = req.body;

        const existingAuthor = await Author.findOne({ email });
        if (existingAuthor) {
            return res.status(400).json({ message: 'Questa email è già registrata.' });
        }

        // Cifratura Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAuthor = new Author({
            nome,
            cognome,
            email,
            password: hashedPassword,
            dataDiNascita,
            avatar
        });

        await newAuthor.save();
        res.status(201).json(newAuthor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 3. POST /authors/login -> Effettua il login e restituisce il token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const author = await Author.findOne({ email });

        if (!author) {
            return res.status(404).json({ message: 'Autore non trovato.' });
        }

        const isMatch = await bcrypt.compare(password, author.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password errata.' });
        }

        const token = jwt.sign(
            { id: author._id, email: author.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. GET /authors/me -> Profilo protetto dell'utente autenticato
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const author = await Author.findById(req.user.id).select('-password');
        res.json(author);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Esporta il router usando la sintassi ES Modules predefinita richiesta dall'applicazione
export default router;