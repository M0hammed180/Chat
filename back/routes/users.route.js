const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/upload");
const users = require("../controllers/users.controller");
const verifyToken = require("../middleware/verfiyToken");

router.post("/register", upload.single("photo"), users.register);
router.patch("/edit", upload.single("photo"), verifyToken, users.edit);
router.post("/login", users.login);

router.post("/showuser", verifyToken, users.showUser);

module.exports = router;
