const { Router } = require("express");
const c = require("../controllers/incidentController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();
router.use(requireAuth);                                   // every incident route needs a login

router.get("/", c.list);                                    // managers and operators
router.get("/:id", c.getOne);
router.post("/", requireRole("operator"), c.create);        // operators only
router.post("/:id/assign", requireRole("operator"), c.assignToMe);
router.post("/:id/resolve", requireRole("operator"), c.resolve);
router.post("/:id/notes", requireRole("operator"), c.addNote);

module.exports = router;