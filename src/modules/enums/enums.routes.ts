import { Router } from 'express';
import { EnumsController } from './enums.controller.js';

const router = Router();
const controller = new EnumsController();

router.get('/motif-consultation', controller.getMotifs);
router.get('/type-mastication', controller.getMasticationTypes);
router.get('/hygiene-bucco-dentaire', controller.getHygieneLevels);

export default router;
