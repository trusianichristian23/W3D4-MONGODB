import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authorRoutes from './routes/authors.js';
import blogPostRoutes from './routes/blogPosts.js';
import { authMiddleware } from './routes/authMiddleware.js'; // 👈 Importato middleware

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors()); 
app.use(express.json()); 

// Rotte degli autori (Login e Registrazione interni sono liberi, /me è protetto dentro il file delle rotte)
app.use('/authors', authorRoutes);

// 🔒 COMPITO: Tutti gli endpoint dei blog post ora richiedono obbligatoriamente il Token valido
app.use('/blogPosts', authMiddleware, blogPostRoutes); 

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('💾 Connesso al database MongoDB con successo!');
    app.listen(PORT, () => {
      console.log(`🚀 Server locale avviato con successo sulla porta: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Errore di connessione al database:', err.message);
  });