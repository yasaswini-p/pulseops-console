const { Router } = require("express");
const c = require("../controllers/analyticsController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();
router.use(requireAuth, requireRole("manager"));

router.get("/summary", c.summary);
router.get("/teams", c.teams);
router.get("/escalations", c.escalations);

module.exports = router;