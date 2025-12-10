import { Router } from "express";
import { DatosController } from "../controllers/datosController.js";

const router = Router();

router.get("/search", DatosController.search);
router.get("/searchByTag", DatosController.searchByTag);
router.get("/filters", DatosController.filters);
router.get("/tags", DatosController.quickTags);
router.get("/all", DatosController.getAll);

export default router;
