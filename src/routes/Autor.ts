import express from 'express';
import controller from '../controllers/Autor';

const router = express.Router();

router.post('/', controller.createAutor);
router.get('/:autorId', controller.getAutor);
router.get('/', controller.getAllAutores);
router.put('/:autorId', controller.updateAutor);
router.delete('/:autorId', controller.deleteAutor);

export default router;