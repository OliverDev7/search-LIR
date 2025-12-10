import express from "express";
const router = express.Router();

import searchRoutes from "./searchRoutes.js";
import formRoutes from "./formRoutes.js";

router.use("/api", searchRoutes);
router.use("/api", formRoutes);

export default router;