const { Router } = require("express");
const { collections } = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();
router.use(requireAuth, requireRole("manager"));
router.get("/collections", collections);

module.exports = router;