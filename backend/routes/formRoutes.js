import express from "express";
const router = express.Router();

import { getFormTags, submitForm, generateFormPDF } from "../controllers/formController.js";

router.get("/form-tags", getFormTags);
router.post("/form-submit", submitForm);
router.post("/form-pdf", generateFormPDF);

export default router;