import express from "express";
const router = express.Router();

import {
    getFirmDetails,
    getFilters,
    getAllFirms,
    getHealth,
    search,
    getQuickTags,
    searchByTag,
} from "../controllers/searchController.js";

router.get("/firm-details", getFirmDetails);
router.get("/filters", getFilters);
router.get("/all-firms", getAllFirms);
router.get("/health", getHealth);
router.get("/search", search);
router.get("/tags", getQuickTags);
router.get("/searchByTag", searchByTag);

export default router;