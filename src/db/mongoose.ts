import { connect } from 'mongoose';

/**
 * Conexión a la base de datos MongoDB usando Mongoose.
 * Registra un mensaje si la conexión es exitosa o un error si falla.
 */
try {
  await connect(process.env.MONGODB_URL!);
  console.log('Connection to MongoDB server established');
} catch (error) {
  console.log(error);
}